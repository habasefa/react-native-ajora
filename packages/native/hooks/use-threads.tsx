import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_AGENT_ID } from "../../shared";
import type {
  ThreadRecord,
  ListThreadsResponse,
  CreateThreadRequest,
} from "../../core";
import { AjoraCoreRuntimeConnectionStatus } from "../../core";
import { useAjora } from "../providers/AjoraProvider";

export interface UseThreadsProps {
  /** Agent whose runtime provides the threads endpoint. Defaults to DEFAULT_AGENT_ID. */
  agentId?: string;
  /** Resource / user ID to filter threads by. Required. */
  resourceId: string;
  /** Page size for each request. Defaults to 20. */
  pageSize?: number;
}

export interface UseThreadsResult {
  /** The currently loaded threads (newest first from API). */
  threads: ThreadRecord[];
  /** True while the initial page is loading. */
  isLoading: boolean;
  /** True while a "load more" page is in flight. */
  isLoadingMore: boolean;
  /** Whether older threads exist beyond the last loaded page. */
  hasMore: boolean;
  /** Last error encountered. */
  error: Error | null;
  /** Fetch the next page of threads and append them. */
  loadMore: () => Promise<void>;
  /** Re-fetch from the beginning. Useful after creating a thread. */
  reload: () => Promise<void>;
  /** Create a new thread and prepend it to the local list. */
  createThread: (request?: Omit<CreateThreadRequest, "signal">) => Promise<ThreadRecord>;
}

/**
 * Hook for listing and creating threads, backed by the server's
 * `/magnus/threads` endpoint. Exposes cursor-based pagination.
 */
export function useThreads({
  agentId,
  resourceId,
  pageSize = 20,
}: UseThreadsProps): UseThreadsResult {
  const resolvedAgentId = agentId ?? DEFAULT_AGENT_ID;
  const { ajora } = useAjora();

  const [threads, setThreads] = useState<ThreadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const ajoraRef = useRef(ajora);
  ajoraRef.current = ajora;
  const pageSizeRef = useRef(pageSize);
  pageSizeRef.current = pageSize;
  const resourceIdRef = useRef(resourceId);
  resourceIdRef.current = resourceId;
  const agentIdRef = useRef(resolvedAgentId);
  agentIdRef.current = resolvedAgentId;

  const runtimeStatus = ajora.runtimeConnectionStatus;
  const runtimeReady =
    !ajora.runtimeUrl ||
    runtimeStatus === AjoraCoreRuntimeConnectionStatus.Connected ||
    runtimeStatus === AjoraCoreRuntimeConnectionStatus.Error;

  const fetchPage = useCallback(
    async (
      pageCursor: string | undefined,
      mode: "initial" | "more",
    ): Promise<ListThreadsResponse | null> => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await ajoraRef.current.listThreads(
          agentIdRef.current,
          {
            resourceId: resourceIdRef.current,
            cursor: pageCursor,
            limit: pageSizeRef.current,
            signal: controller.signal,
          },
        );
        if (controller.signal.aborted) return null;
        return response;
      } catch (err) {
        if (controller.signal.aborted) return null;
        throw err;
      }
    },
    [],
  );

  const runInitialLoad = useCallback(async () => {
    abortRef.current?.abort();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchPage(undefined, "initial");
      if (!response) return;
      setThreads(response.threads);
      setCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setThreads([]);
      setCursor(null);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage]);

  // Initial load when resourceId changes or runtime becomes ready.
  useEffect(() => {
    if (!resourceId || !runtimeReady) return;
    void runInitialLoad();
    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId, runtimeReady]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore || !cursor) return;
    setIsLoadingMore(true);
    setError(null);
    try {
      const response = await fetchPage(cursor, "more");
      if (!response) return;
      setThreads((prev) => [...prev, ...response.threads]);
      setCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, hasMore, cursor, fetchPage]);

  const reload = useCallback(async () => {
    await runInitialLoad();
  }, [runInitialLoad]);

  const createThread = useCallback(
    async (
      request?: Omit<CreateThreadRequest, "signal">,
    ): Promise<ThreadRecord> => {
      const controller = new AbortController();
      const thread = await ajoraRef.current.createThread(
        agentIdRef.current,
        { ...request, signal: controller.signal },
      );
      // Prepend the new thread to the local list so the UI updates instantly.
      setThreads((prev) => [thread, ...prev]);
      return thread;
    },
    [],
  );

  return {
    threads,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    reload,
    createThread,
  };
}
