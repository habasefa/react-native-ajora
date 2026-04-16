import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_AGENT_ID } from "../../shared";
import { AjoraCoreRuntimeConnectionStatus } from "../../core";
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

  // Refs for guard checks so loadMore doesn't need state in its dep array.
  const isLoadingRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);
  const oldestMessageIdRef = useRef<string | null>(null);

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
  isLoadingRef.current = isLoading;
  isLoadingMoreRef.current = isLoadingMore;
  hasMoreRef.current = hasMore;
  oldestMessageIdRef.current = oldestMessageId;

  // Track which threadId we've already kicked off a load for. We never want
  // to fire the initial load more than once for the same threadId — repeated
  // loads can clobber in-memory messages added by the user between fetches.
  const loadedThreadRef = useRef<string | null | undefined>(null);

  // Two independent AbortControllers so `runInitialLoad` and `loadMore` don't
  // clobber each other's cancellation. Previously both wrote to a single
  // `abortRef`, which meant a later call overwrote the controller of an
  // in-flight earlier call — and a thread switch or unmount only aborted
  // whichever one was most recently stored.
  const initialAbortRef = useRef<AbortController | null>(null);
  const moreAbortRef = useRef<AbortController | null>(null);

  const abortAllInFlight = () => {
    initialAbortRef.current?.abort();
    moreAbortRef.current?.abort();
  };

  // Determine if the runtime is ready (connected, or no runtime configured).
  // We must NOT fire the initial load while the runtime is still Connecting
  // because `agent` would be a provisional stub whose `messages` array will
  // be discarded once the real agent arrives.
  const runtimeStatus = ajora.runtimeConnectionStatus;
  const runtimeReady =
    !ajora.runtimeUrl ||
    runtimeStatus === AjoraCoreRuntimeConnectionStatus.Connected ||
    runtimeStatus === AjoraCoreRuntimeConnectionStatus.Error;

  const runInitialLoad = useCallback(async (target: string) => {
    // Cancel any previous in-flight initial load, and also any in-flight
    // load-earlier — on a reload or thread switch we don't want a stale
    // older-page response prepending into the freshly reloaded list.
    initialAbortRef.current?.abort();
    moreAbortRef.current?.abort();
    const controller = new AbortController();
    initialAbortRef.current = controller;

    // Reset pagination state up front so the UI doesn't briefly show a
    // "Load earlier" button with a cursor from the previous load.
    setHasMore(false);
    setOldestMessageId(null);
    setIsLoadingMore(false);
    setIsLoading(true);
    setError(null);
    try {
      const response = await ajoraRef.current.loadHistory({
        agent: agentRef.current,
        threadId: target,
        limit: pageSizeRef.current,
        signal: controller.signal,
      });
      if (activeThreadRef.current !== target) return; // stale
      setHasMore(response.hasMore);
      setOldestMessageId(response.oldestMessageId);
    } catch (err) {
      if (controller.signal.aborted) return; // intentionally cancelled
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

  // Initial load on threadId change. Waits for the runtime to be ready so
  // we use the real agent, not the provisional stub. Re-fires when
  // `runtimeReady` flips to true for the current threadId.
  useEffect(() => {
    if (!threadId) {
      abortAllInFlight();
      loadedThreadRef.current = null;
      setIsLoading(false);
      setIsLoadingMore(false);
      setHasMore(false);
      setOldestMessageId(null);
      setError(null);
      return;
    }
    if (!runtimeReady) {
      return;
    }
    if (loadedThreadRef.current === threadId) {
      return;
    }
    // Switching from a previously-loaded thread: drop the prior thread's
    // messages so they don't flash in the new thread while the initial load
    // is in flight — and so a brand-new thread (server returns 0 messages)
    // actually starts empty instead of inheriting the prior conversation.
    // The first-mount case (loadedThreadRef === null) is left alone so that
    // messages populated by a concurrent connectAgent are preserved by
    // loadHistory's merge logic.
    if (loadedThreadRef.current && loadedThreadRef.current !== threadId) {
      agentRef.current?.setMessages?.([]);
    }
    loadedThreadRef.current = threadId;
    void runInitialLoad(threadId);

    return () => {
      abortAllInFlight();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, runtimeReady]);

  const loadMore = useCallback(async () => {
    const target = activeThreadRef.current;
    if (!target) return;
    if (isLoadingRef.current || isLoadingMoreRef.current) return;
    if (!hasMoreRef.current || !oldestMessageIdRef.current) return;

    const cursor = oldestMessageIdRef.current;
    const controller = new AbortController();
    moreAbortRef.current = controller;

    setIsLoadingMore(true);
    setError(null);
    try {
      const response = await ajoraRef.current.loadHistory({
        agent: agentRef.current,
        threadId: target,
        beforeMessageId: cursor,
        limit: pageSizeRef.current,
        signal: controller.signal,
      });
      if (activeThreadRef.current !== target) return; // stale
      setHasMore(response.hasMore);
      // Only advance the cursor if the server returned a new oldest id;
      // otherwise an empty page would leave the cursor stuck.
      if (response.oldestMessageId) {
        setOldestMessageId(response.oldestMessageId);
      }
    } catch (err) {
      if (controller.signal.aborted) return; // intentionally cancelled
      if (activeThreadRef.current !== target) return; // stale
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (activeThreadRef.current === target) {
        setIsLoadingMore(false);
      }
    }
  }, []);

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
