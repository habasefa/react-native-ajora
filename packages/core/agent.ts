import {
  BaseEvent,
  HttpAgent,
  HttpAgentConfig,
  Message,
  RunAgentInput,
  runHttpRequest,
  transformHttpEventStream,
} from "@ag-ui/client";
import { Observable, catchError, EMPTY, throwError } from "rxjs";
import { AjoraRuntimeTransport } from "./types";
import { AjoraCoreErrorCode } from "./core/core-types";
import { patchedRunHttpRequest } from "../shared/http-request-patch";

export interface ProxiedAjoraRuntimeAgentConfig extends Omit<
  HttpAgentConfig,
  "url"
> {
  runtimeUrl?: string;
  transport?: AjoraRuntimeTransport;
}

export interface FetchHistoryRequest {
  threadId: string;
  /** Cursor: return messages that appear BEFORE this message id. */
  beforeMessageId?: string;
  /** Page size (default 50, server clamps to [1, 200]). */
  limit?: number;
  /** Optional signal to abort the request (e.g. on thread switch). */
  signal?: AbortSignal;
}

export interface FetchHistoryResponse {
  /** Messages ordered oldest → newest. */
  messages: Message[];
  /** Whether more messages exist before `oldestMessageId`. */
  hasMore: boolean;
  /** Cursor to pass as `beforeMessageId` for the next "load earlier" page. */
  oldestMessageId: string | null;
}

// ============================================================================
// Thread management types
// ============================================================================

export interface ThreadRecord {
  id: string;
  title: string;
  resource_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateThreadRequest {
  title?: string;
  subject?: string;
  userId?: string | number;
  id?: string;
  modelId?: string;
  agentId?: string;
  signal?: AbortSignal;
}

export interface ListThreadsRequest {
  resourceId: string;
  cursor?: string;
  limit?: number;
  signal?: AbortSignal;
}

export interface ListThreadsResponse {
  threads: ThreadRecord[];
  nextCursor: string | null;
  hasMore: boolean;
}

export class FetchHistoryError extends Error {
  public readonly code: AjoraCoreErrorCode;
  /** Milliseconds until the client should retry (from Retry-After header). Null if not rate-limited. */
  public readonly retryAfterMs: number | null;

  constructor(
    message: string,
    public readonly status: number,
    retryAfterMs?: number | null,
  ) {
    super(message);
    this.name = "FetchHistoryError";
    this.code = FetchHistoryError.statusToCode(status);
    this.retryAfterMs = retryAfterMs ?? null;
  }

  /**
   * Parse the Retry-After response header into milliseconds.
   * Handles both `Retry-After: <seconds>` and `Retry-After: <HTTP-date>`.
   * Returns null if the header is missing or unparseable.
   */
  static parseRetryAfter(headers: Headers): number | null {
    const value = headers.get("Retry-After");
    if (!value) return null;

    // Try as integer seconds first (most common for 429).
    const seconds = Number(value);
    if (!isNaN(seconds) && seconds >= 0) {
      return seconds * 1000;
    }

    // Try as HTTP-date.
    const date = Date.parse(value);
    if (!isNaN(date)) {
      return Math.max(0, date - Date.now());
    }

    return null;
  }

  private static statusToCode(status: number): AjoraCoreErrorCode {
    switch (status) {
      case 401:
      case 403:
        return AjoraCoreErrorCode.HISTORY_UNAUTHORIZED;
      case 429:
        return AjoraCoreErrorCode.HISTORY_RATE_LIMITED;
      default:
        return AjoraCoreErrorCode.HISTORY_LOAD_FAILED;
    }
  }
}

export class ProxiedAjoraRuntimeAgent extends HttpAgent {
  runtimeUrl?: string;
  private transport: AjoraRuntimeTransport;
  private singleEndpointUrl?: string;

  constructor(config: ProxiedAjoraRuntimeAgentConfig) {
    const normalizedRuntimeUrl = config.runtimeUrl
      ? config.runtimeUrl.replace(/\/$/, "")
      : undefined;
    const transport = config.transport ?? "rest";
    const runUrl =
      transport === "single"
        ? (normalizedRuntimeUrl ?? config.runtimeUrl ?? "")
        : `${normalizedRuntimeUrl ?? config.runtimeUrl}/agent/${encodeURIComponent(config.agentId ?? "")}/run`;

    if (!runUrl) {
      throw new Error(
        "ProxiedAjoraRuntimeAgent requires a runtimeUrl when transport is set to 'single'.",
      );
    }

    super({
      ...config,
      url: runUrl,
    });
    this.runtimeUrl = normalizedRuntimeUrl ?? config.runtimeUrl;
    this.transport = transport;
    if (this.transport === "single") {
      this.singleEndpointUrl = this.runtimeUrl;
    }
  }

  async abortRun(): Promise<boolean> {
    if (!this.agentId || !this.threadId) {
      return false;
    }

    if (typeof fetch === "undefined") {
      return false;
    }

    const sendStop = async (
      url: string,
      init: RequestInit,
    ): Promise<boolean> => {
      try {
        const response = await fetch(url, init);
        if (!response.ok) {
          console.warn(
            `ProxiedAjoraRuntimeAgent: stop request returned ${response.status}`,
          );
          return false;
        }
        return true;
      } catch (error) {
        console.error(
          "ProxiedAjoraRuntimeAgent: stop request failed",
          error,
        );
        return false;
      }
    };

    if (this.transport === "single") {
      if (!this.singleEndpointUrl) {
        return false;
      }

      return sendStop(this.singleEndpointUrl, {
        method: "POST",
        headers: new Headers({
          ...this.headers,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          method: "agent/stop",
          params: {
            agentId: this.agentId,
            threadId: this.threadId,
          },
        }),
      });
    }

    if (!this.runtimeUrl) {
      return false;
    }

    const stopUrl = `${this.runtimeUrl}/agent/${encodeURIComponent(this.agentId)}/stop/${encodeURIComponent(this.threadId)}`;

    return sendStop(stopUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
      },
    });
  }

  connect(input: RunAgentInput): Observable<BaseEvent> {
    if (this.transport === "single") {
      if (!this.singleEndpointUrl) {
        throw new Error("Single endpoint transport requires a runtimeUrl");
      }

      const requestInit = this.createSingleRouteRequestInit(
        input,
        "agent/connect",
        {
          agentId: this.agentId!,
        },
      );
      const httpEvents = patchedRunHttpRequest(
        this.singleEndpointUrl,
        requestInit,
        runHttpRequest,
      );
      return withAbortErrorHandling(
        transformHttpEventStream(httpEvents),
        this.abortController.signal,
      );
    }

    const httpEvents = patchedRunHttpRequest(
      `${this.runtimeUrl}/agent/${this.agentId}/connect`,
      this.requestInit(input),
      runHttpRequest,
    );
    return withAbortErrorHandling(
      transformHttpEventStream(httpEvents),
      this.abortController.signal,
    );
  }

  public run(input: RunAgentInput): Observable<BaseEvent> {
    if (this.transport === "single") {
      if (!this.singleEndpointUrl) {
        throw new Error("Single endpoint transport requires a runtimeUrl");
      }

      const requestInit = this.createSingleRouteRequestInit(
        input,
        "agent/run",
        {
          agentId: this.agentId!,
        },
      );
      const httpEvents = patchedRunHttpRequest(
        this.singleEndpointUrl,
        requestInit,
        runHttpRequest,
      );
      return withAbortErrorHandling(
        transformHttpEventStream(httpEvents),
        this.abortController.signal,
      );
    }

    return withAbortErrorHandling(super.run(input), this.abortController.signal);
  }

  /**
   * Fetch persisted messages for a thread from the runtime's history endpoint.
   *
   * Unlike `connect()`/`run()`, this is a plain JSON POST (not SSE) and does
   * not feed events into the agent's internal `apply` pipeline. The caller
   * (typically `AjoraCore.loadHistory`) decides how to merge the returned
   * messages into the in-memory `messages` array.
   *
   * Throws `FetchHistoryError` for any non-2xx response so the caller can
   * surface auth failures (401/403) distinctly from network errors.
   */
  async fetchHistory(
    request: FetchHistoryRequest,
  ): Promise<FetchHistoryResponse> {
    if (typeof fetch === "undefined") {
      throw new FetchHistoryError("fetch is not available", 0);
    }
    if (!this.agentId) {
      throw new FetchHistoryError(
        "ProxiedAjoraRuntimeAgent requires agentId to fetch history",
        0,
      );
    }

    const headers = new Headers({
      ...(this.headers ?? {}),
      "Content-Type": "application/json",
      Accept: "application/json",
    });

    let url: string;
    let body: string;
    if (this.transport === "single") {
      if (!this.singleEndpointUrl) {
        throw new FetchHistoryError(
          "Single endpoint transport requires a runtimeUrl",
          0,
        );
      }
      url = this.singleEndpointUrl;
      body = JSON.stringify({
        method: "agent/history",
        params: { agentId: this.agentId },
        body: {
          threadId: request.threadId,
          beforeMessageId: request.beforeMessageId,
          limit: request.limit,
        },
      });
    } else {
      if (!this.runtimeUrl) {
        throw new FetchHistoryError("REST transport requires a runtimeUrl", 0);
      }
      url = `${this.runtimeUrl}/agent/${encodeURIComponent(this.agentId)}/history`;
      body = JSON.stringify({
        threadId: request.threadId,
        beforeMessageId: request.beforeMessageId,
        limit: request.limit,
      });
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: request.signal,
      });
    } catch (error) {
      throw new FetchHistoryError(
        error instanceof Error ? error.message : "Network error",
        0,
      );
    }

    if (!response.ok) {
      let message = `History request failed with status ${response.status}`;
      try {
        const payload = (await response.json()) as { message?: string };
        if (payload?.message) message = payload.message;
      } catch {
        // body wasn't JSON; keep default message
      }
      const retryAfterMs = FetchHistoryError.parseRetryAfter(response.headers);
      throw new FetchHistoryError(message, response.status, retryAfterMs);
    }

    const payload = (await response.json()) as Partial<FetchHistoryResponse>;
    if (
      !payload ||
      !Array.isArray(payload.messages) ||
      typeof payload.hasMore !== "boolean"
    ) {
      throw new FetchHistoryError(
        "History response was malformed",
        response.status,
      );
    }
    return {
      messages: payload.messages,
      hasMore: payload.hasMore,
      oldestMessageId: payload.oldestMessageId ?? null,
    };
  }

  /**
   * Derive the base URL for thread management endpoints.
   *
   * For the single-endpoint transport the runtimeUrl IS the single route,
   * so we strip the last path segment to get the server origin/base.
   * For REST transport the runtimeUrl is already the server base.
   */
  private get threadsBaseUrl(): string | null {
    if (!this.runtimeUrl) return null;
    if (this.transport === "single") {
      // e.g. "https://host/api/copilotkit" → "https://host"
      try {
        const url = new URL(this.runtimeUrl);
        return url.origin;
      } catch {
        // runtimeUrl may be a relative path in dev — strip the last segment.
        const idx = this.runtimeUrl.lastIndexOf("/");
        return idx > 0 ? this.runtimeUrl.slice(0, idx) : this.runtimeUrl;
      }
    }
    return this.runtimeUrl;
  }

  /**
   * Create a new thread on the server.
   */
  async createThread(
    request: CreateThreadRequest,
  ): Promise<ThreadRecord> {
    const base = this.threadsBaseUrl;
    if (!base) {
      throw new FetchHistoryError("No runtimeUrl configured for thread management", 0);
    }

    const headers = new Headers({
      ...(this.headers ?? {}),
      "Content-Type": "application/json",
      Accept: "application/json",
    });

    const { signal, ...body } = request;
    const response = await fetch(`${base}/magnus/threads`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      let message = `Create thread failed with status ${response.status}`;
      try {
        const payload = (await response.json()) as { message?: string };
        if (payload?.message) message = payload.message;
      } catch { /* keep default message */ }
      throw new FetchHistoryError(message, response.status);
    }

    return (await response.json()) as ThreadRecord;
  }

  /**
   * List threads for a given resource (user).
   */
  async listThreads(
    request: ListThreadsRequest,
  ): Promise<ListThreadsResponse> {
    const base = this.threadsBaseUrl;
    if (!base) {
      throw new FetchHistoryError("No runtimeUrl configured for thread management", 0);
    }

    const headers = new Headers({
      ...(this.headers ?? {}),
      Accept: "application/json",
    });

    const params = new URLSearchParams();
    params.set("resourceId", request.resourceId);
    if (request.cursor) params.set("cursor", request.cursor);
    if (request.limit != null) params.set("limit", String(request.limit));

    const response = await fetch(
      `${base}/magnus/threads?${params.toString()}`,
      { method: "GET", headers, signal: request.signal },
    );

    if (!response.ok) {
      let message = `List threads failed with status ${response.status}`;
      try {
        const payload = (await response.json()) as { message?: string };
        if (payload?.message) message = payload.message;
      } catch { /* keep default message */ }
      throw new FetchHistoryError(message, response.status);
    }

    const payload = (await response.json()) as Partial<ListThreadsResponse>;
    return {
      threads: payload.threads ?? [],
      nextCursor: payload.nextCursor ?? null,
      hasMore: payload.hasMore ?? false,
    };
  }

  public override clone(): ProxiedAjoraRuntimeAgent {
    const cloned = super.clone() as ProxiedAjoraRuntimeAgent;
    cloned.runtimeUrl = this.runtimeUrl;
    cloned.transport = this.transport;
    cloned.singleEndpointUrl = this.singleEndpointUrl;
    return cloned;
  }

  private createSingleRouteRequestInit(
    input: RunAgentInput,
    method: string,
    params?: Record<string, string>,
  ): RequestInit {
    if (!this.agentId) {
      throw new Error(
        "ProxiedAjoraRuntimeAgent requires agentId to make runtime requests",
      );
    }

    const baseInit = super.requestInit(input);
    const headers = new Headers(baseInit.headers ?? {});
    headers.set("Content-Type", "application/json");
    headers.set("Accept", headers.get("Accept") ?? "text/event-stream");

    let originalBody: unknown = undefined;
    if (typeof baseInit.body === "string") {
      try {
        originalBody = JSON.parse(baseInit.body);
      } catch (error) {
        console.warn(
          "ProxiedAjoraRuntimeAgent: failed to parse request body for single route transport",
          error,
        );
        originalBody = undefined;
      }
    }

    const envelope: Record<string, unknown> = {
      method,
    };

    if (params && Object.keys(params).length > 0) {
      envelope.params = params;
    }

    if (originalBody !== undefined) {
      envelope.body = originalBody;
    }

    return {
      ...baseInit,
      headers,
      body: JSON.stringify(envelope),
    };
  }
}

function isZodError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "ZodError"
  );
}

/**
 * Wrap an Observable to catch and suppress ZodErrors that occur during stream
 * abort. These errors are expected when the connection is cancelled mid-stream
 * and the SSE parser gets handed a truncated event.
 *
 * IMPORTANT: we only swallow the ZodError when the abort signal has actually
 * fired. Previously this suppressed *all* ZodErrors unconditionally, which
 * turned real server protocol bugs (malformed SSE, schema drift, corrupt
 * payloads) into a silent empty-stream. On the consumer side that manifests
 * as `lastValueFrom` throwing `EmptyError` — exactly the "click does nothing,
 * then freeze" symptom we chased through magnus.tsx. Re-raising Zod errors
 * from non-aborted streams lets `onRunFailed` / `onError` surface a real
 * message to the UI instead.
 */
function withAbortErrorHandling(
  observable: Observable<BaseEvent>,
  abortSignal: AbortSignal,
): Observable<BaseEvent> {
  return observable.pipe(
    catchError((error) => {
      if (isZodError(error) && abortSignal.aborted) {
        return EMPTY;
      }
      throw error;
    }),
  );
}
