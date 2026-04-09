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
}

export interface FetchHistoryResponse {
  /** Messages ordered oldest → newest. */
  messages: Message[];
  /** Whether more messages exist before `oldestMessageId`. */
  hasMore: boolean;
  /** Cursor to pass as `beforeMessageId` for the next "load earlier" page. */
  oldestMessageId: string | null;
}

export class FetchHistoryError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "FetchHistoryError";
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

  abortRun(): void {
    if (!this.agentId || !this.threadId) {
      return;
    }

    if (typeof fetch === "undefined") {
      return;
    }

    const sendStop = (url: string, init: RequestInit): void => {
      fetch(url, init)
        .then((response) => {
          if (!response.ok) {
            console.warn(
              `ProxiedAjoraRuntimeAgent: stop request returned ${response.status}`,
            );
          }
        })
        .catch((error) => {
          console.error("ProxiedAjoraRuntimeAgent: stop request failed", error);
        });
    };

    if (this.transport === "single") {
      if (!this.singleEndpointUrl) {
        return;
      }

      sendStop(this.singleEndpointUrl, {
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
      return;
    }

    if (!this.runtimeUrl) {
      return;
    }

    const stopPath = `${this.runtimeUrl}/agent/${encodeURIComponent(this.agentId)}/stop/${encodeURIComponent(this.threadId)}`;
    const origin = "http://localhost";
    const base = new URL(this.runtimeUrl, origin);
    const stopUrl = new URL(stopPath, base);

    sendStop(stopUrl.toString(), {
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
      response = await fetch(url, { method: "POST", headers, body });
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
      throw new FetchHistoryError(message, response.status);
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
