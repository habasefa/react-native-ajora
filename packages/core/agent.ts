import {
  BaseEvent,
  HttpAgent,
  HttpAgentConfig,
  Message,
  RunAgentInput,
  RunAgentResult,
  AgentSubscriber,
  RunAgentParameters,
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

  /**
   * Hard cap on how long we'll wait for `agent/connect` to finish. The
   * underlying `super.connectAgent` awaits `lastValueFrom` on the SSE
   * pipeline, which only resolves when the stream completes (server closes
   * or emits a terminal event). If the server holds the stream open — a
   * common dev-server bug, especially for empty threads where there's
   * nothing to send — `isRunning` stays `true` indefinitely, which locks
   * the chat input into "processing" mode and gives the appearance of a
   * frozen UI.
   *
   * After this timeout we abort the underlying fetch and forcibly clear
   * `isRunning` so the agent is usable again. The next `runAgent` call
   * creates a fresh AbortController (per @ag-ui/client semantics), so
   * aborting here doesn't poison subsequent runs.
   */
  private static readonly CONNECT_TIMEOUT_MS = 15_000;

  public async connectAgent(
    parameters?: RunAgentParameters,
    subscriber?: AgentSubscriber,
  ): Promise<RunAgentResult> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        super.connectAgent(parameters, subscriber),
        new Promise<RunAgentResult>((_, reject) => {
          timeoutId = setTimeout(() => {
            try {
              this.abortController.abort();
            } catch {
              /* ignore — best-effort */
            }
            // The pipeline's `finalize` would normally clear this, but if
            // the pipe is wedged we surface the agent as ready anyway.
            (this as unknown as { isRunning: boolean }).isRunning = false;
            reject(
              new Error(
                `connectAgent timed out after ${ProxiedAjoraRuntimeAgent.CONNECT_TIMEOUT_MS}ms ` +
                  `(server may be holding the SSE stream open without emitting RUN_FINISHED)`,
              ),
            );
          }, ProxiedAjoraRuntimeAgent.CONNECT_TIMEOUT_MS);
        }),
      ]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
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

// ============================================================================
// StatelessAjoraRuntimeAgent
// ============================================================================

export interface StatelessAjoraRuntimeAgentConfig
  extends Omit<HttpAgentConfig, "url"> {
  /**
   * Full URL the agent POSTs AG-UI run requests to. No path wrapping is
   * applied. Point this at a dedicated stateless endpoint, OR reuse the same
   * runtime URL as your main agent — in the latter case the backend should
   * branch on the `stateless: true` flag added to `forwardedProps` and skip
   * writing to the thread store.
   */
  url: string;
  transport?: AjoraRuntimeTransport;
}

/**
 * A one-shot, non-persistent variant of `ProxiedAjoraRuntimeAgent`. Intended
 * for provider agents in contexts like suggestions — where the client spins
 * up a fresh `threadId` per run and we don't want those runs materializing
 * as ghost threads in the magnus thread store.
 *
 * Every outbound run injects `stateless: true` + `isEphemeral: true` into
 * `forwardedProps` so the backend can recognize the run and opt out of
 * persistence. Thread-management methods (`createThread`, `listThreads`,
 * `fetchHistory`) throw — this agent has no thread model by design.
 *
 * @example
 * // 1. Construct both agents at app boot.
 * const mainAgent = new ProxiedAjoraRuntimeAgent({
 *   runtimeUrl: "https://api.example.com",
 *   agentId: "default",
 * });
 * const suggestionsProvider = new StatelessAjoraRuntimeAgent({
 *   // Point at a dedicated stateless endpoint, or reuse the main URL and
 *   // branch on `forwardedProps.stateless === true` on the server.
 *   url: "https://api.example.com/agent/suggestions/run",
 *   agentId: "suggestions",
 * });
 *
 * // 2. Register both on the provider.
 * <AjoraProvider
 *   agents__unsafe_dev_only={{
 *     default: mainAgent,
 *     "suggestions-provider": suggestionsProvider,
 *   }}
 * >
 *   {children}
 * </AjoraProvider>
 *
 * // 3. Point suggestions at the stateless provider.
 * useConfigureSuggestions({
 *   available: "enabled",
 *   providerAgentId: "suggestions-provider",
 *   instructions: "Suggest three short follow-ups.",
 * });
 *
 * // 4. On the backend, honor the flag:
 * // if (body.forwardedProps?.stateless) { skipWriteToThreadStore(); }
 */
export class StatelessAjoraRuntimeAgent extends HttpAgent {
  private transport: AjoraRuntimeTransport;
  private statelessUrl: string;

  constructor(config: StatelessAjoraRuntimeAgentConfig) {
    if (!config.url) {
      throw new Error("StatelessAjoraRuntimeAgent requires a url.");
    }
    super({ ...config, url: config.url });
    this.statelessUrl = config.url;
    this.transport = config.transport ?? "rest";
  }

  public run(input: RunAgentInput): Observable<BaseEvent> {
    const annotated: RunAgentInput = {
      ...input,
      forwardedProps: {
        ...((input.forwardedProps as Record<string, unknown> | undefined) ?? {}),
        stateless: true,
        isEphemeral: true,
      },
    };

    if (this.transport === "single") {
      if (!this.agentId) {
        throw new Error(
          "StatelessAjoraRuntimeAgent requires agentId for the single-route transport.",
        );
      }
      const baseInit = super.requestInit(annotated);
      const headers = new Headers(baseInit.headers ?? {});
      headers.set("Content-Type", "application/json");
      headers.set("Accept", headers.get("Accept") ?? "text/event-stream");

      let body: unknown = undefined;
      if (typeof baseInit.body === "string") {
        try {
          body = JSON.parse(baseInit.body);
        } catch {
          body = undefined;
        }
      }

      const requestInit: RequestInit = {
        ...baseInit,
        headers,
        body: JSON.stringify({
          method: "agent/run",
          params: { agentId: this.agentId },
          body,
        }),
      };
      const httpEvents = patchedRunHttpRequest(
        this.statelessUrl,
        requestInit,
        runHttpRequest,
      );
      return withAbortErrorHandling(
        transformHttpEventStream(httpEvents),
        this.abortController.signal,
      );
    }

    return withAbortErrorHandling(
      super.run(annotated),
      this.abortController.signal,
    );
  }

  async createThread(): Promise<never> {
    throw new Error(
      "StatelessAjoraRuntimeAgent does not support thread creation — it is stateless by design.",
    );
  }

  async listThreads(): Promise<never> {
    throw new Error(
      "StatelessAjoraRuntimeAgent does not support thread listing — it is stateless by design.",
    );
  }

  async fetchHistory(): Promise<never> {
    throw new Error(
      "StatelessAjoraRuntimeAgent does not support history fetch — it is stateless by design.",
    );
  }

  public override clone(): StatelessAjoraRuntimeAgent {
    const cloned = super.clone() as StatelessAjoraRuntimeAgent;
    cloned.transport = this.transport;
    cloned.statelessUrl = this.statelessUrl;
    return cloned;
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
