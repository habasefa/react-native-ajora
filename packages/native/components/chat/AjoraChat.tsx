import { useAgent } from "../../hooks/use-agent";
import { useHistory } from "../../hooks/use-history";
import { useSuggestions } from "../../hooks/use-suggestions";
import { AjoraChatView, AjoraChatViewProps } from "./AjoraChatView";
import { AjoraChatInputProps } from "./AjoraChatInput";
import {
  AjoraChatConfigurationProvider,
  AjoraChatLabels,
  useAjoraChatConfiguration,
} from "../../providers/AjoraChatConfigurationProvider";
import { DEFAULT_AGENT_ID, randomUUID } from "../../../shared";
import { Suggestion } from "../../../core";
import React, {
  useCallback,
  useEffect,
  useMemo,
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
import { DEFAULT_MODEL_ID } from "../../../shared/constants";
import { AjoraChatErrorBoundary } from "../AjoraChatErrorBoundary";

export type AjoraChatProps = Omit<
  AjoraChatViewProps,
  | "messages"
  | "isRunning"
  | "suggestions"
  | "suggestionLoadingIndexes"
  | "onSelectSuggestion"
> & {
  agentId?: string;
  modelId?: string;
  threadId?: string;
  labels?: Partial<AjoraChatLabels>;
  chatView?: SlotValue<typeof AjoraChatView>;
  isModalDefaultOpen?: boolean;
  isLoading?: boolean;
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
  // DEBUG: render counter
  const chatRenderRef = React.useRef(0);
  chatRenderRef.current++;
  const cr = chatRenderRef.current;
  if (cr <= 5 || cr === 10 || cr === 25 || cr === 50 || cr % 100 === 0) {
    console.log(`[AjoraChat render #${cr}] agentId=${agentId} modelId=${modelId} threadId=${threadId}`);
  }

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

  // Resolve a real model id. Consumers (e.g. magnus.tsx) commonly initialise
  // their model selection state to the placeholder string `"default"` and
  // rely on us to fall back to a real registered model. A naive
  // `modelId ?? DEFAULT_MODEL_ID` chain returns `"default"` verbatim — which
  // gets forwarded to the runtime as `model: "default"` and silently fails
  // the request, manifesting as "click does nothing" in the chat UI.
  const resolvedModelId = useMemo(() => {
    const candidate = modelId ?? existingConfig?.modelId;
    if (candidate && candidate !== DEFAULT_MODEL_ID) return candidate;

    const proModel = ajora.models?.find(
      (m) => m.tier !== "free" && m.tier?.toLowerCase() !== "free",
    );
    return proModel?.id ?? ajora.models?.[0]?.id ?? candidate ?? DEFAULT_MODEL_ID;
  }, [modelId, existingConfig?.modelId, ajora.models]);

  // Load persisted messages for the active thread. The hook handles initial
  // load on threadId change, pagination via loadMore, and stale-thread races.
  const {
    isLoading: isLoadingHistory,
    isLoadingMore: isLoadingMoreHistory,
    hasMore: hasMoreHistory,
    loadMore: loadEarlierMessages,
  } = useHistory({
    agentId: resolvedAgentId,
    threadId: resolvedThreadId,
  });

  const { suggestions: autoSuggestions } = useSuggestions({
    agentId: resolvedAgentId,
    modelId: resolvedModelId,
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

  const modelSelectCountRef = React.useRef(0);
  useEffect(() => {
    modelSelectCountRef.current++;
    console.log(
      `[AjoraChat] model-select effect #${modelSelectCountRef.current} ` +
      `modelId=${modelId} resolvedModelId=${resolvedModelId} ` +
      `selectedModelId=${providedInputProps?.selectedModelId}`
    );
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
          console.log(`[AjoraChat] auto-selecting model: ${fallbackModel.id}`);
          providedInputProps.onModelSelect(fallbackModel);
        }
      }
    }
  // NOTE: `ajora.models` is intentionally excluded — it's a getter whose
  // reference changes whenever the internal array is replaced.
  // `resolvedModelId` already depends on `ajora.models` via its own useMemo,
  // so changes propagate through `resolvedModelId` without needing the
  // unstable getter here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    modelId,
    resolvedModelId,
    providedInputProps?.selectedModelId,
    providedInputProps?.onModelSelect,
  ]);

  // Use a ref for resolvedModelId so the connect effect reads the latest
  // value without re-firing when the user picks a different model. Model
  // changes only matter for `runAgent`, not `connectAgent`.
  const resolvedModelIdRef = React.useRef(resolvedModelId);
  resolvedModelIdRef.current = resolvedModelId;

  const connectCountRef = React.useRef(0);
  useEffect(() => {
    connectCountRef.current++;
    const knownAgents = Object.keys(ajora.agents ?? {});
    const isRegistered = knownAgents.includes(resolvedAgentId);
    console.log(
      `[AjoraChat] connect effect #${connectCountRef.current} ` +
      `agentId=${resolvedAgentId} threadId=${resolvedThreadId} ` +
      `knownAgents=[${knownAgents}] isRegistered=${isRegistered}`
    );
    if (!isRegistered && knownAgents.length === 0 && ajora.runtimeUrl) {
      console.log("[AjoraChat] connect effect: bailing — agents not populated yet");
      return;
    }

    let cancelled = false;

    // EVENT LOOP PROBE: if the JS thread is blocked synchronously after this
    // point, this timeout will never fire.
    const probeTimer = setTimeout(() => {
      console.log("[PROBE] event loop alive after connect effect setup");
    }, 0);
    const probeTimer2 = setTimeout(() => {
      console.log("[PROBE] event loop alive after 500ms");
    }, 500);
    const probeTimer3 = setTimeout(() => {
      console.log("[PROBE] event loop alive after 2000ms");
    }, 2000);

    const connect = async (agent: AbstractAgent) => {
      console.log(`[AjoraChat] connectAgent START model=${resolvedModelIdRef.current}`);
      try {
        await ajora.connectAgent({
          agent,
          modelId: resolvedModelIdRef.current,
        });
        console.log("[AjoraChat] connectAgent DONE");
      } catch (error) {
        if (!cancelled) {
          console.warn("Connect error", error);
        }
      }
    };
    agent.threadId = resolvedThreadId;
    connect(agent);

    return () => {
      cancelled = true;
      clearTimeout(probeTimer);
      clearTimeout(probeTimer2);
      clearTimeout(probeTimer3);
      // Detach the active run so the in-flight stream stops pushing events
      // into an agent we're about to swap out. `detachActiveRun` is the
      // ag-ui idiomatic way to cancel a running subscription without
      // tearing down the agent itself.
      void agent.detachActiveRun?.().catch(() => {
        /* swallow: detach races are benign on unmount */
      });
    };
    // NOTE: resolvedModelId is intentionally excluded — it's read via ref.
    // Re-connecting on model change is wasteful (model only matters for
    // runAgent) and causes isRunning to stay true, blocking input.
    //
    // NOTE: `ajora.agents` and `ajora.runtimeUrl` are intentionally excluded.
    // They are getters whose references change when the internal object is
    // replaced (e.g. after runtime /info). The `agent` dep already captures
    // the agents-populated transition because useAgent recalculates its memo
    // on `ajora.agents` change, returning a new (real) agent instance. Adding
    // the raw getters here creates a duplicate trigger that races the connect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    resolvedThreadId,
    agent,
    ajora,
    resolvedAgentId,
  ]);

  const onSubmitInput = useCallback(
    async (value: string) => {
      setError(null);
      agent.addMessage({
        id: randomUUID(),
        role: "user",
        content: value,
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
      // Surface initial-load progress to the chat view so it can show a
      // loading indicator instead of an empty-state flash on thread switch.
      isLoading: isLoading || isLoadingHistory,
      isLoadingEarlier: isLoadingMoreHistory,
      hasEarlierMessages: hasMoreHistory,
      onLoadEarlier: hasMoreHistory ? loadEarlierMessages : undefined,
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

  // `agent.messages` is mutated in place by @ag-ui/client during streaming,
  // and `useAgent`'s `onMessagesChanged` subscription calls `forceUpdate()`
  // on every mutation — so we get a fresh render any time the content
  // changes. Previously this used `JSON.stringify(agent.messages)` as the
  // memo dep, which is O(n * avgContentLength) on every render and turned
  // into a hot path as conversations grew (dropping frames during streaming
  // and contributing to the "stuck / crash" symptom in magnus.tsx).
  //
  // Just allocate a fresh array every render instead. The spread is O(n)
  // with a tiny constant factor (pointer copies) and React's VDOM diff on
  // the resulting props is what actually prevents unnecessary child work.
  const messages = [...agent.messages];

  const finalProps = merge(mergedProps, {
    messages,
    inputProps: finalInputProps,
  }) as AjoraChatViewProps;

  // Always create a provider with merged values
  // This ensures priority: props > existing config > defaults
  const RenderedChatView = renderSlot(chatView, AjoraChatView, finalProps);

  return (
    <AjoraChatErrorBoundary>
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
    </AjoraChatErrorBoundary>
  );
}

export namespace AjoraChat {
  export const View = AjoraChatView;
}
