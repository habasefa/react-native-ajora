import EventSource from "react-native-sse";
import { IMessage } from "./types";
import { SourceProps } from "./source/types";
import { SuggestionProps } from "./suggestion/types";
import { Thread } from "./Thread/types";

export interface ApiConfig {
  baseUrl: string;
}

// UserEvent types to the API
export type UserEvent =
  | {
      type: "text";
      message: IMessage;
    }
  | {
      type: "function_response";
      message: IMessage;
    }
  | {
      type: "regenerate";
      message: IMessage;
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
  threadTitle: Thread;
}

export interface SourcesEvent {
  type: "sources";
  sources: SourceProps[];
}

export interface SuggestionsEvent {
  type: "suggestions";
  suggestions: SuggestionProps[];
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
  | ErrorEvent;

export interface StreamResponseOptions {
  onOpen?: () => void;
  onChunk: (chunk: AgentEvent) => void;
  onFunctionResponse: (functionResponse: FunctionResponseEvent) => void;
  onThreadTitle: (threadTitle: ThreadTitleEvent) => void;
  onSources: (sources: SourcesEvent) => void;
  onSuggestions: (suggestions: SuggestionsEvent) => void;
  onComplete: (complete: AgentEvent) => void;
  onError: (error: ErrorEvent) => void;
}

export class ApiService {
  private config: Required<ApiConfig>;
  private eventSource: EventSource | null = null;

  constructor(config: ApiConfig) {
    this.config = { baseUrl: config.baseUrl };
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
      onError,
      onComplete,
    } = options;

    try {
      console.log("[Ajora]: Sending request to API with:", query);

      this.eventSource = new EventSource(`${this.config.baseUrl}/api/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
        pollingInterval: 0,
      });

      this.eventSource.addEventListener("open", () => {
        console.info("[Ajora]: SSE connection opened");
        onOpen?.();
      });

      this.eventSource.addEventListener("message", (event) => {
        console.log(event.data);
        try {
          if (!event.data) throw new Error("Empty SSE event data");

          const agentEvent: AgentEvent = JSON.parse(event.data);

          switch (agentEvent.type) {
            case "thread_title":
              return onThreadTitle(agentEvent as ThreadTitleEvent);
            case "sources":
              return onSources(agentEvent as SourcesEvent);
            case "suggestions":
              return onSuggestions(agentEvent as SuggestionsEvent);
            case "function_response":
              console.log("Function Response received:", agentEvent);
              return onFunctionResponse(agentEvent as FunctionResponseEvent);
            case "error":
              this.close();
              return onError(agentEvent as ErrorEvent);
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
    return fetch(`${this.config.baseUrl}/api/threads`).then((res) =>
      res.json()
    );
  }

  createThread(title?: string): Promise<Thread> {
    return fetch(`${this.config.baseUrl}/api/threads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
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
    return fetch(
      `${this.config.baseUrl}/api/threads/${threadId}/messages`
    ).then((res) => res.json());
  }

  updateConfig(newConfig: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): Required<ApiConfig> {
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
