import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
} from "react";
import { DEFAULT_AGENT_ID, randomUUID } from "../../shared";

// Default labels
export const AjoraChatDefaultLabels = {
  chatInputPlaceholder: "Type a message...",
  chatInputToolbarStartTranscribeButtonLabel: "Transcribe",
  chatInputToolbarCancelTranscribeButtonLabel: "Cancel",
  chatInputToolbarFinishTranscribeButtonLabel: "Finish",
  chatInputToolbarAddButtonLabel: "Add photos or files",
  chatInputToolbarToolsButtonLabel: "Tools",
  assistantMessageToolbarCopyCodeLabel: "Copy",
  assistantMessageToolbarCopyCodeCopiedLabel: "Copied",
  assistantMessageToolbarCopyMessageLabel: "Copy",
  assistantMessageToolbarThumbsUpLabel: "Good response",
  assistantMessageToolbarThumbsDownLabel: "Bad response",
  assistantMessageToolbarReadAloudLabel: "Read aloud",
  assistantMessageToolbarRegenerateLabel: "Regenerate",
  userMessageToolbarCopyMessageLabel: "Copy",
  userMessageToolbarEditMessageLabel: "Edit",
  chatDisclaimerText: "AI can make mistakes. Check important info.",
  chatToggleOpenLabel: "Open chat",
  chatToggleCloseLabel: "Close chat",
  modalHeaderTitle: "Ajora Chat",
  // Chat header labels
  chatHeaderTitle: "Chat",
  chatHeaderMenuButtonLabel: "Open menu",
  chatHeaderNewThreadButtonLabel: "New chat",
  // Thread drawer labels
  threadDrawerTitle: "Chats",
  threadDrawerNewButtonLabel: "New Chat",
  threadDrawerEmptyTitle: "No conversations yet",
  threadDrawerEmptySubtitle: "Start a new chat to begin",
  threadDrawerDeleteConfirmTitle: "Delete chat?",
  threadDrawerDeleteConfirmMessage: "This action cannot be undone.",
  threadDrawerDeleteConfirmButton: "Delete",
  threadDrawerDeleteCancelButton: "Cancel",
  // Chat empty state labels
  chatEmptyStateTitle: "How can I help you today?",
  chatEmptyStateSubtitle: "Ask me anything or choose a suggestion below",
  // Chat loading state labels
  chatLoadingConnecting: "Connecting...",
  chatLoadingMessages: "Loading messages...",
  chatLoadingThinking: "Thinking...",
  chatLoadingReconnecting: "Reconnecting...",
};

export type AjoraChatLabels = typeof AjoraChatDefaultLabels;

// Define the full configuration interface
export interface AjoraChatConfigurationValue {
  labels: AjoraChatLabels;
  agentId: string;
  threadId: string;
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  isModalDefaultOpen: boolean;
}

// Create the configuration context
const AjoraChatConfiguration =
  createContext<AjoraChatConfigurationValue | null>(null);

// Provider props interface
export interface AjoraChatConfigurationProviderProps {
  children: ReactNode;
  labels?: Partial<AjoraChatLabels>;
  agentId?: string;
  threadId?: string;
  isModalDefaultOpen?: boolean;
}

// Provider component
export const AjoraChatConfigurationProvider: React.FC<
  AjoraChatConfigurationProviderProps
> = ({ children, labels, agentId, threadId, isModalDefaultOpen }) => {
  const parentConfig = useContext(AjoraChatConfiguration);

  const mergedLabels: AjoraChatLabels = useMemo(
    () => ({
      ...AjoraChatDefaultLabels,
      ...(parentConfig?.labels ?? {}),
      ...(labels ?? {}),
    }),
    [labels, parentConfig?.labels],
  );

  const resolvedAgentId = agentId ?? parentConfig?.agentId ?? DEFAULT_AGENT_ID;

  const resolvedThreadId = useMemo(() => {
    if (threadId) {
      return threadId;
    }
    if (parentConfig?.threadId) {
      return parentConfig.threadId;
    }
    return randomUUID();
  }, [threadId, parentConfig?.threadId]);

  const resolvedDefaultOpen =
    isModalDefaultOpen ?? parentConfig?.isModalDefaultOpen ?? true;

  const [internalModalOpen, setInternalModalOpen] = useState<boolean>(
    parentConfig?.isModalOpen ?? resolvedDefaultOpen,
  );

  const resolvedIsModalOpen = parentConfig?.isModalOpen ?? internalModalOpen;
  const resolvedSetModalOpen =
    parentConfig?.setModalOpen ?? setInternalModalOpen;

  const configurationValue: AjoraChatConfigurationValue = useMemo(
    () => ({
      labels: mergedLabels,
      agentId: resolvedAgentId,
      threadId: resolvedThreadId,
      isModalOpen: resolvedIsModalOpen,
      setModalOpen: resolvedSetModalOpen,
      isModalDefaultOpen: resolvedDefaultOpen,
    }),
    [
      mergedLabels,
      resolvedAgentId,
      resolvedThreadId,
      resolvedIsModalOpen,
      resolvedSetModalOpen,
      resolvedDefaultOpen,
    ],
  );

  return (
    <AjoraChatConfiguration.Provider value={configurationValue}>
      {children}
    </AjoraChatConfiguration.Provider>
  );
};

// Hook to use the full configuration
export const useAjoraChatConfiguration =
  (): AjoraChatConfigurationValue | null => {
    const configuration = useContext(AjoraChatConfiguration);
    return configuration;
  };
