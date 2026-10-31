/**
 * @vitest-environment jsdom
 */
import React from "react";
import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useRenderCustomMessages } from "../use-render-custom-messages";
import { useAjora } from "../../providers/AjoraProvider";
import { useAjoraChatConfiguration } from "../../providers/AjoraChatConfigurationProvider";

vi.mock("../../providers/AjoraProvider", () => ({
  useAjora: vi.fn(),
}));

vi.mock("../../providers/AjoraChatConfigurationProvider", () => ({
  useAjoraChatConfiguration: vi.fn(),
}));

const mockUseAjora = useAjora as ReturnType<typeof vi.fn>;
const mockUseConfig = useAjoraChatConfiguration as ReturnType<typeof vi.fn>;

function makeMockAjora(renderCustomMessages: any[] = []) {
  return {
    renderCustomMessages,
    getRunIdForMessage: vi.fn(() => "run-1"),
    getAgent: vi.fn(() => ({
      agentId: "default",
      messages: [
        { id: "msg-1", role: "user" },
        { id: "msg-2", role: "assistant" },
      ],
    })),
    getStateByRun: vi.fn(() => ({ count: 42 })),
  };
}

describe("useRenderCustomMessages", () => {
  beforeEach(() => {
    mockUseConfig.mockReturnValue({
      agentId: "default",
      threadId: "thread-1",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no config provider exists", () => {
    mockUseAjora.mockReturnValue({ ajora: makeMockAjora() });
    mockUseConfig.mockReturnValue(null);

    const { result } = renderHook(() => useRenderCustomMessages());
    expect(result.current).toBeNull();
  });

  it("returns a render function when config exists", () => {
    mockUseAjora.mockReturnValue({ ajora: makeMockAjora() });

    const { result } = renderHook(() => useRenderCustomMessages());
    expect(typeof result.current).toBe("function");
  });

  it("returns null from render function when no renderers registered", () => {
    mockUseAjora.mockReturnValue({ ajora: makeMockAjora([]) });

    const { result } = renderHook(() => useRenderCustomMessages());
    const rendered = result.current!({
      message: { id: "msg-1", role: "user", content: "" },
      position: "before",
    });

    expect(rendered).toBeNull();
  });

  it("returns null when agent is not found", () => {
    const ajora = makeMockAjora([{ render: () => <span>custom</span> }]);
    ajora.getAgent.mockReturnValue(undefined as any);
    mockUseAjora.mockReturnValue({ ajora });

    const { result } = renderHook(() => useRenderCustomMessages());
    const rendered = result.current!({
      message: { id: "msg-1", role: "user", content: "" },
      position: "before",
    });

    expect(rendered).toBeNull();
  });

  it("renders with the first matching renderer", () => {
    const RenderComponent = vi.fn(({ position }: any) => (
      <span>{position}</span>
    ));

    mockUseAjora.mockReturnValue({
      ajora: makeMockAjora([{ render: RenderComponent }]),
    });

    const { result } = renderHook(() => useRenderCustomMessages());
    const rendered = result.current!({
      message: { id: "msg-1", role: "user", content: "" },
      position: "before",
    });

    expect(rendered).not.toBeNull();
    expect(rendered!.type).toBe(RenderComponent);
    expect(rendered!.props).toEqual(
      expect.objectContaining({
        message: { id: "msg-1", role: "user", content: "" },
        position: "before",
        runId: "run-1",
        agentId: "default",
      })
    );
  });

  it("passes correct message index properties", () => {
    const RenderComponent = vi.fn(() => <span>test</span>);
    mockUseAjora.mockReturnValue({
      ajora: makeMockAjora([{ render: RenderComponent }]),
    });

    const { result } = renderHook(() => useRenderCustomMessages());
    const rendered = result.current!({
      message: { id: "msg-2", role: "assistant", content: "" },
      position: "after",
    });

    expect(rendered).not.toBeNull();
    expect(rendered!.props).toEqual(
      expect.objectContaining({
        messageIndex: 1,
        numberOfMessagesInRun: 2,
      })
    );
  });

  describe("agent-scoped filtering", () => {
    it("includes renderers with no agentId", () => {
      const RenderComponent = vi.fn(() => <span>global</span>);
      mockUseAjora.mockReturnValue({
        ajora: makeMockAjora([{ render: RenderComponent }]),
      });

      const { result } = renderHook(() => useRenderCustomMessages());
      const rendered = result.current!({
        message: { id: "msg-1", role: "user", content: "" },
        position: "before",
      });

      expect(rendered).not.toBeNull();
    });

    it("includes renderers matching the current agentId", () => {
      const RenderComponent = vi.fn(() => <span>agent</span>);
      mockUseAjora.mockReturnValue({
        ajora: makeMockAjora([{ agentId: "default", render: RenderComponent }]),
      });

      const { result } = renderHook(() => useRenderCustomMessages());
      const rendered = result.current!({
        message: { id: "msg-1", role: "user", content: "" },
        position: "before",
      });

      expect(rendered).not.toBeNull();
    });

    it("excludes renderers for a different agentId", () => {
      const RenderComponent = vi.fn(() => <span>other</span>);
      mockUseAjora.mockReturnValue({
        ajora: makeMockAjora([{ agentId: "other-agent", render: RenderComponent }]),
      });

      const { result } = renderHook(() => useRenderCustomMessages());
      const rendered = result.current!({
        message: { id: "msg-1", role: "user", content: "" },
        position: "before",
      });

      expect(rendered).toBeNull();
    });

    it("prefers agent-specific renderer over global", () => {
      const globalFn = vi.fn(() => <span>global</span>);
      const agentFn = vi.fn(() => <span>agent</span>);

      mockUseAjora.mockReturnValue({
        ajora: makeMockAjora([
          { render: globalFn },
          { agentId: "default", render: agentFn },
        ]),
      });

      const { result } = renderHook(() => useRenderCustomMessages());

      // Agent-specific sorts first, so it should be the one rendered
      const rendered = result.current!({
        message: { id: "msg-1", role: "user", content: "" },
        position: "before",
      });
      expect(rendered).not.toBeNull();
      expect(rendered!.type).toBe(agentFn);
    });
  });

  it("skips renderers with null render", () => {
    const RenderComponent = vi.fn(() => <span>fallback</span>);

    mockUseAjora.mockReturnValue({
      ajora: makeMockAjora([
        { render: null },
        { render: RenderComponent },
      ]),
    });

    const { result } = renderHook(() => useRenderCustomMessages());
    const rendered = result.current!({
      message: { id: "msg-1", role: "user", content: "" },
      position: "before",
    });

    expect(rendered).not.toBeNull();
    expect(rendered!.type).toBe(RenderComponent);
  });
});
