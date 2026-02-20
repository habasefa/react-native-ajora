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
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { merge } from "ts-deepmerge";
import { useAjora } from "../../providers/AjoraProvider";
import { AbstractAgent } from "@ag-ui/client";
import { renderSlot, SlotValue } from "../../lib/slots";
import UserMessageActionSheet from "../sheets/UserMessageActionSheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Clipboard from "expo-clipboard";
import { UserMessage } from "@ag-ui/core";
import { AjoraChatError } from "../../types";

export type AjoraChatProps = Omit<
  AjoraChatViewProps,
  | "messages"
  | "isRunning"
  | "suggestions"
  | "suggestionLoadingIndexes"
  | "onSelectSuggestion"
> & {
  agentId?: string;
  /** Model ID to forward to the runtime for model selection */
  modelId?: string;
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
  modelId,
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

  const resolvedModelId = useMemo(() => {
    if (modelId && modelId !== "default") return modelId;

    // Fallback to a pro model if none is selected
    // Models without a tier or with tier "pro" are preferred over "free" models
    const proModel = ajora.models?.find(
      (m) => m.tier !== "free" && m.tier?.toLowerCase() !== "free",
    );

    return proModel?.id || ajora.models?.[0]?.id;
  }, [modelId, ajora.models]);

  // Sheet ref
  const userMessageSheetRef = React.useRef<BottomSheetModal>(null);
  const [selectedUserMessage, setSelectedUserMessage] = React.useState<
    UserMessage | undefined
  >();
  const [error, setError] = useState<AjoraChatError | null>(null);

  const parseAjoraError = useCallback((err: any): AjoraChatError => {
    let errorMessage = "Something went wrong please try again later";
    let errorCode: string | undefined;
    let details: any;

    if (typeof err === "string") {
      errorMessage = err;
    } else if (err) {
      errorMessage = err.message || errorMessage;
      errorCode = err.code || err.status; // http-request-patch sets .status and .payload
      details = err.payload || err.details;
    }

    const lowerMessage = errorMessage.toLowerCase();
    if (
      lowerMessage.includes("fetch failed") ||
      lowerMessage.includes("network request failed") ||
      lowerMessage.includes("java.io.ioexception") ||
      lowerMessage.includes("java.net.connectexception") ||
      lowerMessage.includes("unexpected end of stream") ||
      lowerMessage.includes("network error")
    ) {
      return {
        type: "network",
        message: errorMessage,
        code: errorCode,
        details,
      };
    }

    return { type: "runtime", message: errorMessage, code: errorCode, details };
  }, []);

  useEffect(() => {
    if (
      (!modelId || modelId === "default") &&
      resolvedModelId &&
      providedInputProps?.onModelSelect
    ) {
      if (providedInputProps.selectedModelId !== resolvedModelId) {
        const fallbackModel = ajora.models?.find(
          (m) => m.id === resolvedModelId,
        );
        if (fallbackModel) {
          providedInputProps.onModelSelect(fallbackModel);
        }
      }
    }
  }, [
    modelId,
    resolvedModelId,
    ajora.models,
    providedInputProps?.selectedModelId,
    providedInputProps?.onModelSelect,
  ]);

  useEffect(() => {
    const connect = async (agent: AbstractAgent) => {
      try {
        await ajora.connectAgent({ agent, modelId: resolvedModelId });
      } catch (error) {
        console.warn("Connect error", error);
      }
    };
    agent.threadId = resolvedThreadId;
    connect(agent);
    return () => {};
  }, [resolvedThreadId, agent, ajora, resolvedAgentId, resolvedModelId]);

  const onSubmitInput = useCallback(
    async (value: string, attachments?: any[]) => {
      setError(null);
      agent.addMessage({
        id: randomUUID(),
        role: "user",
        content: value,
        attachments,
      });
      try {
        await ajora.runAgent({ agent, modelId: resolvedModelId });
      } catch (err: any) {
        console.error("AjoraChat: runAgent failed", err);
        setError(parseAjoraError(err));
        props.onSendError?.(err);
      }
    },
    [agent, ajora, props.onSendError, resolvedModelId],
  );

  const handleSelectSuggestion = useCallback(
    async (suggestion: Suggestion) => {
      setError(null);
      agent.addMessage({
        id: randomUUID(),
        role: "user",
        content: suggestion.message,
      });

      try {
        await ajora.runAgent({ agent, modelId: resolvedModelId });
      } catch (err: any) {
        console.error(
          "AjoraChat: runAgent failed after selecting suggestion",
          err,
        );
        setError(parseAjoraError(err));
        props.onSendError?.(err);
      }
    },
    [agent, ajora, props.onSendError, resolvedModelId],
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
      setError(null);
      // Find the index of the specific message to regenerate
      const messageIndex = agent.messages.findIndex(
        (m) => m.id === messageToRegenerate.id,
      );

      if (messageIndex === -1) {
        console.warn("AjoraChat: Message not found to regenerate");
        return;
      }

      // Find the last user message before the message to regenerate
      // This is the message that triggered the run we want to regenerate
      let lastUserMessageIndex = -1;
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (agent.messages[i].role === "user") {
          lastUserMessageIndex = i;
          break;
        }
      }

      // Keep messages up to and including the user message that triggered the run
      // This removes all assistant, tool, and other messages that were part of this run
      const messagesToKeep = agent.messages.slice(0, lastUserMessageIndex + 1);

      // Use setMessages to trigger onMessagesChanged and update UI immediately
      agent.setMessages(messagesToKeep);

      // Re-run the agent to generate a new response
      try {
        await ajora.runAgent({ agent, modelId: resolvedModelId });
      } catch (err: any) {
        console.error("AjoraChat: regenerate failed", err);
        setError(parseAjoraError(err));
        props.onSendError?.(err);
      }
    },
    [agent, ajora, props.onSendError, resolvedModelId, parseAjoraError],
  );

  const handleRetryError = useCallback(async () => {
    setError(null);
    try {
      await ajora.runAgent({ agent, modelId: resolvedModelId });
    } catch (err: any) {
      console.error("AjoraChat: runAgent failed on retry", err);
      setError(parseAjoraError(err));
      props.onSendError?.(err);
    }
  }, [agent, ajora, props.onSendError, resolvedModelId, parseAjoraError]);

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
      error,
      onRetryError: handleRetryError,
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
