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
import uuid from "react-native-uuid";
import { mergeFunctionCallsAndResponses } from "../utils/index";
import { Thread } from "../Thread/types";
import { ajoraReducer } from "./ajoraReducer";
import { FileData } from "@google/genai";

interface Messages {
  [key: string]: IMessage[];
}

export interface Attachement extends FileData {
  progress?: number;
  isUploaded?: boolean;
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
  attachement: Attachement | undefined;
  isRecording: boolean;
};

export type Ajora = AjoraState & {
  messagesByThread: IMessage[];
  submitQuery: (query: UserEvent) => Promise<void>;
  stopStreaming: () => void;
  addNewThread: () => void;
  switchThread: (threadId: string) => void;
  getThreads: () => void;
  getMessages: (threadId: string) => void;
  setIsThinking: (isThinking: boolean) => void;
  setIsLoadingEarlier: (loadEarlier: boolean) => void;
  setMode: (mode: string) => void;
  regenerateMessage: (message: IMessage) => void;
  setIsComplete: (isComplete: boolean) => void;
  setAttachement: (attachement: Attachement) => void;
  updateAttachement: (attachement: Attachement) => void;
  clearAttachement: () => void;
  setIsRecording: (isRecording: boolean) => void;
};

const useAjora = ({
  initialMessages = {},
  initialThreads = [],
  baseUrl = "http://localhost:3000",
  bearerToken,
  debug = false,
}: {
  initialMessages?: Record<string, IMessage[]>;
  initialThreads?: Thread[];
  baseUrl?: string;
  bearerToken?: string;
  debug?: boolean;
}) => {
  const [ajora, dispatch] = useReducer(ajoraReducer, {
    stream: [],
    isThinking: false,
    messages: mergeFunctionCallsAndResponses(initialMessages) as Messages,
    threads: initialThreads,
    activeThreadId: null,
    loadEarlier: false,
    isLoadingMessages: false,
    mode: "assistant",
    baseUrl,
    apiService: null,
    isComplete: true,
    attachement: undefined,
    isRecording: false,
  });

  const apiServiceRef = useRef<ApiService | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize the API service
  useEffect(() => {
    if (!apiServiceRef.current) {
      apiServiceRef.current = new ApiService({ baseUrl, bearerToken, debug });
    } else {
      // Update existing API service with new config
      apiServiceRef.current.updateConfig({ bearerToken, debug });
    }
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [baseUrl, bearerToken, debug]);

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
      // Debug logs right after fetching threads
      try {
        const isArray = Array.isArray(threads);
        const length = isArray ? (threads as Thread[]).length : 0;
        const sample = isArray ? (threads as Thread[])[0] : threads;
      } catch (logErr) {
        console.warn("[Ajora]: Failed to log threads debug info", logErr);
      }
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
      const resp = await apiServiceRef.current.getMessages(threadId);
      const messages = resp?.messages;
      if (Array.isArray(messages)) {
        dispatch({
          type: "SET_MESSAGES",
          payload: { messages: messages ?? ([] as IMessage[]), threadId },
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

    // If the query is a tool confirmation, do not add the message to the messages array as it already exists in the messages array
    if (query.type !== "tool_confirmation") {
      dispatch({
        type: "ADD_MESSAGES",
        payload: { messages: [query.message] },
      });
    }
    // Do not set isComplete locally; rely on server 'complete' events
    dispatch({ type: "SET_THINKING", payload: { isThinking: true } });

    try {
      if (!apiServiceRef.current) {
        throw new Error("[Ajora]: API service not initialized.");
      }

      // Abort any existing stream before starting a new one
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch {}
      }
      abortControllerRef.current = new AbortController();

      const cleanup = apiServiceRef.current.streamResponse(queryWithMode, {
        onIsThinking: (isThinking: IsThinkingEvent) => {
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
          console.info("[Ajora]: Sources received:", sources);
        },
        onSuggestions: (suggestions: SuggestionsEvent) => {
          console.info("[Ajora]: Suggestions received:", suggestions);
        },
        onComplete: (evt) => {
          const complete = (evt as any)?.is_complete === true;
          if (complete) {
            if (cleanupRef.current) {
              cleanupRef.current();
              cleanupRef.current = null;
            }
            // Clear abort controller on normal completion
            abortControllerRef.current = null;
          }
          // Update completion state based on server signal
          dispatch({ type: "SET_COMPLETE", payload: { isComplete: complete } });
        },
        onError: (err: ErrorEvent) => {
          console.error("[Ajora]: Error in streaming:", err);
          const errorMessage: IMessage = {
            _id: uuid.v4(),
            thread_id: threadId,
            role: "model",
            parts: [
              {
                text: "An error occurred. Please try again.",
              },
            ],
            createdAt: new Date().toISOString(),
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
          // Clear abort controller on error; server controls isComplete signal
          abortControllerRef.current = null;
          dispatch({ type: "SET_THINKING", payload: { isThinking: false } });
        },
        abortSignal: abortControllerRef.current.signal,
      });
      cleanupRef.current = cleanup ?? null;
    } catch (error) {
      console.error("[Ajora]:", error);
      dispatch({ type: "SET_THINKING", payload: { isThinking: false } });
      const errorMessage: IMessage = {
        _id: uuid.v4(),
        role: "model",
        thread_id: threadId,
        parts: [{ text: "Failed to send message. Please try again." }],
        createdAt: new Date().toISOString(),
      };
      dispatch({
        type: "ADD_MESSAGES",
        payload: { messages: [errorMessage] },
      });
    }
  };

  const stopStreaming = () => {
    // Signal abortion to the SSE connection
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {}
      abortControllerRef.current = null;
    }
    // Additionally run local cleanup to close EventSource and handlers
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    dispatch({ type: "SET_THINKING", payload: { isThinking: false } });
    // On client-initiated abort, server cannot send a final event after the stream is closed.
    // To exit streaming state, mark complete=true locally.
    dispatch({ type: "SET_COMPLETE", payload: { isComplete: true } });
  };

  const regenerateMessage = (message: IMessage) => {
    if (!message._id || !ajora.activeThreadId) {
      throw new Error(
        "[Ajora]: Message ID and thread ID are required to regenerate."
      );
    }
    const currentThreadMessages = ajora.messages[ajora.activeThreadId] || [];
    const messageIndex = currentThreadMessages.findIndex(
      (m: IMessage) => m._id === message._id
    );
    if (messageIndex === -1) {
      throw new Error("[Ajora]: Message not found.");
    }
    const userMessage = currentThreadMessages
      .slice(messageIndex)
      .find((m: IMessage) => m.role === "user");
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
    stopStreaming,
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
    setAttachement: (attachement: Attachement) =>
      dispatch({ type: "SET_ATTACHEMENT", payload: { attachement } }),
    updateAttachement: (attachement: Attachement) =>
      dispatch({ type: "UPDATE_ATTACHEMENT", payload: { attachement } }),
    clearAttachement: () => dispatch({ type: "CLEAR_ATTACHEMENT" }),
    setIsRecording: (isRecording: boolean) =>
      dispatch({ type: "SET_IS_RECORDING", payload: { isRecording } }),
  };
};

export default useAjora;
