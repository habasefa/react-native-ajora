/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, cleanup, screen } from "@testing-library/react";
import { useRenderToolCall } from "../use-render-tool-call";
import { useAjora } from "../../providers/AjoraProvider";
import { useAjoraChatConfiguration } from "../../providers/AjoraChatConfigurationProvider";
import { ToolCallStatus } from "../../../core";

vi.mock("../../providers/AjoraProvider", () => ({
  useAjora: vi.fn(),
}));

vi.mock("../../providers/AjoraChatConfigurationProvider", () => ({
  useAjoraChatConfiguration: vi.fn(),
}));

const mockUseAjora = useAjora as ReturnType<typeof vi.fn>;
const mockUseConfig = useAjoraChatConfiguration as ReturnType<typeof vi.fn>;

function makeToolCall(name: string, args: any = {}, id = `tc-${name}`) {
  return {
    id,
    type: "function" as const,
    function: {
      name,
      arguments: JSON.stringify(args),
    },
  };
}

describe("useRenderToolCall", () => {
  let subscribeMock: ReturnType<typeof vi.fn>;
  let renderToolCallsRef: any[];

  beforeEach(() => {
    renderToolCallsRef = [];
    subscribeMock = vi.fn((handlers: any) => {
      return { unsubscribe: vi.fn() };
    });

    mockUseAjora.mockReturnValue({
      ajora: {
        renderToolCalls: renderToolCallsRef,
        subscribe: subscribeMock,
      },
      executingToolCallIds: new Set<string>(),
    });

    mockUseConfig.mockReturnValue({
      agentId: "default",
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  let hookResult: ReturnType<typeof useRenderToolCall>;

  const TestComponent: React.FC<{
    toolCall: any;
    toolMessage?: any;
  }> = ({ toolCall, toolMessage }) => {
    const renderToolCall = useRenderToolCall();
    hookResult = renderToolCall;

    const rendered = renderToolCall({ toolCall, toolMessage });
    return <div data-testid="wrapper">{rendered}</div>;
  };

  describe("no renderer registered", () => {
    it("returns null when no render config matches", () => {
      const toolCall = makeToolCall("unknownTool");

      render(<TestComponent toolCall={toolCall} />);

      const wrapper = screen.getByTestId("wrapper");
      expect(wrapper.children.length).toBe(0);
    });
  });

  describe("exact match rendering", () => {
    it("renders with inProgress status when no toolMessage and not executing", () => {
      const renderFn = vi.fn(({ status }: any) => (
        <div data-testid="tool-render">{status}</div>
      ));
      renderToolCallsRef.push({ name: "myTool", render: renderFn });

      const toolCall = makeToolCall("myTool", { q: "hello" });

      render(<TestComponent toolCall={toolCall} />);

      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "myTool",
          status: ToolCallStatus.InProgress,
          args: { q: "hello" },
          result: undefined,
        }),
        expect.anything(),
      );
    });

    it("renders with executing status when tool is executing", () => {
      const renderFn = vi.fn(({ status }: any) => (
        <div data-testid="tool-render">{status}</div>
      ));
      renderToolCallsRef.push({ name: "myTool", render: renderFn });

      mockUseAjora.mockReturnValue({
        ajora: {
          renderToolCalls: renderToolCallsRef,
          subscribe: subscribeMock,
        },
        executingToolCallIds: new Set(["tc-myTool"]),
      });

      const toolCall = makeToolCall("myTool", {}, "tc-myTool");

      render(<TestComponent toolCall={toolCall} />);

      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ToolCallStatus.Executing,
          result: undefined,
        }),
        expect.anything(),
      );
    });

    it("renders with complete status when toolMessage is provided", () => {
      const renderFn = vi.fn(({ status, result }: any) => (
        <div data-testid="tool-render">
          {status}: {result}
        </div>
      ));
      renderToolCallsRef.push({ name: "myTool", render: renderFn });

      const toolCall = makeToolCall("myTool");
      const toolMessage = { content: "done!" };

      render(<TestComponent toolCall={toolCall} toolMessage={toolMessage} />);

      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ToolCallStatus.Complete,
          result: "done!",
        }),
        expect.anything(),
      );
    });
  });

  describe("wildcard renderer", () => {
    it("falls back to wildcard renderer when no exact match", () => {
      const wildcardFn = vi.fn(({ name }: any) => (
        <div data-testid="wildcard">{name}</div>
      ));
      renderToolCallsRef.push({ name: "*", render: wildcardFn });

      const toolCall = makeToolCall("anyTool");

      render(<TestComponent toolCall={toolCall} />);

      expect(wildcardFn).toHaveBeenCalledWith(
        expect.objectContaining({ name: "anyTool" }),
        expect.anything(),
      );
    });

    it("prefers exact match over wildcard", () => {
      const exactFn = vi.fn(() => <div>exact</div>);
      const wildcardFn = vi.fn(() => <div>wildcard</div>);
      renderToolCallsRef.push(
        { name: "*", render: wildcardFn },
        { name: "specificTool", render: exactFn },
      );

      const toolCall = makeToolCall("specificTool");

      render(<TestComponent toolCall={toolCall} />);

      expect(exactFn).toHaveBeenCalled();
      expect(wildcardFn).not.toHaveBeenCalled();
    });
  });

  describe("agent-scoped renderer priority", () => {
    it("prefers agent-specific renderer over global renderer", () => {
      const globalFn = vi.fn(() => <div>global</div>);
      const agentFn = vi.fn(() => <div>agent</div>);
      renderToolCallsRef.push(
        { name: "sharedTool", render: globalFn },
        { name: "sharedTool", agentId: "default", render: agentFn },
      );

      const toolCall = makeToolCall("sharedTool");

      render(<TestComponent toolCall={toolCall} />);

      expect(agentFn).toHaveBeenCalled();
      expect(globalFn).not.toHaveBeenCalled();
    });
  });
});
