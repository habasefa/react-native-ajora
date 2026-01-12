import React from "react";
import renderer, { act } from "react-test-renderer";
import useAjora from "../hooks/useAjora";
import { IMessage, ThreadItem } from "../types";
import ApiService from "../api";

// Mock the API service
jest.mock("../api");
jest.mock("nanoid", () => ({
  nanoid: () => "test-id-123",
}));

// Mock the utils
jest.mock("../utils/index", () => ({
  createDefaultThread: () => ({
    id: "test-thread-123",
    title: "Test Thread",
    lastMessage: undefined,
    timestamp: new Date("2024-01-01"),
  }),
  mergeFunctionCallsAndResponses: (messages: any) => messages,
}));

// Test wrapper component to test the hook
interface TestWrapperProps {
  hookArgs?: any;
  onRender?: (hookResult: any) => void;
}

const TestWrapper: React.FC<TestWrapperProps> = ({
  hookArgs = {},
  onRender,
}) => {
  const hookResult = useAjora(hookArgs);

  React.useEffect(() => {
    if (onRender) {
      onRender(hookResult);
    }
  }, [hookResult, onRender]);

  return null;
};

// Helper to create a test component that exposes the hook result
const createTestComponent = (hookArgs: any = {}) => {
  let hookResult: any;

  const TestComponent = () => {
    hookResult = useAjora(hookArgs);
    return null;
  };

  return { TestComponent, getResult: () => hookResult };
};

describe("useAjora", () => {
  let mockApiService: jest.Mocked<ApiService>;
  let mockStreamResponse: jest.Mock;
  let hookResult: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStreamResponse = jest.fn(() => () => {});
    mockApiService = {
      streamResponse: mockStreamResponse,
    } as any;

    (ApiService as jest.MockedClass<typeof ApiService>).mockImplementation(
      () => mockApiService
    );
  });

  const renderHook = (hookArgs: any = {}) => {
    const { TestComponent, getResult } = createTestComponent(hookArgs);
    let component: any;

    act(() => {
      component = renderer.create(<TestComponent />);
    });

    return {
      result: {
        current: getResult(),
        rerender: (newArgs: any) => {
          const { TestComponent: NewTestComponent, getResult: getNewResult } =
            createTestComponent(newArgs);
          act(() => {
            component.update(<NewTestComponent />);
          });
          return getNewResult();
        },
      },
      unmount: () => component.unmount(),
    };
  };

  describe("Initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook();

      expect(result.current.stream).toEqual([]);
      expect(result.current.messages).toEqual({});
      expect(result.current.threads).toEqual([]);
      expect(result.current.activeThreadId).toBeNull();
      expect(result.current.isThinking).toBe(false);
      expect(result.current.loadEarlier).toBe(false);
      expect(result.current.mode).toBe("auto");
      expect(result.current.baseUrl).toBe("http://localhost:3000");
    });

    it("should initialize with custom values", () => {
      const initialMessages = {
        "thread-1": [
          {
            _id: "1",
            role: "user" as const,
            parts: [{ text: "Hello" }],
            createdAt: new Date(),
          },
        ],
      };
      const initialThreads: ThreadItem[] = [
        {
          id: "thread-1",
          title: "Test Thread",
          lastMessage: undefined,
          timestamp: new Date(),
        },
      ];

      const { result } = renderHook({
        initialMessages,
        initialThreads,
        baseUrl: "https://api.example.com",
      });

      expect(result.current.messages).toEqual(initialMessages);
      expect(result.current.threads).toEqual(initialThreads);
      expect(result.current.baseUrl).toBe("https://api.example.com");
    });

    it("should create API service instance on mount", () => {
      renderHook({ baseUrl: "https://custom-api.com" });

      expect(ApiService).toHaveBeenCalledWith({
        baseUrl: "https://custom-api.com",
      });
    });
  });

  describe("Thread Management", () => {
    it("should add a new thread", () => {
      const { result } = renderHook();

      act(() => {
        result.current.addNewThread();
      });

      expect(result.current.threads).toHaveLength(1);
      expect(result.current.threads[0].id).toBe("test-thread-123");
      expect(result.current.activeThreadId).toBe("test-thread-123");
      expect(result.current.messages["test-thread-123"]).toEqual([]);
    });

    it("should switch to an existing thread", () => {
      const initialThreads: ThreadItem[] = [
        {
          id: "thread-1",
          title: "Thread 1",
          lastMessage: undefined,
          timestamp: new Date(),
        },
        {
          id: "thread-2",
          title: "Thread 2",
          lastMessage: undefined,
          timestamp: new Date(),
        },
      ];

      const { result } = renderHook({ initialThreads });

      act(() => {
        result.current.switchThread("thread-2");
      });

      expect(result.current.activeThreadId).toBe("thread-2");
    });
  });

  describe("Message Management", () => {
    it("should add messages to a thread through submitQuery", async () => {
      const { result } = renderHook();

      const message: IMessage = {
        _id: "1",
        role: "user",
        parts: [{ text: "Hello" }],
        createdAt: new Date(),
      };

      act(() => {
        result.current.addNewThread();
      });

      await act(async () => {
        result.current.submitQuery(message, "test-thread-123");
      });

      expect(result.current.messages["test-thread-123"]).toHaveLength(1);
      expect(result.current.messages["test-thread-123"][0].parts[0].text).toBe(
        "Hello"
      );
    });

    it("should handle message regeneration which removes and resubmits", async () => {
      const { result } = renderHook();

      const userMessage: IMessage = {
        _id: "user-1",
        role: "user",
        parts: [{ text: "Hello" }],
        createdAt: new Date(),
      };

      const modelMessage: IMessage = {
        _id: "model-1",
        role: "model",
        parts: [{ text: "Hi there!" }],
        createdAt: new Date(),
      };

      act(() => {
        result.current.addNewThread();
      });

      // Add messages through submitQuery
      await act(async () => {
        result.current.submitQuery(userMessage, "test-thread-123");
      });

      // Simulate adding a model response
      act(() => {
        result.current.messages["test-thread-123"].push(modelMessage);
      });

      expect(result.current.messages["test-thread-123"]).toHaveLength(2);

      // Regenerate the model message
      await act(async () => {
        result.current.regenerateMessage(modelMessage);
      });

      // Should have removed the model message and resubmitted
      expect(mockStreamResponse).toHaveBeenCalled();
    });
  });

  describe("State Management", () => {
    it("should set thinking state", () => {
      const { result } = renderHook();

      act(() => {
        result.current.setIsThinking(true);
      });

      expect(result.current.isThinking).toBe(true);

      act(() => {
        result.current.setIsThinking(false);
      });

      expect(result.current.isThinking).toBe(false);
    });

    it("should set loading earlier state", () => {
      const { result } = renderHook();

      act(() => {
        result.current.setIsLoadingEarlier(true);
      });

      expect(result.current.loadEarlier).toBe(true);

      act(() => {
        result.current.setIsLoadingEarlier(false);
      });

      expect(result.current.loadEarlier).toBe(false);
    });

    it("should set mode", () => {
      const { result } = renderHook();

      act(() => {
        result.current.setMode("manual");
      });

      expect(result.current.mode).toBe("manual");
    });

    it("should have empty stream by default", () => {
      const { result } = renderHook();

      expect(result.current.stream).toEqual([]);
    });
  });

  describe("submitQuery", () => {
    it("should throw error when threadId is not provided", async () => {
      const { result } = renderHook();

      const message: IMessage = {
        _id: "1",
        role: "user",
        parts: [{ text: "Hello" }],
        createdAt: new Date(),
      };

      await expect(
        act(async () => {
          await result.current.submitQuery(message, "");
        })
      ).rejects.toThrow("[Ajora]: Thread ID is required to submit a query.");
    });

    it("should add pending message and start streaming", async () => {
      const { result } = renderHook();

      const message: IMessage = {
        _id: "1",
        role: "user",
        parts: [{ text: "Hello" }],
        createdAt: new Date(),
      };

      act(() => {
        result.current.addNewThread();
      });

      await act(async () => {
        result.current.submitQuery(message, "test-thread-123");
      });

      // Check that pending message was added
      const messages = result.current.messages["test-thread-123"];
      expect(messages).toHaveLength(1);
      expect(messages[0].pending).toBe(true);
      expect(messages[0]._id).toBe("test-id-123");

      // Check that streamResponse was called
      expect(mockStreamResponse).toHaveBeenCalledWith(message, {
        onChunk: expect.any(Function),
        onComplete: expect.any(Function),
        onError: expect.any(Function),
      });
    });

    it("should handle streaming chunks", async () => {
      const { result } = renderHook();

      const message: IMessage = {
        _id: "1",
        role: "user",
        parts: [{ text: "Hello" }],
        createdAt: new Date(),
      };

      act(() => {
        result.current.addNewThread();
      });

      await act(async () => {
        result.current.submitQuery(message, "test-thread-123");
      });

      // Simulate streaming chunks
      const onChunk = mockStreamResponse.mock.calls[0][1].onChunk;
      const onComplete = mockStreamResponse.mock.calls[0][1].onComplete;

      act(() => {
        onChunk({
          _id: "test-id-123",
          role: "model",
          parts: [{ text: "Hi" }],
          createdAt: new Date(),
        });
      });

      act(() => {
        onChunk({
          _id: "test-id-123",
          role: "model",
          parts: [{ text: " there!" }],
          createdAt: new Date(),
        });
      });

      act(() => {
        onComplete({
          _id: "test-id-123",
          role: "model",
          parts: [{ text: "Hi there!" }],
          createdAt: new Date(),
        });
      });

      // Check that the message was updated with accumulated text
      const messages = result.current.messages["test-thread-123"];
      expect(messages[0].parts).toHaveLength(2);
      expect(messages[0].parts[1].text).toBe("Hi there!");
      expect(result.current.isThinking).toBe(false);
    });

    it("should handle streaming errors", async () => {
      const { result } = renderHook();

      const message: IMessage = {
        _id: "1",
        role: "user",
        parts: [{ text: "Hello" }],
        createdAt: new Date(),
      };

      act(() => {
        result.current.addNewThread();
      });

      await act(async () => {
        result.current.submitQuery(message, "test-thread-123");
      });

      const onError = mockStreamResponse.mock.calls[0][1].onError;

      act(() => {
        onError(new Error("Network error"));
      });

      // Check that error message was added
      const messages = result.current.messages["test-thread-123"];
      expect(messages).toHaveLength(2);
      expect(messages[1].role).toBe("model");
      expect(messages[1].parts[0].text).toContain("An error occurred");
      expect(result.current.isThinking).toBe(false);
    });

    it("should handle API service not initialized error", async () => {
      // Mock ApiService to return null
      (ApiService as jest.MockedClass<typeof ApiService>).mockImplementation(
        () => null as any
      );

      const { result } = renderHook();

      const message: IMessage = {
        _id: "1",
        role: "user",
        parts: [{ text: "Hello" }],
        createdAt: new Date(),
      };

      act(() => {
        result.current.addNewThread();
      });

      await act(async () => {
        result.current.submitQuery(message, "test-thread-123");
      });

      // Check that error message was added
      const messages = result.current.messages["test-thread-123"];
      expect(messages).toHaveLength(2);
      expect(messages[1].role).toBe("model");
      expect(messages[1].parts[0].text).toContain("Failed to send message");
      expect(result.current.isThinking).toBe(false);
    });
  });

  describe("regenerateMessage", () => {
    it("should throw error when message ID is not provided", () => {
      const { result } = renderHook();

      const message: IMessage = {
        _id: "",
        role: "model",
        parts: [{ text: "Hello" }],
        createdAt: new Date(),
      };

      expect(() => {
        result.current.regenerateMessage(message);
      }).toThrow(
        "[Ajora]: Message ID and thread ID are required to regenerate."
      );
    });

    it("should throw error when no active thread", () => {
      const { result } = renderHook();

      const message: IMessage = {
        _id: "1",
        role: "model",
        parts: [{ text: "Hello" }],
        createdAt: new Date(),
      };

      expect(() => {
        result.current.regenerateMessage(message);
      }).toThrow(
        "[Ajora]: Message ID and thread ID are required to regenerate."
      );
    });

    it("should regenerate a message successfully", async () => {
      const { result } = renderHook();

      const userMessage: IMessage = {
        _id: "user-1",
        role: "user",
        parts: [{ text: "Hello" }],
        createdAt: new Date(),
      };

      const modelMessage: IMessage = {
        _id: "model-1",
        role: "model",
        parts: [{ text: "Hi there!" }],
        createdAt: new Date(),
      };

      act(() => {
        result.current.addNewThread();
      });

      // Add messages through submitQuery
      await act(async () => {
        result.current.submitQuery(userMessage, "test-thread-123");
      });

      // Manually add model message to simulate the state
      act(() => {
        result.current.messages["test-thread-123"].push(modelMessage);
      });

      await act(async () => {
        result.current.regenerateMessage(modelMessage);
      });

      // Check that submitQuery was called (streamResponse should be called)
      expect(mockStreamResponse).toHaveBeenCalled();
    });

    it("should throw error when message not found", () => {
      const { result } = renderHook();

      const message: IMessage = {
        _id: "non-existent",
        role: "model",
        parts: [{ text: "Hello" }],
        createdAt: new Date(),
      };

      act(() => {
        result.current.addNewThread();
      });

      expect(() => {
        result.current.regenerateMessage(message);
      }).toThrow("[Ajora]: Message not found.");
    });

    it("should throw error when no corresponding user message found", () => {
      const { result } = renderHook();

      const modelMessage: IMessage = {
        _id: "model-1",
        role: "model",
        parts: [{ text: "Hello" }],
        createdAt: new Date(),
      };

      act(() => {
        result.current.addNewThread();
        // Manually add model message to simulate the state
        result.current.messages["test-thread-123"] = [modelMessage];
      });

      expect(() => {
        result.current.regenerateMessage(modelMessage);
      }).toThrow(
        "[Ajora]: Could not find the corresponding user message to regenerate."
      );
    });
  });

  describe("Cleanup", () => {
    it("should cleanup stream on unmount", () => {
      const mockCleanup = jest.fn();
      mockStreamResponse.mockReturnValue(mockCleanup);

      const { result, unmount } = renderHook();

      act(() => {
        result.current.addNewThread();
      });

      act(() => {
        result.current.submitQuery(
          {
            _id: "1",
            role: "user",
            parts: [{ text: "Hello" }],
            createdAt: new Date(),
          },
          "test-thread-123"
        );
      });

      // Unmount the component
      unmount();

      expect(mockCleanup).toHaveBeenCalled();
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete message flow", async () => {
      const { result } = renderHook();

      const userMessage: IMessage = {
        _id: "user-1",
        role: "user",
        parts: [{ text: "Hello" }],
        createdAt: new Date(),
      };

      act(() => {
        result.current.addNewThread();
      });

      // Submit query
      await act(async () => {
        result.current.submitQuery(userMessage, "test-thread-123");
      });

      // Check that message was added
      expect(result.current.messages["test-thread-123"]).toHaveLength(1);
      expect(result.current.messages["test-thread-123"][0].pending).toBe(true);

      // Simulate streaming response
      const onChunk = mockStreamResponse.mock.calls[0][1].onChunk;
      const onComplete = mockStreamResponse.mock.calls[0][1].onComplete;

      act(() => {
        onChunk({
          _id: "test-id-123",
          role: "model",
          parts: [{ text: "Hi there!" }],
          createdAt: new Date(),
        });
      });

      act(() => {
        onComplete({
          _id: "test-id-123",
          role: "model",
          parts: [{ text: "Hi there!" }],
          createdAt: new Date(),
        });
      });

      // Check final state
      expect(result.current.isThinking).toBe(false);
    });
  });
});
