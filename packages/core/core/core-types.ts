import { AbstractAgent, Context, Tool } from "@ag-ui/client";
import type { SuggestionsConfig, Suggestion } from "../types";

// ============================================================================
// Error Codes
// ============================================================================

export enum AjoraCoreErrorCode {
  RUNTIME_INFO_FETCH_FAILED = "runtime_info_fetch_failed",
  AGENT_CONNECT_FAILED = "agent_connect_failed",
  AGENT_RUN_FAILED = "agent_run_failed",
  AGENT_RUN_FAILED_EVENT = "agent_run_failed_event",
  AGENT_RUN_ERROR_EVENT = "agent_run_error_event",
  TOOL_ARGUMENT_PARSE_FAILED = "tool_argument_parse_failed",
  TOOL_HANDLER_FAILED = "tool_handler_failed",
}

// ============================================================================
// Runtime Connection Status
// ============================================================================

export enum AjoraCoreRuntimeConnectionStatus {
  Disconnected = "disconnected",
  Connected = "connected",
  Connecting = "connecting",
  Error = "error",
}

// ============================================================================
// Subscriber Types
// ============================================================================

// Forward reference type for AjoraCore to avoid circular imports
// The actual AjoraCore class implements this interface
export interface AjoraCoreBase {
  readonly headers: Readonly<Record<string, string>>;
  readonly properties: Readonly<Record<string, unknown>>;
  readonly context: Readonly<Record<string, Context>>;
  readonly agents: Readonly<Record<string, AbstractAgent>>;
  getAgent(id: string): AbstractAgent | undefined;
}

export interface AjoraCoreSubscriber {
  onRuntimeConnectionStatusChanged?: (event: {
    ajora: AjoraCoreBase;
    status: AjoraCoreRuntimeConnectionStatus;
  }) => void | Promise<void>;
  onToolExecutionStart?: (event: {
    ajora: AjoraCoreBase;
    toolCallId: string;
    agentId: string;
    toolName: string;
    args: unknown;
  }) => void | Promise<void>;
  onToolExecutionEnd?: (event: {
    ajora: AjoraCoreBase;
    toolCallId: string;
    agentId: string;
    toolName: string;
    result: string;
    error?: string;
  }) => void | Promise<void>;
  onAgentsChanged?: (event: {
    ajora: AjoraCoreBase;
    agents: Readonly<Record<string, AbstractAgent>>;
  }) => void | Promise<void>;
  onContextChanged?: (event: {
    ajora: AjoraCoreBase;
    context: Readonly<Record<string, Context>>;
  }) => void | Promise<void>;
  onSuggestionsConfigChanged?: (event: {
    ajora: AjoraCoreBase;
    suggestionsConfig: Readonly<Record<string, SuggestionsConfig>>;
  }) => void | Promise<void>;
  onSuggestionsChanged?: (event: {
    ajora: AjoraCoreBase;
    agentId: string;
    suggestions: Suggestion[];
  }) => void | Promise<void>;
  onSuggestionsStartedLoading?: (event: {
    ajora: AjoraCoreBase;
    agentId: string;
  }) => void | Promise<void>;
  onSuggestionsFinishedLoading?: (event: {
    ajora: AjoraCoreBase;
    agentId: string;
  }) => void | Promise<void>;
  onPropertiesChanged?: (event: {
    ajora: AjoraCoreBase;
    properties: Readonly<Record<string, unknown>>;
  }) => void | Promise<void>;
  onHeadersChanged?: (event: {
    ajora: AjoraCoreBase;
    headers: Readonly<Record<string, string>>;
  }) => void | Promise<void>;
  onError?: (event: {
    ajora: AjoraCoreBase;
    error: Error;
    code: AjoraCoreErrorCode;
    context: Record<string, any>;
  }) => void | Promise<void>;
}

// Subscription object returned by subscribe()
export interface AjoraCoreSubscription {
  unsubscribe: () => void;
}

// ============================================================================
// Friends Access Interface
// ============================================================================

/**
 * Internal interface for delegate classes to access AjoraCore methods.
 * This provides type safety while allowing controlled access to private functionality.
 */
export interface AjoraCoreFriendsAccess extends AjoraCoreBase {
  // Notification methods
  notifySubscribers(
    handler: (subscriber: AjoraCoreSubscriber) => void | Promise<void>,
    errorMessage: string
  ): Promise<void>;

  emitError(params: {
    error: Error;
    code: AjoraCoreErrorCode;
    context?: Record<string, any>;
  }): Promise<void>;

  // Internal methods
  buildFrontendTools(agentId?: string): Tool[];

  // References to delegate subsystems
  readonly suggestionEngine: {
    clearSuggestions(agentId: string): void;
    reloadSuggestions(agentId: string): void;
  };
}
