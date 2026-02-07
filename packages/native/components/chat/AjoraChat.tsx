// @ts-nocheck
import { useAgent } from "../../hooks/use-agent";
import { useSuggestions } from "../../hooks/use-suggestions";
import { AjoraChatView, AjoraChatViewProps } from "./AjoraChatView";
import AjoraChatInput, { AjoraChatInputProps } from "./AjoraChatInput";
import {
  AjoraChatConfigurationProvider,
  AjoraChatLabels,
  useAjoraChatConfiguration,
} from "../../providers/AjoraChatConfigurationProvider";
import { DEFAULT_AGENT_ID, randomUUID } from "../../../shared";
import { AjoraCoreRuntimeConnectionStatus, Suggestion } from "../../../core";
import React, { useCallback, useEffect, useMemo, useReducer } from "react";
import { merge } from "ts-deepmerge";
import { useAjora } from "../../providers/AjoraProvider";
import { AbstractAgent } from "@ag-ui/client";
import { renderSlot, SlotValue } from "../../lib/slots";
import UserMessageActionSheet from "../sheets/UserMessageActionSheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Clipboard from "expo-clipboard";
import { UserMessage } from "@ag-ui/core";

export type AjoraChatProps = Omit<
  AjoraChatViewProps,
  | "messages"
  | "isRunning"
  | "suggestions"
  | "suggestionLoadingIndexes"
  | "onSelectSuggestion"
> & {
  agentId?: string;
  threadId?: string;
  labels?: Partial<AjoraChatLabels>;
  chatView?: SlotValue<typeof AjoraChatView>;
  isModalDefaultOpen?: boolean;
  /** Whether the chat is in a loading state (e.g., connecting, loading history) */
  isLoading?: boolean;
  /** Starter suggestions to show in the empty state */
  starterSuggestions?: Suggestion[];

  // ========================================================================
  // Behavior Callbacks
  // ========================================================================

  /** Called when a message is long pressed */
  onMessageLongPress?: (message: any) => void;
  /** Called when an action is performed on a message (copy, edit, etc.) */
  onMessageAction?: (
    action: "copy" | "edit" | "delete" | "regenerate",
    message: any,
  ) => void;
  /** Called when user starts typing */
  onTypingStart?: () => void;
  /** Called when user stops typing (debounced) */
  onTypingEnd?: () => void;
  /** Called when user scrolls to the top of the chat */
  onScrollToTop?: () => void;
  /** Called when user scrolls to the bottom of the chat */
  onScrollToBottom?: () => void;
  /** Called when an attachment is added */
  onAttachmentAdd?: (attachment: {
    uri: string;
    type: string;
    name?: string;
  }) => void;
  /** Called when an attachment is removed */
  onAttachmentRemove?: (attachmentId: string) => void;
  /** Called when message send fails */
  onSendError?: (error: Error) => void;
  /** Called when a message is successfully sent */
  onSendSuccess?: (message: any) => void;
  textRenderer?: (props: { content: string }) => React.ReactNode;
};
export function AjoraChat({
  agentId,
  threadId,
  labels,
  chatView,
  isModalDefaultOpen,
  isLoading = false,
  starterSuggestions,
  ...props
}: AjoraChatProps) {
  // Check for existing configuration provider
  const existingConfig = useAjoraChatConfiguration();

  // Apply priority: props > existing config > defaults
  const resolvedAgentId =
    agentId ?? existingConfig?.agentId ?? DEFAULT_AGENT_ID;
  const resolvedThreadId = useMemo(
    () => threadId ?? existingConfig?.threadId ?? randomUUID(),
    [threadId, existingConfig?.threadId],
  );
  const { agent } = useAgent({ agentId: resolvedAgentId });
  const { ajora } = useAjora();

  const { suggestions: autoSuggestions } = useSuggestions({
    agentId: resolvedAgentId,
  });

  const {
    inputProps: providedInputProps,
    messageView: providedMessageView,
    suggestionView: providedSuggestionView,
    textRenderer,
    ...restProps
  } = props;

  // Sheet ref
  const userMessageSheetRef = React.useRef<BottomSheetModal>(null);
  const [selectedUserMessage, setSelectedUserMessage] = React.useState<
    UserMessage | undefined
  >();

  useEffect(() => {
    const connect = async (agent: AbstractAgent) => {
      try {
        await ajora.connectAgent({ agent });
      } catch (error) {
        console.warn("Connect error", error);
      }
    };
    agent.threadId = resolvedThreadId;
    connect(agent);
    return () => {};
  }, [resolvedThreadId, agent, ajora, resolvedAgentId]);

  const onSubmitInput = useCallback(
    async (value: string, attachments?: any[]) => {
      agent.addMessage({
        id: randomUUID(),
        role: "user",
        content: value,
        attachments,
      });
      try {
        await ajora.runAgent({ agent });
      } catch (error) {
        console.error("AjoraChat: runAgent failed", error);
      }
    },
    [agent, ajora],
  );

  const handleSelectSuggestion = useCallback(
    async (suggestion: Suggestion) => {
      agent.addMessage({
        id: randomUUID(),
        role: "user",
        content: suggestion.message,
      });

      try {
        await ajora.runAgent({ agent });
      } catch (error) {
        console.error(
          "AjoraChat: runAgent failed after selecting suggestion",
          error,
        );
      }
    },
    [agent, ajora],
  );

  const stopCurrentRun = useCallback(() => {
    try {
      ajora.stopAgent({ agent });
    } catch (error) {
      console.error("AjoraChat: stopAgent failed", error);
      try {
        agent.abortRun();
      } catch (abortError) {
        console.error("AjoraChat: abortRun fallback failed", abortError);
      }
    }
  }, [agent, ajora]);

  const handleRegenerate = useCallback(
    async (messageToRegenerate: { id: string }) => {
      // Find the index of the specific message to regenerate
      const messageIndex = agent.messages.findIndex(
        (m) => m.id === messageToRegenerate.id,
      );

      if (messageIndex === -1) {
        console.warn("AjoraChat: Message not found to regenerate");
        return;
      }

      // Remove the message and any messages after it
      // This keeps everything up to (but not including) the message to regenerate
      const messagesToKeep = agent.messages.slice(0, messageIndex);

      // Use setMessages to trigger onMessagesChanged and update UI immediately
      agent.setMessages(messagesToKeep);

      // Re-run the agent to generate a new response
      try {
        await ajora.runAgent({ agent });
      } catch (error) {
        console.error("AjoraChat: regenerate failed", error);
      }
    },
    [agent, ajora],
  );

  const handleMessageLongPress = useCallback((message: any) => {
    if (message.role === "user") {
      setSelectedUserMessage(message as UserMessage);
      userMessageSheetRef.current?.present();
    }
  }, []);

  const handleCopyMessage = useCallback(async (message: UserMessage) => {
    if (typeof message.content === "string") {
      await Clipboard.setStringAsync(message.content);
    }
    userMessageSheetRef.current?.dismiss();
  }, []);

  const handleActionRegenerate = useCallback(
    (message: UserMessage) => {
      handleRegenerate(message);
      userMessageSheetRef.current?.dismiss();
    },
    [handleRegenerate],
  );

  const mergedProps = merge(
    {
      isRunning: agent.isRunning,
      isLoading,
      suggestions: autoSuggestions,
      starterSuggestions,
      onSelectSuggestion: handleSelectSuggestion,
      suggestionView: providedSuggestionView,

      onRegenerate: handleRegenerate,
      onMessageLongPress: handleMessageLongPress,
      textRenderer,
    },
    {
      ...restProps,
      // Adapt messageView if string (className) - RN doesn't support className strings for Views directly
      // but we keep the logic for consistency if user passes custom components
      ...(providedMessageView !== undefined
        ? { messageView: providedMessageView }
        : {}),
    },
  );

  const providedStopHandler = providedInputProps?.onStop;
  const hasMessages = agent.messages.length > 0;
  const shouldAllowStop = agent.isRunning && hasMessages;
  const effectiveStopHandler = shouldAllowStop
    ? (providedStopHandler ?? stopCurrentRun)
    : providedStopHandler;

  const finalInputProps = {
    ...providedInputProps,
    onSubmitMessage: onSubmitInput,
    onStop: effectiveStopHandler,
    isRunning: agent.isRunning,
  } as Partial<AjoraChatInputProps> & {
    onSubmitMessage: (value: string) => void;
  };

  finalInputProps.mode = agent.isRunning
    ? "processing"
    : (finalInputProps.mode ?? "input");

  // Memoize messages array - only create new reference when content actually changes
  // (agent.messages is mutated in place, so we need a new reference for React to detect changes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const messages = useMemo(
    () => [...agent.messages],
    [JSON.stringify(agent.messages)],
  );

  const finalProps = merge(mergedProps, {
    messages,
    inputProps: finalInputProps,
  }) as AjoraChatViewProps;

  // Always create a provider with merged values
  // This ensures priority: props > existing config > defaults
  const RenderedChatView = renderSlot(chatView, AjoraChatView, finalProps);

  return (
    <AjoraChatConfigurationProvider
      agentId={resolvedAgentId}
      threadId={resolvedThreadId}
      labels={labels}
      isModalDefaultOpen={isModalDefaultOpen}
    >
      {RenderedChatView}
      <UserMessageActionSheet
        ref={userMessageSheetRef}
        message={selectedUserMessage}
        onRegenerate={handleActionRegenerate}
        onCopy={handleCopyMessage}
      />
    </AjoraChatConfigurationProvider>
  );
}

export namespace AjoraChat {
  export const View = AjoraChatView;
}
