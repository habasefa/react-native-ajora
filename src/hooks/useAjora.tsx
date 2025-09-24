import { useEffect, useReducer, useRef, useState } from "react";
import { IMessage, ThreadItem } from "../types";
import ApiService from "../api";
import { nanoid } from "nanoid";
import { mergeFunctionCallsAndResponses } from "../utils/index";
import { SuggestionProps } from "../suggestion/types";
import { SourceProps } from "../source/types";

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
  messagesByThread: IMessage[];
  submitQuery: (message: IMessage, threadId: string) => Promise<void>;
  addNewThread: () => void;
  switchThread: (threadId: string) => void;
  getThreads: () => void;
  getMessages: (threadId: string) => void;
  getMessagesByThread: () => void;
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
    }
  | {
      type: "SET_THREADS";
      payload: { threads: ThreadItem[] };
    }
  | {
      type: "SET_MESSAGES";
      payload: { messages: IMessage[]; threadId: string };
    };

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
      const messageIndex = threadMessages.findIndex(
        (msg) => msg._id === message._id
      );
      let updatedMessages: IMessage[];
      if (messageIndex !== -1) {
        // Merge with existing message, preserving existing functionCall once set
        updatedMessages = [...threadMessages];

        const existingMessage = threadMessages[messageIndex];

        const findText = (parts?: IMessage["parts"]) =>
          parts?.find((p) => p.text)?.text;
        const findFunctionCall = (parts?: IMessage["parts"]) => {
          const fc = parts?.find((p) => p.functionCall)?.functionCall;
          if (!fc) return undefined;
          // Treat empty objects as absent
          const hasContent = Object.keys(fc).length > 0;
          return hasContent ? fc : undefined;
        };
        const findFunctionResponse = (parts?: IMessage["parts"]) =>
          parts?.find((p) => p.functionResponse)?.functionResponse;

        const incomingText = findText(message.parts);
        const incomingFnCall = findFunctionCall(message.parts);
        const incomingFnResp = findFunctionResponse(message.parts);

        const existingText = findText(existingMessage.parts);
        const existingFnCall = findFunctionCall(existingMessage.parts);
        const existingFnResp = findFunctionResponse(existingMessage.parts);

        // Prefer incoming values if provided, otherwise keep existing
        const mergedText = incomingText ?? existingText;
        const mergedFnCall = incomingFnCall ?? existingFnCall;
        const mergedFnResp = incomingFnResp ?? existingFnResp;

        const mergedParts = [] as IMessage["parts"]; // preserve order: text, functionCall, functionResponse
        if (mergedText) mergedParts.push({ text: mergedText });
        if (mergedFnCall) mergedParts.push({ functionCall: mergedFnCall });
        if (mergedFnResp) mergedParts.push({ functionResponse: mergedFnResp });

        updatedMessages[messageIndex] = {
          ...existingMessage,
          ...message,
          // Ensure stable _id and createdAt from existing when streaming
          _id: existingMessage._id,
          createdAt: existingMessage.createdAt,
          parts: mergedParts,
        };
      } else {
        updatedMessages = [message, ...threadMessages];
      }
      return {
        ...state,
        messages: { ...state.messages, [threadId]: updatedMessages },
      };
    }
    case "ADD_NEW_THREAD": {
      // Don't create thread locally - let server handle it
      // Just clear the active thread ID so the next message will create a new thread
      console.log("[Ajora]: ADD_NEW_THREAD - clearing activeThreadId");
      return {
        ...state,
        activeThreadId: null,
      };
    }
    case "UPDATE_THREAD_TITLE": {
      const { title, threadId } = action.payload;
      const threads = [...state.threads];
      const threadIndex = threads.findIndex((t) => t.id === threadId);
      if (threadIndex !== -1) {
        threads[threadIndex].title = title;
      } else {
        console.log("[Ajora]: Adding new thread:", threadId, title);
      }
      return { ...state, threads };
    }
    case "SWITCH_THREAD": {
      console.log("[Ajora]: Switching thread to:", action.payload.threadId);
      console.log(
        "[Ajora]: Previous activeThreadId was:",
        state.activeThreadId
      );
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
    case "SET_THREADS": {
      return { ...state, threads: action.payload.threads };
    }
    case "SET_MESSAGES": {
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.threadId]: action.payload.messages,
        },
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
    baseUrl,
    apiService: null,
  });

  const apiServiceRef = useRef<ApiService | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!apiServiceRef.current) {
      apiServiceRef.current = new ApiService({ baseUrl });
    }
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [baseUrl]);

  useEffect(() => {
    if (apiServiceRef.current) {
      console.info("[Ajora]: Getting threads...");
      getThreads();
    }
  }, [apiServiceRef.current, ajora.messages]);

  useEffect(() => {
    if (ajora.activeThreadId) {
      getMessages(ajora.activeThreadId);
    }
  }, [ajora.activeThreadId]);

  // Auto-select the first thread only on initial load, not when creating new threads
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  useEffect(() => {
    if (!ajora.activeThreadId && ajora.threads.length > 0 && !hasAutoSelected) {
      console.log("[Ajora]: Auto-selecting first thread:", ajora.threads[0].id);
      dispatch({
        type: "SWITCH_THREAD",
        payload: { threadId: ajora.threads[0].id },
      });
      setHasAutoSelected(true);
    }
  }, [ajora.threads, ajora.activeThreadId, hasAutoSelected]);

  const getThreads = async () => {
    try {
      if (!apiServiceRef.current) {
        console.warn("[Ajora]: API service not initialized");
        return;
      }
      const threads = await apiServiceRef.current.getThreads();
      console.log("[Ajora]: Threads received:", threads);
      dispatch({ type: "SET_THREADS", payload: { threads: threads ?? [] } });
    } catch (error) {
      console.error("[Ajora]: Error fetching threads:", error);
      // Set empty threads array on error to avoid undefined state
      dispatch({ type: "SET_THREADS", payload: { threads: [] } });
    }
  };

  const getMessages = async (threadId: string) => {
    try {
      if (!apiServiceRef.current) {
        console.warn("[Ajora]: API service not initialized");
        return;
      }
      const messages = await apiServiceRef.current.getMessages(threadId);
      if (messages) {
        // Apply function call merging to properly display function calls in history
        const mergedMessages = mergeFunctionCallsAndResponses(messages);
        dispatch({
          type: "SET_MESSAGES",
          payload: { messages: mergedMessages ?? [], threadId },
        });
      }
    } catch (error) {
      console.error("[Ajora]: Error fetching messages:", error);
      // Set empty messages array on error
      dispatch({
        type: "SET_MESSAGES",
        payload: { messages: [], threadId },
      });
    }
  };

  const getMessagesByThread = () => {
    try {
      if (ajora.activeThreadId) {
        getMessages(ajora.activeThreadId);
      }
      return [];
    } catch (error) {
      console.error("[Ajora]: Error in getting messages by thread:", error);
      if (ajora.activeThreadId) {
        return ajora.messages[ajora.activeThreadId] || [];
      }
      return [];
    }
  };

  const submitQuery = async (message: IMessage, thread_id: string) => {
    let threadId = thread_id;
    console.log("[Ajora]: submitQuery called with thread_id:", thread_id);
    console.log("[Ajora]: current activeThreadId:", ajora.activeThreadId);

    if (!thread_id || thread_id.trim() === "") {
      if (ajora.activeThreadId) {
        threadId = ajora.activeThreadId;
        console.log("[Ajora]: Using activeThreadId:", threadId);
      } else {
        // Don't create thread locally - let server handle it
        threadId = "";
        console.log(
          "[Ajora]: No thread ID provided, letting server create new thread"
        );
      }
    } else {
      // Only use server-generated thread IDs (UUIDs), not client-generated ones
      if (thread_id.startsWith("thread_")) {
        console.log(
          "[Ajora]: Ignoring client-generated thread ID, using activeThreadId or empty"
        );
        threadId = ajora.activeThreadId || "";
      } else {
        console.log("[Ajora]: Using provided server thread_id:", threadId);
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
      let currentThreadId = threadId; // Track the current thread ID for streaming

      const cleanup = apiServiceRef.current.streamResponse(
        message,
        {
          onChunk: (chunk: IMessage) => {
            if (!streamingMessageId) {
              streamingMessageId = chunk._id;
            }
            const updatedMessage: IMessage = {
              ...chunk,
              _id: streamingMessageId,
              parts: [],
            };
            const chunkText = chunk?.parts?.[0]?.text ?? "";
            const chunkFunctionCall = chunk?.parts?.[0]?.functionCall;
            accumulatedText += chunkText;

            if (chunkText) {
              updatedMessage.parts = [
                ...updatedMessage.parts,
                { text: accumulatedText },
              ];
            }

            if (
              chunkFunctionCall &&
              Object.keys(chunkFunctionCall).length > 0
            ) {
              updatedMessage.parts = [
                ...updatedMessage.parts,
                { functionCall: chunkFunctionCall },
              ];
            }

            dispatch({
              type: "UPDATE_STREAMING_MESSAGE",
              payload: { message: updatedMessage, threadId: currentThreadId },
            });
          },
          onComplete: (completedMessage: IMessage) => {
            dispatch({
              type: "UPDATE_STREAMING_MESSAGE",
              payload: { message: completedMessage, threadId: currentThreadId },
            });
            if (cleanupRef.current) {
              cleanupRef.current();
              cleanupRef.current = null;
            }
            dispatch({ type: "SET_THINKING", payload: { isThinking: false } });
          },
          onThreadTitle: (title: string) => {
            console.log("[Ajora]: Received thread title from server:", title);
            dispatch({
              type: "UPDATE_THREAD_TITLE",
              payload: { title, threadId: currentThreadId },
            });
          },
          onThreadId: (serverThreadId: string) => {
            console.log(
              "[Ajora]: Received thread ID from server:",
              serverThreadId
            );
            // Update the current thread ID for streaming messages
            currentThreadId = serverThreadId;
            // Always update to the server thread ID to ensure consistency
            dispatch({
              type: "SWITCH_THREAD",
              payload: { threadId: serverThreadId },
            });
          },
          onError: (error: Error) => {
            console.error("[Ajora]: Error in streaming:", error);
            const errorMessage: IMessage = {
              _id: "error",
              role: "model",
              parts: [
                {
                  text: "An error occurred. Please check your internet connection and try again.",
                },
              ],
              createdAt: new Date(),
            };
            dispatch({
              type: "ADD_MESSAGES",
              payload: { messages: [errorMessage], threadId },
            });
            if (cleanupRef.current) {
              cleanupRef.current();
              cleanupRef.current = null;
            }
            dispatch({ type: "SET_THINKING", payload: { isThinking: false } });
          },
          onSources: (sources: SourceProps[]) => {
            console.log("[Ajora]: Sources received:", sources);
          },
          onSuggestions: (suggestions: SuggestionProps[]) => {
            console.log("[Ajora]: Suggestions received:", suggestions);
          },
        },
        threadId
      );
      cleanupRef.current = cleanup;
    } catch (error: any) {
      console.error("[Ajora]: Failed to submit query:", error);
      dispatch({ type: "SET_THINKING", payload: { isThinking: false } });
      const errorMessage: IMessage = {
        _id: nanoid(),
        role: "model",
        parts: [{ text: "Failed to send message. Please try again." }],
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
    submitQuery(userMessage, ajora.activeThreadId);
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
    getMessagesByThread,
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
