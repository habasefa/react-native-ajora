/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, cleanup, act } from "@testing-library/react";
import { useHumanInTheLoop } from "../hooks/use-human-in-the-loop";
import { useAjora } from "../providers/AjoraProvider";

vi.mock("../providers/AjoraProvider", () => ({
  useAjora: vi.fn(),
}));

const mockUseAjora = useAjora as ReturnType<typeof vi.fn>;

describe("useHumanInTheLoop", () => {
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
    it("registers a tool with a promise-based handler via useFrontendTool", () => {
      const RenderComp = (props: any) => <div>HITL</div>;

      const TestComponent: React.FC = () => {
        useHumanInTheLoop({
          name: "hitlTool",
          description: "Human approval",
          render: RenderComp,
        });
        return null;
      };

      render(<TestComponent />);

      expect(addToolMock).toHaveBeenCalledTimes(1);
      expect(addToolMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "hitlTool",
          description: "Human approval",
        }),
      );
    });

    it("registered handler creates a pending promise", async () => {
      const RenderComp = (props: any) => <div>HITL</div>;

      const TestComponent: React.FC = () => {
        useHumanInTheLoop({
          name: "pendingTool",
          description: "Waits for user",
          render: RenderComp,
        });
        return null;
      };

      render(<TestComponent />);

      // The handler that was registered should return a promise
      const registeredTool = addToolMock.mock.calls[0][0];
      expect(registeredTool.handler).toBeDefined();

      // Calling the handler should return a promise (won't resolve until respond is called)
      const handlerPromise = registeredTool.handler();
      expect(handlerPromise).toBeInstanceOf(Promise);
    });
  });

  describe("render registration", () => {
    it("registers a render function via setRenderToolCalls", () => {
      const RenderComp = (props: any) => <div>Rendered</div>;

      const TestComponent: React.FC = () => {
        useHumanInTheLoop({
          name: "renderHitl",
          description: "HITL with render",
          render: RenderComp,
        });
        return null;
      };

      render(<TestComponent />);

      expect(setRenderToolCallsMock).toHaveBeenCalled();
      const renderToolCalls = setRenderToolCallsMock.mock.calls[0][0];
      expect(renderToolCalls).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "renderHitl" }),
        ]),
      );
    });
  });

  describe("cleanup on unmount", () => {
    it("removes tool and renderer on unmount", () => {
      const RenderComp = (props: any) => <div>HITL</div>;

      const TestComponent: React.FC = () => {
        useHumanInTheLoop({
          name: "cleanupHitl",
          description: "Cleanup test",
          render: RenderComp,
        });
        return null;
      };

      const { unmount } = render(<TestComponent />);

      expect(addToolMock).toHaveBeenCalledTimes(1);

      unmount();

      // Tool removal via useFrontendTool
      expect(removeToolMock).toHaveBeenCalledWith("cleanupHitl", undefined);

      // Renderer removal via the useEffect cleanup in useHumanInTheLoop
      // setRenderToolCalls is called on unmount with the tool filtered out
      const lastCall =
        setRenderToolCallsMock.mock.calls[
          setRenderToolCallsMock.mock.calls.length - 1
        ];
      expect(lastCall).toBeDefined();
      const filtered = lastCall[0] as any[];
      expect(
        filtered.find((rc: any) => rc.name === "cleanupHitl"),
      ).toBeUndefined();
    });
  });

  describe("agent-scoped HITL", () => {
    it("registers tool with agentId", () => {
      const RenderComp = (props: any) => <div>Agent HITL</div>;

      const TestComponent: React.FC = () => {
        useHumanInTheLoop({
          name: "agentHitl",
          description: "Agent-scoped HITL",
          agentId: "myAgent",
          render: RenderComp,
        });
        return null;
      };

      render(<TestComponent />);

      expect(addToolMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "agentHitl",
          agentId: "myAgent",
        }),
      );
    });

    it("removes agent-scoped tool on unmount", () => {
      const RenderComp = (props: any) => <div>Agent HITL</div>;

      const TestComponent: React.FC = () => {
        useHumanInTheLoop({
          name: "agentHitl",
          description: "Agent-scoped HITL",
          agentId: "myAgent",
          render: RenderComp,
        });
        return null;
      };

      const { unmount } = render(<TestComponent />);
      unmount();

      expect(removeToolMock).toHaveBeenCalledWith("agentHitl", "myAgent");
    });
  });
});
