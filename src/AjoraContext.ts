import { createContext, useContext } from "react";
import { ActionSheetOptions } from "@expo/react-native-action-sheet";
import { Ajora } from "./hooks/useAjora";

export interface IAjoraContext {
  actionSheet(): {
    showActionSheetWithOptions: (
      options: ActionSheetOptions,
      callback: (buttonIndex?: number) => void | Promise<void>
    ) => void;
  };
  getLocale(): string;
  getTimezone(): string;
  ajora: Ajora;
}

export const AjoraContext = createContext<IAjoraContext>({
  getLocale: () => "en",
  getTimezone: () => "America/New_York",
  actionSheet: () => ({
    showActionSheetWithOptions: () => {},
  }),
  ajora: {
    // Streaming
    stream: [],
    stopStreaming: () => {},

    // Thinking
    isThinking: false,
    setIsThinking: () => {},

    // Messages
    messages: {},
    isLoadingMessages: false,
    getMessages: () => {},

    // Threads
    activeThreadId: null,
    addNewThread: () => {},
    switchThread: () => {},

    // Load earlier
    loadEarlier: false,
    setIsLoadingEarlier: () => {},

    // Mode
    mode: "auto",
    setMode: () => {},

    // Attachement
    attachement: undefined,
    setAttachement: () => {},
    updateAttachement: () => {},
    clearAttachement: () => {},

    // Recording
    isRecording: false,
    setIsRecording: () => {},

    // Base URL
    baseUrl: "",
    apiService: null,

    // Submit query
    submitQuery: () => Promise.resolve(),

    // Regenerate message
    regenerateMessage: () => {},

    // Complete
    isComplete: false,
    setIsComplete: () => {},
  },
});

export const useChatContext = () => useContext(AjoraContext);
