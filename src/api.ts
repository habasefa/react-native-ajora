import EventSource from "react-native-sse";
import { IMessage } from "./types";
import { SourceProps } from "./source/types";
import { SuggestionProps } from "./suggestion/types";
import { Thread } from "./Thread/types";

export interface ApiConfig {
  baseUrl: string;
  bearerToken?: string;
  debug?: boolean;
}

// UserEvent types to the API
export type UserEvent =
  | {
      type: "text";
      message: IMessage;
      mode?: string;
    }
  | {
      type: "function_response";
      message: IMessage;
      mode?: string;
    }
  | {
      type: "regenerate";
      message: IMessage;
      mode?: string;
    };

// AgentEvent types from the API
export interface MessageEvent {
  type: "message";
  message: IMessage;
}

export interface FunctionResponseEvent {
  type: "function_response";
  message: IMessage;
}

export interface ThreadTitleEvent {
  type: "thread_title";
  // Server may send just a title string or a full Thread object
  threadTitle: string | Thread;
}

export interface SourcesEvent {
  type: "sources";
  sources: SourceProps[];
}

export interface SuggestionsEvent {
  type: "suggestions";
  suggestions: SuggestionProps[];
}

export interface IsThinkingEvent {
  type: "is_thinking";
  is_thinking: boolean;
}

export interface CompleteEvent {
  type: "complete";
  is_complete: boolean;
}

export interface ErrorEvent {
  type: "error";
  error: {
    thread_id: string;
    message_id: string;
    error: string;
  };
}

export type AgentEvent =
  | MessageEvent
  | FunctionResponseEvent
  | ThreadTitleEvent
  | SourcesEvent
  | SuggestionsEvent
  | IsThinkingEvent
  | CompleteEvent
  | ErrorEvent;

export interface StreamResponseOptions {
  onOpen?: () => void;
  onChunk: (chunk: AgentEvent) => void;
  onFunctionResponse: (functionResponse: FunctionResponseEvent) => void;
  onThreadTitle: (threadTitle: ThreadTitleEvent) => void;
  onSources: (sources: SourcesEvent) => void;
  onSuggestions: (suggestions: SuggestionsEvent) => void;
  onComplete: (complete: AgentEvent) => void;
  onIsThinking: (isThinking: IsThinkingEvent) => void;
  onError: (error: ErrorEvent) => void;
  abortSignal?: AbortSignal;
}

export class ApiService {
  private config: ApiConfig;
  private eventSource: EventSource | null = null;

  constructor(config: ApiConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      bearerToken: config.bearerToken,
      debug: config.debug ?? false,
    };
  }

  /**
   * Stream a response from the API using Server-Sent Events
   */
  streamResponse(query: UserEvent, options: StreamResponseOptions): () => void {
    const {
      onOpen,
      onChunk,
      onFunctionResponse,
      onThreadTitle,
      onSources,
      onSuggestions,
      onIsThinking,
      onError,
      onComplete,
      abortSignal,
    } = options;

    try {
      // If already aborted before starting, no-op and let caller handle state
      if (abortSignal?.aborted) {
        console.info("[Ajora]: Abort signal already set before opening SSE");
        return () => {};
      }

      // Convert query object to URL search parameters
      const queryParams = new URLSearchParams();
      queryParams.append("type", query.type);
      queryParams.append("message", JSON.stringify(query.message));
      if (query.mode) {
        queryParams.append("mode", query.mode);
      }

      // Prepare headers for EventSource
      const headers: Record<string, any> = {};
      if (this.config.bearerToken) {
        headers.Authorization = {
          toString: function () {
            return "Bearer " + this.token;
          },
          token: this.config.bearerToken,
        };
      }

      this.eventSource = new EventSource(
        `${this.config.baseUrl}/api/stream?${queryParams.toString()}`,
        {
          pollingInterval: 0,
          debug: this.config.debug,
          headers,
        }
      );

      // Hook abort signal to close the SSE connection
      let abortHandler: (() => void) | null = null;
      if (abortSignal) {
        abortHandler = () => {
          console.info("[Ajora]: Abort received. Closing SSE connection.");
          this.close();
        };
        abortSignal.addEventListener("abort", abortHandler);
      }

      this.eventSource.addEventListener("open", () => {
        console.info("[Ajora]: SSE connection opened");
        onOpen?.();
      });

      this.eventSource.addEventListener("message", (event) => {
        console.log("[Ajora]: SSE message received:", event);
        try {
          if (!event.data) throw new Error("Empty SSE event data");

          const agentEvent: AgentEvent = JSON.parse(event.data);

          switch (agentEvent.type) {
            case "thread_title":
              return onThreadTitle(agentEvent as ThreadTitleEvent);
            case "complete":
              console.log("[Ajora]: Complete event received:", agentEvent);
              onComplete(agentEvent);
              return;
            case "sources":
              return onSources(agentEvent as SourcesEvent);
            case "suggestions":
              return onSuggestions(agentEvent as SuggestionsEvent);
            case "function_response":
              return onFunctionResponse(agentEvent as FunctionResponseEvent);
            case "error":
              this.close();
              return onError(agentEvent as ErrorEvent);

            case "is_thinking":
              return onIsThinking(agentEvent as IsThinkingEvent);
            case "message":
              return onChunk(agentEvent as MessageEvent);
            default:
              console.warn("[Ajora]: Unknown SSE event type:", agentEvent);
              return;
          }
        } catch (parseError) {
          console.error("[Ajora]: Failed to parse SSE data:", parseError);
          this.close();
          onError({
            type: "error",
            error: {
              thread_id: "",
              message_id: "",
              error: "Failed to parse server response",
            },
          });
        }
      });

      this.eventSource.addEventListener("error", (event: any) => {
        console.error("[Ajora]: SSE connection error:", event);
        this.close();
        onError({
          type: "error",
          error: {
            thread_id: "",
            message_id: "",
            error: event?.message || "SSE connection failed",
          },
        });
      });

      return () => {
        // Clean up abort listener first to avoid duplicate close calls
        if (abortSignal && abortHandler) {
          try {
            abortSignal.removeEventListener("abort", abortHandler);
          } catch {}
        }
        this.close();
      };
    } catch (error) {
      console.error("[Ajora]: Error creating SSE connection:", error);
      onError({
        type: "error",
        error: {
          thread_id: "",
          message_id: "",
          error: "Failed to create connection",
        },
      });
      return () => {};
    }
  }

  // Thread endpoints
  getThreads(): Promise<Thread[]> {
    const headers: Record<string, string> = {};
    if (this.config.bearerToken) {
      headers.Authorization = `Bearer ${this.config.bearerToken}`;
    }

    return fetch(`${this.config.baseUrl}/api/threads`, { headers }).then(
      (res) => res.json()
    );
  }

  createThread(title?: string): Promise<Thread> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.config.bearerToken) {
      headers.Authorization = `Bearer ${this.config.bearerToken}`;
    }

    return fetch(`${this.config.baseUrl}/api/threads`, {
      method: "POST",
      headers,
      body: JSON.stringify({ title }),
    }).then((res) => res.json());
  }

  private close(): void {
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }
  }

  // Message endpoints
  getMessages(threadId: string): Promise<IMessage[]> {
    const headers: Record<string, string> = {};
    if (this.config.bearerToken) {
      headers.Authorization = `Bearer ${this.config.bearerToken}`;
    }

    return fetch(`${this.config.baseUrl}/api/threads/${threadId}/messages`, {
      headers,
    }).then((res) => {
      return res.json();
    });
  }

  updateConfig(newConfig: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ApiConfig {
    return { ...this.config };
  }
}

const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: "http://localhost:3000",
};

export const defaultApiService = new ApiService(DEFAULT_CONFIG);
export const streamResponse =
  defaultApiService.streamResponse.bind(defaultApiService);

export default ApiService;
