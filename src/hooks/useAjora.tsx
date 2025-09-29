import { useEffect, useReducer, useRef } from "react";
import { IMessage } from "../types";
import ApiService, {
  AgentEvent,
  ErrorEvent,
  FunctionResponseEvent,
  IsThinkingEvent,
  SourcesEvent,
  SuggestionsEvent,
  ThreadTitleEvent,
  UserEvent,
} from "../api";
import { v4 as uuidv4 } from "uuid";
import { mergeFunctionCallsAndResponses } from "../utils/index";
import { Thread } from "../Thread/types";
import { ajoraReducer } from "./ajoraReducer";

interface Messages {
  [key: string]: IMessage[];
}

export type AjoraState = {
  stream: IMessage[];
  messages: Messages;
  threads: Thread[];
  activeThreadId: string | null;
  isThinking: boolean;
  loadEarlier: boolean;
  isLoadingMessages?: boolean;
  mode: string;
  baseUrl: string;
  apiService: ApiService | null;
  isComplete: boolean;
};

export type Ajora = AjoraState & {
  messagesByThread: IMessage[];
  submitQuery: (query: UserEvent) => Promise<void>;
  addNewThread: () => void;
  switchThread: (threadId: string) => void;
  getThreads: () => void;
  getMessages: (threadId: string) => void;
  setIsThinking: (isThinking: boolean) => void;
  setIsLoadingEarlier: (loadEarlier: boolean) => void;
  setMode: (mode: string) => void;
  regenerateMessage: (message: IMessage) => void;
  setIsComplete: (isComplete: boolean) => void;
};

const useAjora = ({
  initialMessages = {},
  initialThreads = [],
  baseUrl = "http://localhost:3000",
}: {
  initialMessages?: Record<string, IMessage[]>;
  initialThreads?: Thread[];
  baseUrl?: string;
}) => {
  const [ajora, dispatch] = useReducer(ajoraReducer, {
    stream: [],
    isThinking: false,
    messages: mergeFunctionCallsAndResponses(initialMessages),
    threads: initialThreads,
    activeThreadId: null,
    loadEarlier: false,
    isLoadingMessages: false,
    mode: "assistant",
    baseUrl,
    apiService: null,
    isComplete: false,
  });

  const apiServiceRef = useRef<ApiService | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialize the API service
  useEffect(() => {
    if (!apiServiceRef.current) {
      apiServiceRef.current = new ApiService({ baseUrl });
    }
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [baseUrl]);

  // Get the threads from the API service
  useEffect(() => {
    if (apiServiceRef.current) {
      getThreads();
    }
  }, [apiServiceRef.current]);

  // Get the threads from the API service
  const getThreads = async () => {
    try {
      if (!apiServiceRef.current) {
        console.warn("[Ajora]: API service not initialized");
        return;
      }
      const threads = await apiServiceRef.current.getThreads();
      dispatch({ type: "SET_THREADS", payload: { threads: threads ?? [] } });
    } catch (error) {
      console.error("[Ajora]: Error fetching threads:", error);
      dispatch({ type: "SET_THREADS", payload: { threads: [] } });
    }
  };

  // Get the messages for the active thread
  const getMessages = async (threadId: string) => {
    try {
      if (!apiServiceRef.current) {
        console.warn("[Ajora]: API service not initialized");
        return;
      }
      dispatch({ type: "SET_LOADING_MESSAGES", payload: { isLoading: true } });
      const messages = await apiServiceRef.current.getMessages(threadId);
      if (messages) {
        dispatch({
          type: "SET_MESSAGES",
          payload: { messages: messages ?? [], threadId },
        });
      }
    } catch (error) {
      console.error("[Ajora]: Error fetching messages:", error);
      // Set empty messages array on error
      dispatch({
        type: "SET_MESSAGES",
        payload: { messages: [], threadId },
      });
    } finally {
      dispatch({ type: "SET_LOADING_MESSAGES", payload: { isLoading: false } });
    }
  };

  // Auto-load messages when active thread changes and not yet loaded
  useEffect(() => {
    if (!ajora.activeThreadId) return;
    const threadId = ajora.activeThreadId;
    const hasMessages = (ajora.messages[threadId] || []).length > 0;
    if (!hasMessages) {
      getMessages(threadId);
    }
  }, [ajora.activeThreadId]);

  const submitQuery = async (query: UserEvent) => {
    let threadId = query.message.thread_id;

    // If no thread id, create a new thread and switch to it
    if (!threadId) {
      if (!apiServiceRef.current) {
        throw new Error("[Ajora]: API service not initialized.");
      }

      const newThread = await apiServiceRef.current.createThread();
      if (!newThread?.id) {
        throw new Error("[Ajora]: Failed to create a new thread.");
      }
      threadId = newThread.id;
      // Ensure the new thread is available in state immediately
      dispatch({
        type: "SET_THREADS",
        payload: { threads: [...(ajora.threads || []), newThread] as Thread[] },
      });
      // Switch to the newly created thread immediately
      dispatch({ type: "SWITCH_THREAD", payload: { threadId } });
    } else {
      // If the thread id is not the active thread, switch to it
      if (threadId !== ajora.activeThreadId) {
        dispatch({ type: "SWITCH_THREAD", payload: { threadId } });
      }
    }

    // Ensure outgoing message has the thread id
    query.message.thread_id = threadId;

    // Add the current mode to the query
    const queryWithMode = { ...query, mode: ajora.mode };

    dispatch({
      type: "ADD_MESSAGES",
      payload: { messages: [query.message] },
    });
    dispatch({ type: "SET_THINKING", payload: { isThinking: true } });

    try {
      if (!apiServiceRef.current) {
        throw new Error("[Ajora]: API service not initialized.");
      }

      const cleanup = apiServiceRef.current.streamResponse(queryWithMode, {
        onIsThinking: (isThinking: IsThinkingEvent) => {
          console.log("[Ajora]: Is thinking received:", isThinking);
          dispatch({
            type: "SET_THINKING",
            payload: { isThinking: isThinking.is_thinking },
          });
        },

        onChunk: (agentEvent: AgentEvent) => {
          if (agentEvent?.type === "message") {
            dispatch({
              type: "UPDATE_STREAMING_MESSAGE",
              payload: { message: agentEvent.message },
            });
          }
        },

        onFunctionResponse: (fr: FunctionResponseEvent) => {
          const { message } = fr;

          if (!message._id || !message.thread_id) return;
          dispatch({
            type: "ADD_FUNCTION_RESPONSE",
            payload: { message },
          });
        },
        onThreadTitle: (tt: ThreadTitleEvent) => {
          console.log("[Ajora]: Thread title received:", tt);
          const incoming = tt.threadTitle as any;
          // Server may send a plain title string or a full Thread
          const normalizedThread: Thread | null =
            typeof incoming === "string"
              ? { id: threadId, title: incoming }
              : incoming && incoming.id
                ? incoming
                : null;

          if (!normalizedThread) return;

          dispatch({
            type: "UPDATE_THREAD_TITLE",
            payload: { thread: normalizedThread },
          });
        },
        onSources: (sources: SourcesEvent) => {
          console.log("[Ajora]: Sources received:", sources);
        },
        onSuggestions: (suggestions: SuggestionsEvent) => {
          console.log("[Ajora]: Suggestions received:", suggestions);
        },
        onComplete: () => {
          if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
          }
          console.log("[Ajora]: Streaming complete!");
          dispatch({ type: "SET_COMPLETE", payload: { isComplete: true } });
        },
        onError: (err: ErrorEvent) => {
          console.error("[Ajora]: Error in streaming:", err);
          const errorMessage: IMessage = {
            _id: uuidv4(),
            thread_id: threadId,
            role: "model",
            parts: [
              {
                text: "An error occurred. Please try again.",
              },
            ],
            created_at: new Date().toISOString(),
          };
          console.error("[Ajora]:", errorMessage);
          dispatch({
            type: "ADD_MESSAGES",
            payload: { messages: [errorMessage] },
          });
          if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
          }
          dispatch({ type: "SET_THINKING", payload: { isThinking: false } });
          dispatch({ type: "SET_COMPLETE", payload: { isComplete: false } });
        },
      });
      cleanupRef.current = cleanup ?? null;
    } catch (error) {
      console.error("[Ajora]:", error);
      dispatch({ type: "SET_THINKING", payload: { isThinking: false } });
      const errorMessage: IMessage = {
        _id: uuidv4(),
        role: "model",
        thread_id: threadId,
        parts: [{ text: "Failed to send message. Please try again." }],
        created_at: new Date().toISOString(),
      };
      dispatch({
        type: "ADD_MESSAGES",
        payload: { messages: [errorMessage] },
      });
    }
  };

  const regenerateMessage = (message: IMessage) => {
    if (!message._id || !ajora.activeThreadId) {
      throw new Error(
        "[Ajora]: Message ID and thread ID are required to regenerate."
      );
    }
    const currentThreadMessages = ajora.messages[ajora.activeThreadId] || [];
    const messageIndex = currentThreadMessages.findIndex(
      (m) => m._id === message._id
    );
    if (messageIndex === -1) {
      throw new Error("[Ajora]: Message not found.");
    }
    const userMessage = currentThreadMessages
      .slice(messageIndex)
      .find((m) => m.role === "user");
    if (!userMessage) {
      throw new Error(
        "[Ajora]: Could not find the corresponding user message to regenerate."
      );
    }
    dispatch({
      type: "REMOVE_MESSAGE",
      payload: { messageId: message._id, threadId: ajora.activeThreadId },
    });
    dispatch({
      type: "REMOVE_MESSAGE",
      payload: { messageId: userMessage._id, threadId: ajora.activeThreadId },
    });
    submitQuery({ type: "regenerate", message: userMessage, mode: ajora.mode });
  };

  // Compute messagesByThread from the current active thread
  const messagesByThread = ajora.activeThreadId
    ? ajora.messages[ajora.activeThreadId] || []
    : [];

  return {
    ...ajora,
    messagesByThread,
    submitQuery,
    addNewThread: () => dispatch({ type: "ADD_NEW_THREAD" }),
    switchThread: (threadId: string) =>
      dispatch({ type: "SWITCH_THREAD", payload: { threadId } }),
    getThreads,
    getMessages,
    setIsThinking: (isThinking: boolean) =>
      dispatch({ type: "SET_THINKING", payload: { isThinking } }),
    setIsLoadingEarlier: (loadEarlier: boolean) =>
      dispatch({ type: "SET_LOADING_EARLIER", payload: { loadEarlier } }),
    setMode: (mode: string) =>
      dispatch({ type: "SET_MODE", payload: { mode } }),
    regenerateMessage,
    setIsComplete: (isComplete: boolean) =>
      dispatch({ type: "SET_COMPLETE", payload: { isComplete } }),
  };
};

export default useAjora;
