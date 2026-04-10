/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, cleanup } from "@testing-library/react";
import { useFrontendTool } from "../hooks/use-frontend-tool";
import { useAjora } from "../providers/AjoraProvider";
import { z } from "zod";

vi.mock("../providers/AjoraProvider", () => ({
  useAjora: vi.fn(),
}));

const mockUseAjora = useAjora as ReturnType<typeof vi.fn>;

describe("useFrontendTool", () => {
  let addToolMock: ReturnType<typeof vi.fn>;
  let removeToolMock: ReturnType<typeof vi.fn>;
  let getToolMock: ReturnType<typeof vi.fn>;
  let setRenderToolCallsMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    addToolMock = vi.fn();
    removeToolMock = vi.fn();
    getToolMock = vi.fn(() => undefined);
    setRenderToolCallsMock = vi.fn();

    mockUseAjora.mockReturnValue({
      ajora: {
        addTool: addToolMock,
        removeTool: removeToolMock,
        getTool: getToolMock,
        setRenderToolCalls: setRenderToolCallsMock,
        renderToolCalls: [],
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("tool registration", () => {
    it("registers a tool on mount", () => {
      const tool = {
        name: "myTool",
        description: "A test tool",
        handler: async () => "result",
      };

      const TestComponent: React.FC = () => {
        useFrontendTool(tool);
        return <div>Test</div>;
      };

      render(<TestComponent />);

      expect(addToolMock).toHaveBeenCalledTimes(1);
      expect(addToolMock).toHaveBeenCalledWith(
        expect.objectContaining({ name: "myTool" }),
      );
    });

    it("registers tool with parameters", () => {
      const tool = {
        name: "paramTool",
        description: "Tool with params",
        parameters: z.object({ query: z.string() }),
        handler: async ({ query }: { query: string }) => `searched: ${query}`,
      };

      const TestComponent: React.FC = () => {
        useFrontendTool(tool);
        return null;
      };

      render(<TestComponent />);

      expect(addToolMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "paramTool",
          description: "Tool with params",
        }),
      );
    });
  });

  describe("tool cleanup on unmount", () => {
    it("removes the tool when the component unmounts", () => {
      const tool = {
        name: "cleanupTool",
        description: "A tool that cleans up",
        handler: async () => "result",
      };

      const TestComponent: React.FC = () => {
        useFrontendTool(tool);
        return <div>Test</div>;
      };

      const { unmount } = render(<TestComponent />);
      expect(addToolMock).toHaveBeenCalledTimes(1);

      unmount();
      expect(removeToolMock).toHaveBeenCalledWith("cleanupTool", undefined);
    });
  });

  describe("tool override warning", () => {
    it("warns and overrides when tool with same name already exists", () => {
      getToolMock.mockReturnValue({ name: "existingTool" });
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const tool = {
        name: "existingTool",
        description: "Override test",
        handler: async () => "new result",
      };

      const TestComponent: React.FC = () => {
        useFrontendTool(tool);
        return null;
      };

      render(<TestComponent />);

      expect(removeToolMock).toHaveBeenCalledWith("existingTool", undefined);
      expect(addToolMock).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe("agent-scoped tools", () => {
    it("registers tool with agentId", () => {
      const tool = {
        name: "agentTool",
        description: "Agent-scoped tool",
        agentId: "myAgent",
        handler: async () => "result",
      };

      const TestComponent: React.FC = () => {
        useFrontendTool(tool);
        return null;
      };

      render(<TestComponent />);

      expect(addToolMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "agentTool",
          agentId: "myAgent",
        }),
      );
    });

    it("removes tool with agentId on unmount", () => {
      const tool = {
        name: "agentTool",
        description: "Agent-scoped tool",
        agentId: "myAgent",
        handler: async () => "result",
      };

      const TestComponent: React.FC = () => {
        useFrontendTool(tool);
        return null;
      };

      const { unmount } = render(<TestComponent />);
      unmount();

      expect(removeToolMock).toHaveBeenCalledWith("agentTool", "myAgent");
    });
  });

  describe("render registration", () => {
    it("registers tool render function via setRenderToolCalls", () => {
      const renderFn = () => <div>Rendered</div>;
      const tool = {
        name: "renderTool",
        description: "Tool with render",
        parameters: z.object({ msg: z.string() }),
        handler: async () => "result",
        render: renderFn,
      };

      const TestComponent: React.FC = () => {
        useFrontendTool(tool);
        return null;
      };

      render(<TestComponent />);

      expect(setRenderToolCallsMock).toHaveBeenCalled();
      const renderToolCalls = setRenderToolCallsMock.mock.calls[0][0];
      expect(renderToolCalls).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "renderTool" }),
        ]),
      );
    });
  });
});
