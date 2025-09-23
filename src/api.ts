import EventSource from "react-native-sse";
import { IMessage, ThreadItem } from "./types";
import { SourceProps } from "./source/types";
import { SuggestionProps } from "./suggestion/types";

export interface ApiConfig {
  baseUrl: string;
}

export interface StreamResponseOptions {
  onChunk: (message: IMessage) => void;
  onComplete: (message: IMessage) => void;
  onThreadTitle: (title: string) => void;
  onThreadId: (threadId: string) => void;
  onError: (error: Error) => void;
  onSources: (sources: SourceProps[]) => void;
  onSuggestions: (suggestions: SuggestionProps[]) => void;
  onOpen?: () => void;
}

export interface ChatResponse {
  response: IMessage;
  success: boolean;
  error?: string;
}

export class ApiService {
  private config: Required<ApiConfig>;
  private eventSource: EventSource | null = null;

  constructor(config: ApiConfig) {
    this.config = {
      baseUrl: config.baseUrl,
    };
  }

  /**
   * Stream a response from the API using Server-Sent Events
   */
  streamResponse(
    message: IMessage,
    options: StreamResponseOptions,
    threadId?: string
  ): () => void {
    const {
      onChunk,
      onComplete,
      onError,
      onOpen,
      onThreadTitle,
      onThreadId,
      onSources,
      onSuggestions,
    } = options;

    try {
      const requestBody = { message, threadId };
      console.log("[Ajora]: Sending request to API with:", requestBody);

      this.eventSource = new EventSource(`${this.config.baseUrl}/api/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        pollingInterval: 0,
      });

      this.eventSource.addEventListener("open", () => {
        console.info("[Ajora]: SSE connection opened");
        onOpen?.();
      });

      this.eventSource.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data || "{}");

          // console.info("[Ajora]: SSE message received:", data);

          if (data.threadTitle) return onThreadTitle(data.threadTitle);
          if (data.threadId) return onThreadId(data.threadId);
          if (data.sources) return onSources(data.sources);
          if (data.suggestions) return onSuggestions(data.suggestions);

          if (data.error) {
            console.error("[Ajora]: SSE error received:", data.error);
            this.close();
            return onError(new Error(data.error));
          }

          if (data.done) {
            console.info("[Ajora]: SSE stream completed");
            this.close();
            return onComplete(data.data as IMessage);
          }

          onChunk(data);
        } catch (parseError) {
          console.error("[Ajora]: Failed to parse SSE data:", parseError);
          this.close();
          onError(new Error("Failed to parse server response"));
        }
      });

      this.eventSource.addEventListener("error", (event) => {
        console.error("[Ajora]: SSE connection error:", event);
        this.close();
        onError(new Error("SSE connection failed"));
      });

      // Start initial timeout in case server never responds

      return () => {
        this.close();
      };
    } catch (error) {
      console.error("[Ajora]: Error creating SSE connection:", error);
      onError(new Error("Failed to create connection"));
      return () => {};
    }
  }

  // Thread endpoints
  getThreads(): Promise<ThreadItem[]> {
    return fetch(`${this.config.baseUrl}/api/threads`).then((res) =>
      res.json()
    );
  }

  createThread(title: string): Promise<ThreadItem> {
    return fetch(`${this.config.baseUrl}/api/threads`, {
      method: "POST",
      body: JSON.stringify({ title }),
    }).then((res) => res.json());
  }

  private close(): void {
    if (this.eventSource) {
      this.eventSource.close();
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
    this.config = {
      ...this.config,
      ...newConfig,
    };
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
