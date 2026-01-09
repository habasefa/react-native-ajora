import { useCallback, useEffect, useMemo, useState } from "react";
import { Suggestion } from "@ajora-ai/core";
import { useAjora } from "../providers/AjoraProvider";
import { useAjoraChatConfiguration } from "../providers/AjoraChatConfigurationProvider";
import { DEFAULT_AGENT_ID } from "@ajora-ai/shared";

export interface UseSuggestionsOptions {
  agentId?: string;
}

export interface UseSuggestionsResult {
  suggestions: Suggestion[];
  reloadSuggestions: () => void;
  clearSuggestions: () => void;
  isLoading: boolean;
}

export function useSuggestions({
  agentId,
}: UseSuggestionsOptions = {}): UseSuggestionsResult {
  const { ajora } = useAjora();
  const config = useAjoraChatConfiguration();
  const resolvedAgentId = useMemo(
    () => agentId ?? config?.agentId ?? DEFAULT_AGENT_ID,
    [agentId, config?.agentId]
  );

  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => {
    const result = ajora.getSuggestions(resolvedAgentId);
    return result.suggestions;
  });
  const [isLoading, setIsLoading] = useState(() => {
    const result = ajora.getSuggestions(resolvedAgentId);
    return result.isLoading;
  });

  useEffect(() => {
    const result = ajora.getSuggestions(resolvedAgentId);
    setSuggestions(result.suggestions);
    setIsLoading(result.isLoading);
  }, [ajora, resolvedAgentId]);

  useEffect(() => {
    const subscription = ajora.subscribe({
      onSuggestionsChanged: ({ agentId: changedAgentId, suggestions }) => {
        if (changedAgentId !== resolvedAgentId) {
          return;
        }
        setSuggestions(suggestions);
      },
      onSuggestionsStartedLoading: ({ agentId: changedAgentId }) => {
        if (changedAgentId !== resolvedAgentId) {
          return;
        }
        setIsLoading(true);
      },
      onSuggestionsFinishedLoading: ({ agentId: changedAgentId }) => {
        if (changedAgentId !== resolvedAgentId) {
          return;
        }
        setIsLoading(false);
      },
      onSuggestionsConfigChanged: () => {
        const result = ajora.getSuggestions(resolvedAgentId);
        setSuggestions(result.suggestions);
        setIsLoading(result.isLoading);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [ajora, resolvedAgentId]);

  const reloadSuggestions = useCallback(() => {
    ajora.reloadSuggestions(resolvedAgentId);
    // Loading state is handled by onSuggestionsStartedLoading event
  }, [ajora, resolvedAgentId]);

  const clearSuggestions = useCallback(() => {
    ajora.clearSuggestions(resolvedAgentId);
    // State updates are handled by onSuggestionsChanged event
  }, [ajora, resolvedAgentId]);

  return {
    suggestions,
    reloadSuggestions,
    clearSuggestions,
    isLoading,
  };
}
