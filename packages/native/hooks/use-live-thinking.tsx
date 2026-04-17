import { useEffect, useState } from "react";
import { useAgent } from "./use-agent";
import {
  getLiveThinking,
  installThinkingSubscriber,
  subscribeLiveThinking,
} from "../lib/thinking-subscriber";
import type { LiveThinkingState } from "../types/thinking";

export interface UseLiveThinkingProps {
  agentId?: string;
}

/**
 * Live snapshot of the in-flight thinking buffer for an agent.
 *
 * Returns `{ title, text, isActive }`. `isActive` is true while a thinking
 * stream is open (between `THINKING_START` and the next `TEXT_MESSAGE_START`
 * or `THINKING_END`). When idle, `text` is empty.
 *
 * Intended for the in-flight indicator only — persisted thinking lives on the
 * assistant message itself (see {@link AjoraAssistantMessage.thinking}).
 */
export function useLiveThinking({
  agentId,
}: UseLiveThinkingProps = {}): LiveThinkingState {
  const { agent } = useAgent({ agentId, updates: [] });
  const [state, setState] = useState<LiveThinkingState>(() =>
    getLiveThinking(agent),
  );

  useEffect(() => {
    installThinkingSubscriber(agent);
    setState(getLiveThinking(agent));
    const unsubscribe = subscribeLiveThinking(agent, setState);
    return unsubscribe;
  }, [agent]);

  return state;
}
