import { useEffect, useReducer, useRef } from "react";
import { IMessage, ThreadItem } from "../types";
import ApiService from "../api";

import { nanoid } from "nanoid";
import {
  createDefaultThread,
  mergeFunctionCallsAndResponses,
} from "../utils/index";
import { Ajora } from "../Ajora";

interface Messages {
  [key: string]: IMessage[];
}

type AjoraState = {
  stream: IMessage[];
  messages: Messages;
  threads: ThreadItem[];
  activeThreadId: string | null;
  isThinking: boolean;
  loadEarlier: boolean;
  mode: string;
  baseUrl: string;
  apiService: ApiService | null;
};

export type Ajora = AjoraState & {
  // Ajora actions
  submitQuery: (message: IMessage, threadId: string) => Promise<void>;
  addNewThread: () => void;
  switchThread: (threadId: string) => void;
  setIsThinking: (isThinking: boolean) => void;
  setIsLoadingEarlier: (loadEarlier: boolean) => void;
  setMode: (mode: string) => void;
  regenerateMessage: (message: IMessage) => void;
};

type Action =
  | {
      type: "ADD_MESSAGES";
      payload: { messages: IMessage[]; threadId: string };
    }
  | {
      type: "ADD_PENDING_MESSAGE";
      payload: { message: IMessage; threadId: string };
    }
  | {
      type: "UPDATE_STREAMING_MESSAGE";
      payload: { message: IMessage; threadId: string };
    }
  | {
      type: "UPDATE_THREAD_TITLE";
      payload: { title: string; threadId: string };
    }
  | { type: "ADD_NEW_THREAD" }
  | { type: "SWITCH_THREAD"; payload: { threadId: string } }
  | { type: "SET_THINKING"; payload: { isThinking: boolean } }
  | { type: "SET_LOADING_EARLIER"; payload: { loadEarlier: boolean } }
  | { type: "SET_MODE"; payload: { mode: string } }
  | { type: "CLEAR_STREAM" }
  | {
      type: "REMOVE_MESSAGE";
      payload: { messageId: string | number; threadId: string };
    };

// Our reducer function handles all state updates
const ajoraReducer = (state: AjoraState, action: Action): AjoraState => {
  switch (action.type) {
    case "ADD_MESSAGES": {
      const { messages, threadId } = action.payload;
      const existingMessages = state.messages[threadId] || [];
      const updatedMessages = [...messages, ...existingMessages];
      return {
        ...state,
        messages: { ...state.messages, [threadId]: updatedMessages },
      };
    }

    case "UPDATE_STREAMING_MESSAGE": {
      const { message, threadId } = action.payload;
      const threadMessages = state.messages[threadId] || [];

      // Find and update the existing streaming message by its _id
      const messageIndex = threadMessages.findIndex(
        (msg) => msg._id === message._id
      );

      let updatedMessages: IMessage[];
      if (messageIndex !== -1) {
        updatedMessages = [...threadMessages];
        updatedMessages[messageIndex] = { ...message };
      } else {
        // This case should ideally not happen if a pending message was added first
        updatedMessages = [message, ...threadMessages];
      }

      return {
        ...state,
        messages: { ...state.messages, [threadId]: updatedMessages },
      };
    }
    case "ADD_NEW_THREAD": {
      const thread = createDefaultThread();
      return {
        ...state,
        threads: [...state.threads, thread],
        activeThreadId: thread.id,
        messages: { ...state.messages, [thread.id]: [] },
      };
    }
    case "UPDATE_THREAD_TITLE": {
      const { title, threadId } = action.payload;
      const threads = [...state.threads];
      const threadIndex = threads.findIndex((t) => t.id === threadId);
      threads[threadIndex].title = title;
      return { ...state, threads };
    }
    case "SWITCH_THREAD": {
      return { ...state, activeThreadId: action.payload.threadId };
    }
    case "SET_THINKING": {
      return { ...state, isThinking: action.payload.isThinking };
    }
    case "SET_LOADING_EARLIER": {
      return { ...state, loadEarlier: action.payload.loadEarlier };
    }
    case "SET_MODE": {
      return { ...state, mode: action.payload.mode };
    }
    case "CLEAR_STREAM": {
      return { ...state, stream: [] };
    }
    case "REMOVE_MESSAGE": {
      const { messageId, threadId } = action.payload;
      const currentMessages = state.messages[threadId] || [];
      const filteredMessages = currentMessages.filter(
        (m) => m._id !== messageId
      );
      return {
        ...state,
        messages: { ...state.messages, [threadId]: filteredMessages },
      };
    }
    default:
      return state;
  }
};

const useAjora = ({
  initialMessages = {},
  initialThreads = [],
  baseUrl = "http://localhost:3000",
}: {
  initialMessages?: Record<string, IMessage[]>;
  initialThreads?: ThreadItem[];
  baseUrl?: string;
}) => {
  const [ajora, dispatch] = useReducer(ajoraReducer, {
    stream: [],
    messages: mergeFunctionCallsAndResponses(initialMessages),
    threads: initialThreads,
    activeThreadId: null,
    isThinking: false,
    loadEarlier: false,
    mode: "auto",
    baseUrl: baseUrl,
    apiService: null,
  });

  // Keep a ref to the API service instance
  const apiServiceRef = useRef<ApiService | null>(null);

  // Use a ref for the streaming cleanup function
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialize API service only once
  useEffect(() => {
    if (!apiServiceRef.current) {
      apiServiceRef.current = new ApiService({ baseUrl });
    }
    return () => {
      // Cleanup any active stream on unmount
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [baseUrl]);

  // --- Actions/Functions ---
  const submitQuery = async (message: IMessage, thread_id: string) => {
    let threadId = thread_id || "";
    if (!!!thread_id) {
      console.warn("[Ajora]: Thread ID is required to submit a query.");
      if (ajora.activeThreadId) {
        threadId = ajora.activeThreadId;
      } else {
        const newThread = createDefaultThread();
        threadId = newThread.id;
        dispatch({ type: "SWITCH_THREAD", payload: { threadId: threadId } });
      }
    }

    dispatch({
      type: "ADD_MESSAGES",
      payload: { messages: [message], threadId },
    });

    try {
      if (!apiServiceRef.current) {
        throw new Error("[Ajora]: API service not initialized.");
      }
      let accumulatedText = "";
      let streamingMessageId: string | number = "";

      const cleanup = apiServiceRef.current.streamResponse(message, {
        onChunk: (chunk: IMessage) => {
          const chunkText = chunk?.parts?.[0]?.text ?? "";
          accumulatedText += chunkText;
          if (!streamingMessageId) {
            streamingMessageId = chunk._id;
          }
          const updatedMessage: IMessage = {
            ...chunk,
            _id: streamingMessageId,
            parts: [{ text: accumulatedText }],
          };

          dispatch({
            type: "UPDATE_STREAMING_MESSAGE",
            payload: { message: updatedMessage, threadId },
          });
        },
        onComplete: (completedMessage: IMessage) => {
          // Final update for the completed message
          dispatch({
            type: "UPDATE_STREAMING_MESSAGE",
            payload: { message: completedMessage, threadId },
          });
        },
        onThreadTitle: (title: string) => {
          console.log(
            "title update in submitQuery",
            title,
            "and threadId",
            threadId
          );
          dispatch({
            type: "UPDATE_THREAD_TITLE",
            payload: { title, threadId },
          });
        },
        onError: (error: Error) => {
          console.error("[Ajora]: Error in streaming:", error);
          const errorMessage: IMessage = {
            _id: "error",
            role: "model",
            parts: [
              {
                text: `An error occurred. Please check your internet connection and try again.`,
              },
            ],
            createdAt: new Date(),
          };
          dispatch({
            type: "ADD_MESSAGES",
            payload: { messages: [errorMessage], threadId },
          });
          dispatch({ type: "SET_THINKING", payload: { isThinking: false } });
        },
      });
      // Store the cleanup function in a ref
      cleanupRef.current = cleanup;
    } catch (error: any) {
      console.error("[Ajora]: Failed to submit query:", error);
      dispatch({ type: "SET_THINKING", payload: { isThinking: false } });
      const errorMessage: IMessage = {
        _id: nanoid(),
        role: "model",
        parts: [{ text: `Failed to send message. Please try again.` }],
        createdAt: new Date(),
      };
      dispatch({
        type: "ADD_MESSAGES",
        payload: { messages: [errorMessage], threadId },
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

    // Find the user's message that preceded the one to regenerate
    const userMessage = currentThreadMessages
      .slice(messageIndex)
      .find((m) => m.role === "user");

    if (!userMessage) {
      throw new Error(
        "[Ajora]: Could not find the corresponding user message to regenerate."
      );
    }

    // Remove the message we are regenerating
    dispatch({
      type: "REMOVE_MESSAGE",
      payload: { messageId: message._id, threadId: ajora.activeThreadId },
    });

    // Remove the prev message to send again
    dispatch({
      type: "REMOVE_MESSAGE",
      payload: { messageId: userMessage._id, threadId: ajora.activeThreadId },
    });

    // Submit a new query with the original user message
    submitQuery(userMessage, ajora.activeThreadId);
  };

  // Expose the state and dispatch actions
  return {
    // State
    ...ajora,
    // Actions
    submitQuery,
    addNewThread: () => dispatch({ type: "ADD_NEW_THREAD" }),
    switchThread: (threadId: string) =>
      dispatch({ type: "SWITCH_THREAD", payload: { threadId } }),
    setIsThinking: (isThinking: boolean) =>
      dispatch({ type: "SET_THINKING", payload: { isThinking } }),
    setIsLoadingEarlier: (loadEarlier: boolean) =>
      dispatch({ type: "SET_LOADING_EARLIER", payload: { loadEarlier } }),
    setMode: (mode: string) =>
      dispatch({ type: "SET_MODE", payload: { mode } }),
    regenerateMessage,
  };
};

export default useAjora;
