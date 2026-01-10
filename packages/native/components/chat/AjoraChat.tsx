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
import { DEFAULT_AGENT_ID, randomUUID } from "@ajora-ai/shared";
import { Suggestion } from "@ajora-ai/core";
import React, { useCallback, useEffect, useMemo } from "react";
import { merge } from "ts-deepmerge";
import { useAjora } from "../../providers/AjoraProvider";
import { AbstractAgent } from "@ag-ui/client";
import { renderSlot, SlotValue } from "../../lib/slots";

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
    [threadId, existingConfig?.threadId]
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
    ...restProps
  } = props;

  useEffect(() => {
    const connect = async (agent: AbstractAgent) => {
      try {
        await ajora.connectAgent({ agent });
      } catch (error) {
        // console.warn("Connect error", error);
      }
    };
    agent.threadId = resolvedThreadId;
    connect(agent);
    return () => {};
  }, [resolvedThreadId, agent, ajora, resolvedAgentId]);

  const onSubmitInput = useCallback(
    async (value: string) => {
      agent.addMessage({
        id: randomUUID(),
        role: "user",
        content: value,
      });
      try {
        await ajora.runAgent({ agent });
      } catch (error) {
        console.error("AjoraChat: runAgent failed", error);
      }
    },
    [agent, ajora]
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
          error
        );
      }
    },
    [agent, ajora]
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
      // Find the index of the message to regenerate
      const messageIndex = agent.messages.findIndex(
        (m) => m.id === messageToRegenerate.id
      );

      if (messageIndex === -1) {
        console.warn("AjoraChat: Message to regenerate not found");
        return;
      }

      // Remove the assistant message and any messages after it
      // This keeps the user message that triggered the response
      const messagesToKeep = agent.messages.slice(0, messageIndex);

      // Update agent messages (remove the assistant message and everything after)
      agent.messages.length = 0;
      agent.messages.push(...messagesToKeep);

      // Re-run the agent to generate a new response
      try {
        await ajora.runAgent({ agent });
      } catch (error) {
        console.error("AjoraChat: regenerate failed", error);
      }
    },
    [agent, ajora]
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
    },
    {
      ...restProps,
      // Adapt messageView if string (className) - RN doesn't support className strings for Views directly
      // but we keep the logic for consistency if user passes custom components
      ...(providedMessageView !== undefined
        ? { messageView: providedMessageView }
        : {}),
    }
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

  const finalProps = merge(mergedProps, {
    messages: agent.messages,
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
    </AjoraChatConfigurationProvider>
  );
}

export namespace AjoraChat {
  export const View = AjoraChatView;
}
