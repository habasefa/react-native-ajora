import {
  AbstractAgent,
  AgentSubscriber,
  HttpAgent,
  Message,
  RunAgentResult,
  Tool,
} from "@ag-ui/client";
import { randomUUID, logger } from "../../shared";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  AjoraCoreErrorCode,
  type AjoraCoreFriendsAccess,
} from "./core-types";
import { FrontendTool } from "../types";
import {
  ProxiedAjoraRuntimeAgent,
  FetchHistoryError,
  type FetchHistoryResponse,
} from "../agent";

export interface AjoraCoreRunAgentParams {
  agent: AbstractAgent;
  /** Optional model ID to forward to the runtime as `model` in forwardedProps */
  modelId?: string;
}

export interface AjoraCoreConnectAgentParams {
  agent: AbstractAgent;
  /** Optional model ID to forward to the runtime as `model` in forwardedProps */
  modelId?: string;
}

export interface AjoraCoreLoadHistoryParams {
  agent: AbstractAgent;
  threadId: string;
  /** Cursor: return messages that appear BEFORE this message id (load earlier). */
  beforeMessageId?: string;
  /** Page size (default 50, server clamps to [1, 200]). */
  limit?: number;
  /** Optional signal to abort the request (e.g. on thread switch). */
  signal?: AbortSignal;
}

export interface AjoraCoreGetToolParams {
  toolName: string;
  agentId?: string;
}

/**
 * Handles agent execution, tool calling, and agent connectivity for AjoraCore.
 * Manages the complete lifecycle of agent runs including tool execution and follow-ups.
 */
export class RunHandler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _tools: FrontendTool<any>[] = [];

  constructor(private core: AjoraCoreFriendsAccess) {}

  /**
   * Get all tools as a readonly array
   */
  get tools(): Readonly<FrontendTool<any>[]> {
    return this._tools;
  }

  /**
   * Initialize with tools
   */
  initialize(tools: FrontendTool<any>[]): void {
    this._tools = tools;
  }

  /**
   * Add a tool to the registry
   */
  addTool<T extends Record<string, unknown> = Record<string, unknown>>(
    tool: FrontendTool<T>,
  ): void {
    // Check if a tool with the same name and agentId already exists
    const existingToolIndex = this._tools.findIndex(
      (t) => t.name === tool.name && t.agentId === tool.agentId,
    );

    if (existingToolIndex !== -1) {
      logger.warn(
        `Tool already exists: '${tool.name}' for agent '${tool.agentId || "global"}', skipping.`,
      );
      return;
    }

    this._tools.push(tool);
  }

  /**
   * Remove a tool by name and optionally by agentId
   */
  removeTool(id: string, agentId?: string): void {
    this._tools = this._tools.filter((tool) => {
      // Remove tool if both name and agentId match
      if (agentId !== undefined) {
        return !(tool.name === id && tool.agentId === agentId);
      }
      // If no agentId specified, only remove global tools with matching name
      return !(tool.name === id && !tool.agentId);
    });
  }

  /**
   * Get a tool by name and optionally by agentId.
   * If agentId is provided, it will first look for an agent-specific tool,
   * then fall back to a global tool with the same name.
   */
  getTool(params: AjoraCoreGetToolParams): FrontendTool<any> | undefined {
    const { toolName, agentId } = params;

    // If agentId is provided, first look for agent-specific tool
    if (agentId) {
      const agentTool = this._tools.find(
        (tool) => tool.name === toolName && tool.agentId === agentId,
      );
      if (agentTool) {
        return agentTool;
      }
    }

    // Fall back to global tool (no agentId)
    return this._tools.find((tool) => tool.name === toolName && !tool.agentId);
  }

  /**
   * Set all tools at once. Replaces existing tools.
   */
  setTools(tools: FrontendTool<any>[]): void {
    this._tools = [...tools];
  }

  /**
   * Connect an agent (establish initial connection)
   */
  async connectAgent({
    agent,
    modelId,
  }: AjoraCoreConnectAgentParams): Promise<RunAgentResult> {
    try {
      await agent.detachActiveRun();
      agent.setState({});

      if (agent instanceof HttpAgent) {
        agent.headers = {
          ...this.core.headers,
        };
      }

      const runAgentResult = await agent.connectAgent(
        {
          forwardedProps: {
            ...this.core.properties,
            ...(modelId ? { model: modelId } : {}),
          },
          tools: this.buildFrontendTools(agent.agentId),
        },
        this.createAgentErrorSubscriber(agent),
      );

      return this.processAgentResult({ runAgentResult, agent });
    } catch (error) {
      const connectError =
        error instanceof Error ? error : new Error(String(error));
      const context: Record<string, any> = {};
      if (agent.agentId) {
        context.agentId = agent.agentId;
      }
      await this.core.emitError({
        error: connectError,
        code: AjoraCoreErrorCode.AGENT_CONNECT_FAILED,
        context,
      });
      throw error;
    }
  }

  /**
   * Load persisted history for a thread and merge it into the agent's
   * in-memory `messages` array.
   *
   * - When `beforeMessageId` is omitted (initial load): replaces the agent's
   *   messages with the fetched page. Existing messages are discarded.
   * - When `beforeMessageId` is provided (load earlier): prepends the fetched
   *   page to the existing messages, deduplicating by id so a stale cursor
   *   never produces duplicates.
   *
   * Returns the raw `FetchHistoryResponse` so the caller can drive pagination
   * UI (`hasMore`, `oldestMessageId`).
   */
  async loadHistory({
    agent,
    threadId,
    beforeMessageId,
    limit,
    signal,
  }: AjoraCoreLoadHistoryParams): Promise<FetchHistoryResponse> {
    if (!(agent instanceof ProxiedAjoraRuntimeAgent)) {
      // Dev-only / non-proxied agents have no persistent backing store.
      return { messages: [], hasMore: false, oldestMessageId: null };
    }

    if (agent instanceof HttpAgent) {
      agent.headers = {
        ...this.core.headers,
      };
    }

    try {
      const response = await agent.fetchHistory({
        threadId,
        beforeMessageId,
        limit,
        signal,
      });

      if (beforeMessageId === undefined) {
        // Initial load: merge server history with any messages the agent
        // already has (e.g., from a connect() that finished first or a
        // user-typed message). Server messages come first (they're older),
        // then any local-only messages that aren't in the server response.
        if (response.messages.length > 0) {
          const existing = agent.messages ?? [];
          const serverIds = new Set(response.messages.map((m) => m.id));
          const localOnly = existing.filter((m) => !serverIds.has(m.id));
          agent.setMessages([...response.messages, ...localOnly]);
        }
      } else if (response.messages.length > 0) {
        // Load earlier: prepend, deduping by id.
        const existing = agent.messages ?? [];
        const seen = new Set(existing.map((m) => m.id));
        const prepended: Message[] = [];
        for (const m of response.messages) {
          if (!seen.has(m.id)) {
            prepended.push(m);
            seen.add(m.id);
          }
        }
        agent.setMessages([...prepended, ...existing]);
      }

      return response;
    } catch (error) {
      const loadError =
        error instanceof Error ? error : new Error(String(error));
      const errorCode =
        error instanceof FetchHistoryError
          ? error.code
          : AjoraCoreErrorCode.HISTORY_LOAD_FAILED;
      const context: Record<string, any> = { threadId };
      if (agent.agentId) {
        context.agentId = agent.agentId;
      }
      if (error instanceof FetchHistoryError) {
        context.status = error.status;
        if (error.retryAfterMs != null) {
          context.retryAfterMs = error.retryAfterMs;
        }
      }
      await this.core.emitError({
        error: loadError,
        code: errorCode,
        context,
      });
      throw error;
    }
  }

  /**
   * Run an agent
   */
  async runAgent({
    agent,
    modelId,
    executedToolCallIds,
  }: AjoraCoreRunAgentParams & {
    executedToolCallIds?: Set<string>;
  }): Promise<RunAgentResult> {
    // Agent ID is guaranteed to be set by validateAndAssignAgentId
    if (agent.agentId) {
      void this.core.suggestionEngine.clearSuggestions(agent.agentId);
    }

    if (agent instanceof HttpAgent) {
      agent.headers = {
        ...this.core.headers,
      };
    }

    try {
      const runAgentResult = await agent.runAgent(
        {
          forwardedProps: {
            ...this.core.properties,
            ...(modelId ? { model: modelId } : {}),
          },
          tools: this.buildFrontendTools(agent.agentId),
          context: Object.values(this.core.context),
        },
        this.createAgentErrorSubscriber(agent),
      );
      return this.processAgentResult({
        runAgentResult,
        agent,
        executedToolCallIds,
      });
    } catch (error) {
      const runError =
        error instanceof Error ? error : new Error(String(error));
      const context: Record<string, any> = {};
      if (agent.agentId) {
        context.agentId = agent.agentId;
      }
      await this.core.emitError({
        error: runError,
        code: AjoraCoreErrorCode.AGENT_RUN_FAILED,
        context,
      });
      throw error;
    }
  }

  /**
   * Process agent result and execute tools.
   *
   * `executedToolCallIds` tracks tool call IDs that have already been executed
   * across the entire run chain (including follow-up runs). This prevents
   * duplicate execution if the server sends the same TOOL_CALL_START event
   * twice (e.g. retry/resend after a network hiccup).
   */
  private async processAgentResult({
    runAgentResult,
    agent,
    executedToolCallIds = new Set<string>(),
  }: {
    runAgentResult: RunAgentResult;
    agent: AbstractAgent;
    executedToolCallIds?: Set<string>;
  }): Promise<RunAgentResult> {
    const { newMessages } = runAgentResult;
    // Agent ID is guaranteed to be set by validateAndAssignAgentId
    const agentId = agent.agentId!;

    let needsFollowUp = false;

    for (const message of newMessages) {
      if (message.role === "assistant") {
        for (const toolCall of message.toolCalls || []) {
          // Skip if already executed in this run chain or if a response
          // already exists in the current batch.
          if (executedToolCallIds.has(toolCall.id)) continue;
          if (
            newMessages.findIndex(
              (m) => m.role === "tool" && m.toolCallId === toolCall.id,
            ) !== -1
          ) {
            continue;
          }

          executedToolCallIds.add(toolCall.id);

          const tool = this.getTool({
            toolName: toolCall.function.name,
            agentId: agent.agentId,
          });
          if (tool) {
            const followUp = await this.executeSpecificTool(
              tool,
              toolCall,
              message,
              agent,
              agentId,
            );
            if (followUp) {
              needsFollowUp = true;
            }
          } else {
            // Wildcard fallback for undefined tools
            const wildcardTool = this.getTool({
              toolName: "*",
              agentId: agent.agentId,
            });
            if (wildcardTool) {
              const followUp = await this.executeWildcardTool(
                wildcardTool,
                toolCall,
                message,
                agent,
                agentId,
              );
              if (followUp) {
                needsFollowUp = true;
              }
            }
          }
        }
      }
    }

    if (needsFollowUp) {
      return await this.runAgent({ agent, executedToolCallIds });
    }

    void this.core.suggestionEngine.reloadSuggestions(agentId);

    return runAgentResult;
  }

  /**
   * Execute a specific tool
   */
  private async executeSpecificTool(
    tool: FrontendTool<any>,
    toolCall: any,
    message: Message,
    agent: AbstractAgent,
    agentId: string,
  ): Promise<boolean> {
    // Check if tool is constrained to a specific agent
    if (tool?.agentId && tool.agentId !== agent.agentId) {
      // Tool is not available for this agent, skip it
      return false;
    }

    let toolCallResult = "";
    let errorMessage: string | undefined;
    let isArgumentError = false;

    if (tool?.handler) {
      let parsedArgs: unknown;
      try {
        parsedArgs = JSON.parse(toolCall.function.arguments);
      } catch (error) {
        const parseError =
          error instanceof Error ? error : new Error(String(error));
        errorMessage = parseError.message;
        isArgumentError = true;
        await this.core.emitError({
          error: parseError,
          code: AjoraCoreErrorCode.TOOL_ARGUMENT_PARSE_FAILED,
          context: {
            agentId: agentId,
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            rawArguments: toolCall.function.arguments,
            toolType: "specific",
            messageId: message.id,
          },
        });
      }

      await this.core.notifySubscribers(
        (subscriber) =>
          subscriber.onToolExecutionStart?.({
            ajora: this.core,
            toolCallId: toolCall.id,
            agentId: agentId,
            toolName: toolCall.function.name,
            args: parsedArgs,
          }),
        "Subscriber onToolExecutionStart error:",
      );

      if (!errorMessage) {
        try {
          const result = await tool.handler(parsedArgs as any, toolCall);
          if (result === undefined || result === null) {
            toolCallResult = "";
          } else if (typeof result === "string") {
            toolCallResult = result;
          } else {
            toolCallResult = JSON.stringify(result);
          }
        } catch (error) {
          const handlerError =
            error instanceof Error ? error : new Error(String(error));
          errorMessage = handlerError.message;
          await this.core.emitError({
            error: handlerError,
            code: AjoraCoreErrorCode.TOOL_HANDLER_FAILED,
            context: {
              agentId: agentId,
              toolCallId: toolCall.id,
              toolName: toolCall.function.name,
              parsedArgs,
              toolType: "specific",
              messageId: message.id,
            },
          });
        }
      }

      if (errorMessage) {
        toolCallResult = `Error: ${errorMessage}`;
      }

      await this.core.notifySubscribers(
        (subscriber) =>
          subscriber.onToolExecutionEnd?.({
            ajora: this.core,
            toolCallId: toolCall.id,
            agentId: agentId,
            toolName: toolCall.function.name,
            result: errorMessage ? "" : toolCallResult,
            error: errorMessage,
          }),
        "Subscriber onToolExecutionEnd error:",
      );

      if (isArgumentError) {
        throw new Error(errorMessage ?? "Tool execution failed");
      }
    }

    if (!errorMessage || !isArgumentError) {
      const messageIndex = agent.messages.findIndex((m) => m.id === message.id);
      if (messageIndex === -1) {
        return false;
      }
      const toolMessage = {
        id: randomUUID(),
        role: "tool" as const,
        toolCallId: toolCall.id,
        content: toolCallResult,
      };
      const msgs = agent.messages;
      agent.setMessages([
        ...msgs.slice(0, messageIndex + 1),
        toolMessage,
        ...msgs.slice(messageIndex + 1),
      ]);

      if (!errorMessage && tool?.followUp !== false) {
        return true; // Needs follow-up
      }
    }

    return false;
  }

  /**
   * Execute a wildcard tool
   */
  private async executeWildcardTool(
    wildcardTool: FrontendTool<any>,
    toolCall: any,
    message: Message,
    agent: AbstractAgent,
    agentId: string,
  ): Promise<boolean> {
    // Check if wildcard tool is constrained to a specific agent
    if (wildcardTool?.agentId && wildcardTool.agentId !== agent.agentId) {
      // Wildcard tool is not available for this agent, skip it
      return false;
    }

    let toolCallResult = "";
    let errorMessage: string | undefined;
    let isArgumentError = false;

    if (wildcardTool?.handler) {
      let parsedArgs: unknown;
      try {
        parsedArgs = JSON.parse(toolCall.function.arguments);
      } catch (error) {
        const parseError =
          error instanceof Error ? error : new Error(String(error));
        errorMessage = parseError.message;
        isArgumentError = true;
        await this.core.emitError({
          error: parseError,
          code: AjoraCoreErrorCode.TOOL_ARGUMENT_PARSE_FAILED,
          context: {
            agentId: agentId,
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            rawArguments: toolCall.function.arguments,
            toolType: "wildcard",
            messageId: message.id,
          },
        });
      }

      const wildcardArgs = {
        toolName: toolCall.function.name,
        args: parsedArgs,
      };

      await this.core.notifySubscribers(
        (subscriber) =>
          subscriber.onToolExecutionStart?.({
            ajora: this.core,
            toolCallId: toolCall.id,
            agentId: agentId,
            toolName: toolCall.function.name,
            args: wildcardArgs,
          }),
        "Subscriber onToolExecutionStart error:",
      );

      if (!errorMessage) {
        try {
          const result = await wildcardTool.handler(
            wildcardArgs as any,
            toolCall,
          );
          if (result === undefined || result === null) {
            toolCallResult = "";
          } else if (typeof result === "string") {
            toolCallResult = result;
          } else {
            toolCallResult = JSON.stringify(result);
          }
        } catch (error) {
          const handlerError =
            error instanceof Error ? error : new Error(String(error));
          errorMessage = handlerError.message;
          await this.core.emitError({
            error: handlerError,
            code: AjoraCoreErrorCode.TOOL_HANDLER_FAILED,
            context: {
              agentId: agentId,
              toolCallId: toolCall.id,
              toolName: toolCall.function.name,
              parsedArgs: wildcardArgs,
              toolType: "wildcard",
              messageId: message.id,
            },
          });
        }
      }

      if (errorMessage) {
        toolCallResult = `Error: ${errorMessage}`;
      }

      await this.core.notifySubscribers(
        (subscriber) =>
          subscriber.onToolExecutionEnd?.({
            ajora: this.core,
            toolCallId: toolCall.id,
            agentId: agentId,
            toolName: toolCall.function.name,
            result: errorMessage ? "" : toolCallResult,
            error: errorMessage,
          }),
        "Subscriber onToolExecutionEnd error:",
      );

      if (isArgumentError) {
        throw new Error(errorMessage ?? "Tool execution failed");
      }
    }

    if (!errorMessage || !isArgumentError) {
      const messageIndex = agent.messages.findIndex((m) => m.id === message.id);
      if (messageIndex === -1) {
        return false;
      }
      const toolMessage = {
        id: randomUUID(),
        role: "tool" as const,
        toolCallId: toolCall.id,
        content: toolCallResult,
      };
      const msgs = agent.messages;
      agent.setMessages([
        ...msgs.slice(0, messageIndex + 1),
        toolMessage,
        ...msgs.slice(messageIndex + 1),
      ]);

      if (!errorMessage && wildcardTool?.followUp !== false) {
        return true; // Needs follow-up
      }
    }

    return false;
  }

  /**
   * Build frontend tools for an agent
   */
  buildFrontendTools(agentId?: string): Tool[] {
    return this._tools
      .filter((tool) => !tool.agentId || tool.agentId === agentId)
      .map((tool) => ({
        name: tool.name,
        description: tool.description ?? "",
        parameters: createToolSchema(tool),
      }));
  }

  /**
   * Create an agent error subscriber
   */
  private createAgentErrorSubscriber(agent: AbstractAgent): AgentSubscriber {
    const emitAgentError = async (
      error: Error,
      code: AjoraCoreErrorCode,
      extraContext: Record<string, any> = {},
    ) => {
      const context: Record<string, any> = { ...extraContext };
      if (agent.agentId) {
        context.agentId = agent.agentId;
      }
      await this.core.emitError({
        error,
        code,
        context,
      });
    };

    return {
      onRunFailed: async ({ error }: { error: Error }) => {
        await emitAgentError(error, AjoraCoreErrorCode.AGENT_RUN_FAILED_EVENT, {
          source: "onRunFailed",
        });
      },
      onRunErrorEvent: async ({ event }) => {
        const eventError =
          event?.rawEvent instanceof Error
            ? event.rawEvent
            : event?.rawEvent?.error instanceof Error
              ? event.rawEvent.error
              : undefined;

        const errorMessage =
          typeof event?.rawEvent?.error === "string"
            ? event.rawEvent.error
            : (event?.message ?? "Agent run error");

        const rawError = eventError ?? new Error(errorMessage);

        if (event?.code && !(rawError as any).code) {
          (rawError as any).code = event.code;
        }

        await emitAgentError(
          rawError,
          AjoraCoreErrorCode.AGENT_RUN_ERROR_EVENT,
          {
            source: "onRunErrorEvent",
            event,
            runtimeErrorCode: event?.code,
          },
        );
      },
    };
  }
}

/**
 * Empty tool schema constant
 */
const EMPTY_TOOL_SCHEMA = {
  type: "object",
  properties: {},
} as const satisfies Record<string, unknown>;

/**
 * Create a JSON schema from a tool's parameters
 */
function createToolSchema(tool: FrontendTool<any>): Record<string, unknown> {
  if (!tool.parameters) {
    return { ...EMPTY_TOOL_SCHEMA };
  }

  const rawSchema = zodToJsonSchema(tool.parameters, {
    $refStrategy: "none",
  });

  if (!rawSchema || typeof rawSchema !== "object") {
    return { ...EMPTY_TOOL_SCHEMA };
  }

  const { $schema, ...schema } = rawSchema as Record<string, unknown>;

  if (typeof schema.type !== "string") {
    schema.type = "object";
  }
  if (typeof schema.properties !== "object" || schema.properties === null) {
    schema.properties = {};
  }

  stripAdditionalProperties(schema);
  return schema;
}

function stripAdditionalProperties(schema: unknown): void {
  if (!schema || typeof schema !== "object") {
    return;
  }

  if (Array.isArray(schema)) {
    schema.forEach(stripAdditionalProperties);
    return;
  }

  const record = schema as Record<string, unknown>;

  if (record.additionalProperties !== undefined) {
    delete record.additionalProperties;
  }

  for (const value of Object.values(record)) {
    stripAdditionalProperties(value);
  }
}
