import EventSource from "react-native-sse";
import { IMessage } from "./types";
import { SourceProps } from "./source/types";
import { SuggestionProps } from "./suggestion/types";

export interface ApiConfig {
  baseUrl: string;
}

export interface StreamResponseOptions {
  onChunk: (message: IMessage) => void;
  onComplete: (message: IMessage) => void;
  onThreadTitle: (title: string) => void;
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
    options: StreamResponseOptions
  ): () => void {
    const {
      onChunk,
      onComplete,
      onError,
      onOpen,
      onThreadTitle,
      onSources,
      onSuggestions,
    } = options;

    try {
      this.eventSource = new EventSource(`${this.config.baseUrl}/api/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
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

  /**
   * Get a single response from the API
   */
  async getResponse(message: IMessage): Promise<ChatResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        // ✅ send message as an array
        const response = await fetch(`${this.config.baseUrl}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: [message] }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // ✅ extract text from parts[0].text
        const parsedResponse: IMessage = {
          ...data,
          text: data.parts?.[0]?.text ?? "",
        };

        return {
          response: parsedResponse,
          success: true,
        };
      } catch (error) {
        lastError = error as Error;
        console.error(`[Ajora]: Attempt ${attempt} failed:`, error);

        if (attempt < 3) {
          await this.delay(1000);
        }
      }
    }

    return {
      response: {} as IMessage,
      success: false,
      error: lastError?.message || "Unknown error occurred",
    };
  }

  private close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
export const getResponse =
  defaultApiService.getResponse.bind(defaultApiService);

export default ApiService;
