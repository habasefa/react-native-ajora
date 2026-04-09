import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_AGENT_ID } from "../../shared";
import { useAjora } from "../providers/AjoraProvider";
import { useAgent } from "./use-agent";

export interface UseHistoryProps {
  /** Agent to load history for. Defaults to `DEFAULT_AGENT_ID`. */
  agentId?: string;
  /** Active thread id. When null/undefined the hook is idle. */
  threadId?: string | null;
  /** Page size for each request. Defaults to 50. */
  pageSize?: number;
}

export interface UseHistoryResult {
  /** True while the initial page is loading for the current threadId. */
  isLoading: boolean;
  /** True while a "load earlier" page is in flight. */
  isLoadingMore: boolean;
  /** Whether older messages exist beyond the oldest currently loaded. */
  hasMore: boolean;
  /** Last error encountered (cleared on the next attempt). */
  error: Error | null;
  /**
   * Fetch the next earlier page of messages and prepend them to the agent's
   * `messages` array. No-op when there's no more history, when a load is
   * already in flight, or when the thread is empty.
   */
  loadMore: () => Promise<void>;
  /**
   * Force-refetch the initial page for the current thread. Useful after a
   * connection error or pull-to-refresh.
   */
  reload: () => Promise<void>;
}

/**
 * Loads persisted thread history into the agent's in-memory `messages` array
 * and exposes pagination state for a "Load earlier" UI.
 *
 * Behavior:
 *  - On `threadId` change, runs an initial load (`beforeMessageId` undefined)
 *    which replaces the agent's messages with the most recent page.
 *  - `loadMore()` fetches the previous page using `oldestMessageId` as the
 *    cursor and prepends it (deduped by id) to the existing messages.
 *  - In-flight requests for stale threadIds are discarded so rapid thread
 *    switches don't race.
 */
export function useHistory({
  agentId,
  threadId,
  pageSize = 50,
}: UseHistoryProps): UseHistoryResult {
  const resolvedAgentId = agentId ?? DEFAULT_AGENT_ID;
  const { ajora } = useAjora();
  const { agent } = useAgent({ agentId: resolvedAgentId });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Track which threadId the most recent request was for so we can drop
  // results that arrive after the user has switched threads.
  const activeThreadRef = useRef<string | null | undefined>(threadId);
  activeThreadRef.current = threadId;

  // Capture mutable refs to ajora/agent/pageSize so the initial-load effect
  // can read the latest values without listing them as dependencies. The
  // `agent` reference in particular flips during `runtimeConnectionStatus`
  // transitions; if we put it in deps the effect would re-fire and call
  // `loadHistory` repeatedly, racing with anything the user typed.
  const ajoraRef = useRef(ajora);
  ajoraRef.current = ajora;
  const agentRef = useRef(agent);
  agentRef.current = agent;
  const pageSizeRef = useRef(pageSize);
  pageSizeRef.current = pageSize;

  // Track which threadId we've already kicked off a load for. We never want
  // to fire the initial load more than once for the same threadId — repeated
  // loads can clobber in-memory messages added by the user between fetches.
  const loadedThreadRef = useRef<string | null | undefined>(null);

  const runInitialLoad = useCallback(async (target: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ajoraRef.current.loadHistory({
        agent: agentRef.current,
        threadId: target,
        limit: pageSizeRef.current,
      });
      if (activeThreadRef.current !== target) return; // stale
      setHasMore(response.hasMore);
      setOldestMessageId(response.oldestMessageId);
    } catch (err) {
      if (activeThreadRef.current !== target) return; // stale
      setError(err instanceof Error ? err : new Error(String(err)));
      setHasMore(false);
      setOldestMessageId(null);
    } finally {
      if (activeThreadRef.current === target) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial load on threadId change. Deliberately depends only on `threadId`
  // (not on `runInitialLoad` or `agent`) so it fires exactly once per thread.
  useEffect(() => {
    if (!threadId) {
      loadedThreadRef.current = null;
      setIsLoading(false);
      setIsLoadingMore(false);
      setHasMore(false);
      setOldestMessageId(null);
      setError(null);
      return;
    }
    if (loadedThreadRef.current === threadId) return;
    loadedThreadRef.current = threadId;
    void runInitialLoad(threadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const loadMore = useCallback(async () => {
    if (!threadId) return;
    if (isLoading || isLoadingMore) return;
    if (!hasMore || !oldestMessageId) return;

    const target = threadId;
    setIsLoadingMore(true);
    setError(null);
    try {
      const response = await ajora.loadHistory({
        agent,
        threadId: target,
        beforeMessageId: oldestMessageId,
        limit: pageSize,
      });
      if (activeThreadRef.current !== target) return; // stale
      setHasMore(response.hasMore);
      // Only advance the cursor if the server returned a new oldest id;
      // otherwise an empty page would leave the cursor stuck.
      if (response.oldestMessageId) {
        setOldestMessageId(response.oldestMessageId);
      }
    } catch (err) {
      if (activeThreadRef.current !== target) return; // stale
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (activeThreadRef.current === target) {
        setIsLoadingMore(false);
      }
    }
  }, [
    ajora,
    agent,
    threadId,
    isLoading,
    isLoadingMore,
    hasMore,
    oldestMessageId,
    pageSize,
  ]);

  const reload = useCallback(async () => {
    if (!threadId) return;
    await runInitialLoad(threadId);
  }, [threadId, runInitialLoad]);

  return {
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    reload,
  };
}
