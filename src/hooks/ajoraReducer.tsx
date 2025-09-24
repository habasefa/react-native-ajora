import { Thread } from "../Thread/types";
import { IMessage } from "../types";
import { AjoraState } from "./useAjora";

export type Action =
  | {
      type: "ADD_MESSAGES";
      payload: { messages: IMessage[] };
    }
  | {
      type: "ADD_PENDING_MESSAGE";
      payload: { message: IMessage; threadId: string };
    }
  | {
      type: "UPDATE_STREAMING_MESSAGE";
      payload: { message: IMessage };
    }
  | {
      type: "UPDATE_THREAD_TITLE";
      payload: { thread: Thread };
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
      payload: { threads: Thread[] };
    }
  | {
      type: "SET_MESSAGES";
      payload: { messages: IMessage[]; threadId: string };
    };

export const ajoraReducer = (state: AjoraState, action: Action): AjoraState => {
  switch (action.type) {
    case "ADD_MESSAGES": {
      const { messages } = action.payload;
      const threadId = messages[0].thread_id;
      const existingMessages = state.messages[threadId] || [];
      const updatedMessages = [...messages, ...existingMessages];
      return {
        ...state,
        messages: { ...state.messages, [threadId]: updatedMessages },
      };
    }
    case "UPDATE_STREAMING_MESSAGE": {
      const { message } = action.payload;
      const threadId = message.thread_id;
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
          created_at: existingMessage.created_at,
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
      return {
        ...state,
        activeThreadId: null,
      };
    }
    case "UPDATE_THREAD_TITLE": {
      const { thread } = action.payload;
      const { title, id } = thread;
      const threads = [...state.threads];
      const threadIndex = threads.findIndex((t) => t.id === id);
      if (threadIndex !== -1) {
        threads[threadIndex].title = title;
      } else {
      }
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
