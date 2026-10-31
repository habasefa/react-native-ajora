import { useCallback, useEffect, useMemo, useState } from "react";
import { Suggestion } from "../../core";
import { useAjora } from "../providers/AjoraProvider";
import { useAjoraChatConfiguration } from "../providers/AjoraChatConfigurationProvider";
import { DEFAULT_MODEL_ID, DEFAULT_AGENT_ID } from "../../shared";

export interface UseSuggestionsOptions {
  agentId?: string;
  modelId?: string;
}

export interface UseSuggestionsResult {
  suggestions: Suggestion[];
  reloadSuggestions: () => void;
  clearSuggestions: () => void;
  isLoading: boolean;
}

export function useSuggestions({
  agentId,
  modelId,
}: UseSuggestionsOptions = {}): UseSuggestionsResult {
  const { ajora } = useAjora();
  const config = useAjoraChatConfiguration();
  const resolvedAgentId = useMemo(
    () => agentId ?? config?.agentId ?? DEFAULT_AGENT_ID,
    [agentId, config?.agentId],
  );
  const resolvedModelId = useMemo(
    () => modelId ?? config?.modelId ?? DEFAULT_MODEL_ID,
    [modelId, config?.modelId],
  );

  const [suggestions, setSuggestions] = useState<Suggestion[]>(
    () => ajora.getSuggestions(resolvedAgentId).suggestions,
  );
  const [isLoading, setIsLoading] = useState(
    () => ajora.getSuggestions(resolvedAgentId).isLoading,
  );

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
