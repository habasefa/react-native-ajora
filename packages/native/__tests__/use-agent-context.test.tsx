/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, cleanup } from "@testing-library/react";
import { useAgentContext, type AgentContextInput } from "../hooks/use-agent-context";
import { useAjora } from "../providers/AjoraProvider";

vi.mock("../providers/AjoraProvider", () => ({
  useAjora: vi.fn(),
}));

const mockUseAjora = useAjora as ReturnType<typeof vi.fn>;

describe("useAgentContext", () => {
  let addContextMock: ReturnType<typeof vi.fn>;
  let removeContextMock: ReturnType<typeof vi.fn>;
  let contextIdCounter: number;

  beforeEach(() => {
    contextIdCounter = 0;
    addContextMock = vi.fn(() => `context-${++contextIdCounter}`);
    removeContextMock = vi.fn();

    mockUseAjora.mockReturnValue({
      ajora: {
        addContext: addContextMock,
        removeContext: removeContextMock,
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("context registration", () => {
    it("adds context on mount", () => {
      const TestComponent: React.FC<{ context: AgentContextInput }> = ({
        context,
      }) => {
        useAgentContext(context);
        return <div>Test</div>;
      };

      render(
        <TestComponent
          context={{ description: "test context", value: "test value" }}
        />,
      );

      expect(addContextMock).toHaveBeenCalledTimes(1);
      expect(addContextMock).toHaveBeenCalledWith({
        description: "test context",
        value: "test value",
      });
    });
  });

  describe("context cleanup on unmount", () => {
    it("removes the context when the component unmounts", () => {
      const TestComponent: React.FC<{ context: AgentContextInput }> = ({
        context,
      }) => {
        useAgentContext(context);
        return <div>Test</div>;
      };

      const { unmount } = render(
        <TestComponent
          context={{ description: "test context", value: "test value" }}
        />,
      );

      expect(addContextMock).toHaveBeenCalledTimes(1);
      const addedContextId = addContextMock.mock.results[0]?.value;

      unmount();

      expect(removeContextMock).toHaveBeenCalledTimes(1);
      expect(removeContextMock).toHaveBeenCalledWith(addedContextId);
    });
  });

  describe("re-render idempotence", () => {
    it("does not re-add context on re-render with same values", () => {
      const TestComponent: React.FC<{
        context: AgentContextInput;
        counter: number;
      }> = ({ context, counter }) => {
        useAgentContext(context);
        return <div>Counter: {counter}</div>;
      };

      const context: AgentContextInput = {
        description: "stable",
        value: "stable value",
      };

      const { rerender } = render(
        <TestComponent context={context} counter={0} />,
      );
      expect(addContextMock).toHaveBeenCalledTimes(1);

      rerender(<TestComponent context={context} counter={1} />);
      expect(addContextMock).toHaveBeenCalledTimes(1);
    });

    it("re-adds context when value changes", () => {
      const TestComponent: React.FC<{ value: string }> = ({ value }) => {
        useAgentContext({ description: "stable", value });
        return <div>{value}</div>;
      };

      const { rerender } = render(<TestComponent value="v1" />);
      expect(addContextMock).toHaveBeenCalledTimes(1);
      const firstContextId = addContextMock.mock.results[0]?.value;

      rerender(<TestComponent value="v2" />);

      expect(removeContextMock).toHaveBeenCalledWith(firstContextId);
      expect(addContextMock).toHaveBeenCalledTimes(2);
      expect(addContextMock).toHaveBeenLastCalledWith({
        description: "stable",
        value: "v2",
      });
    });

    it("re-adds context when description changes", () => {
      const TestComponent: React.FC<{ description: string }> = ({
        description,
      }) => {
        useAgentContext({ description, value: "same value" });
        return <div>{description}</div>;
      };

      const { rerender } = render(<TestComponent description="first" />);
      expect(addContextMock).toHaveBeenCalledTimes(1);
      const firstContextId = addContextMock.mock.results[0]?.value;

      rerender(<TestComponent description="second" />);

      expect(removeContextMock).toHaveBeenCalledWith(firstContextId);
      expect(addContextMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("JSON serialization", () => {
    it("passes string values through unchanged", () => {
      const TestComponent: React.FC = () => {
        useAgentContext({
          description: "string context",
          value: "plain string",
        });
        return null;
      };

      render(<TestComponent />);

      expect(addContextMock).toHaveBeenCalledWith({
        description: "string context",
        value: "plain string",
      });
    });

    it("serializes object values to JSON", () => {
      const TestComponent: React.FC = () => {
        useAgentContext({
          description: "object context",
          value: { name: "John", age: 30 },
        });
        return null;
      };

      render(<TestComponent />);

      expect(addContextMock).toHaveBeenCalledWith({
        description: "object context",
        value: '{"name":"John","age":30}',
      });
    });

    it("serializes arrays to JSON", () => {
      const TestComponent: React.FC = () => {
        useAgentContext({
          description: "array context",
          value: [1, 2, 3],
        });
        return null;
      };

      render(<TestComponent />);

      expect(addContextMock).toHaveBeenCalledWith({
        description: "array context",
        value: "[1,2,3]",
      });
    });
  });

  describe("ajora not available", () => {
    it("does nothing when ajora is null", () => {
      mockUseAjora.mockReturnValue({ ajora: null });

      const TestComponent: React.FC = () => {
        useAgentContext({ description: "test", value: "test" });
        return null;
      };

      const { unmount } = render(<TestComponent />);
      expect(addContextMock).not.toHaveBeenCalled();
      unmount();
      expect(removeContextMock).not.toHaveBeenCalled();
    });
  });
});
