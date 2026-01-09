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
};
export function AjoraChat({
  agentId,
  threadId,
  labels,
  chatView,
  isModalDefaultOpen,
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

  const mergedProps = merge(
    {
      isRunning: agent.isRunning,
      suggestions: autoSuggestions,
      onSelectSuggestion: handleSelectSuggestion,
      suggestionView: providedSuggestionView,
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

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AjoraChat {
  export const View = AjoraChatView;
}
