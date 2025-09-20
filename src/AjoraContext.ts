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
  ajora: Ajora;
}

export const AjoraContext = createContext<IAjoraContext>({
  getLocale: () => "en",
  actionSheet: () => ({
    showActionSheetWithOptions: () => {},
  }),
  ajora: {
    stream: [],
    messages: {},
    threads: [],
    activeThreadId: null,
    isThinking: false,
    loadEarlier: false,
    mode: "auto",
    baseUrl: "",
    apiService: null,
    submitQuery: () => Promise.resolve(),
    addNewThread: () => {},
    switchThread: () => {},
    setIsThinking: () => {},
    setIsLoadingEarlier: () => {},
    setMode: () => {},
    regenerateMessage: () => {},
  },
});

export const useChatContext = () => useContext(AjoraContext);
