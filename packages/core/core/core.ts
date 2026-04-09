import { AbstractAgent, Context, State } from "@ag-ui/client";
import type { RuntimeModelInfo } from "../../shared";
import {
  FrontendTool,
  SuggestionsConfig,
  Suggestion,
  AjoraRuntimeTransport,
} from "../types";
import { AgentRegistry, AjoraCoreAddAgentParams } from "./agent-registry";
import { ContextStore } from "./context-store";
import {
  SuggestionEngine,
  AjoraCoreGetSuggestionsResult,
} from "./suggestion-engine";

// Re-export suggestion result type
export type { AjoraCoreGetSuggestionsResult };
import {
  RunHandler,
  AjoraCoreRunAgentParams,
  AjoraCoreConnectAgentParams,
  AjoraCoreLoadHistoryParams,
  AjoraCoreGetToolParams,
} from "./run-handler";
import type { FetchHistoryResponse } from "../agent";
import { StateManager } from "./state-manager";
import {
  AjoraCoreErrorCode,
  AjoraCoreRuntimeConnectionStatus,
  AjoraCoreFriendsAccess,
  AjoraCoreSubscriber,
  AjoraCoreSubscription,
} from "./core-types";

// Re-export types from core-types for backwards compatibility
export {
  AjoraCoreErrorCode,
  AjoraCoreRuntimeConnectionStatus,
  AjoraCoreFriendsAccess,
  AjoraCoreSubscriber,
  AjoraCoreSubscription,
} from "./core-types";

/**
 * Shallow equality check used to short-circuit `setHeaders` / `setProperties`
 * when React callers pass freshly-constructed objects on every render. Without
 * this guard, every parent render would cascade into an
 * `onHeadersChanged`/`onPropertiesChanged` notification → `useAjora`
 * forceUpdate → `useAgent` memo recompute → connect effect re-fire, which is
 * one of the root causes of the connect/run storm in AjoraChat.
 */
function shallowEqual(
  a: Record<string, unknown> | null | undefined,
  b: Record<string, unknown> | null | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

/** Configuration options for `AjoraCore`. */
export interface AjoraCoreConfig {
  /** The endpoint of the AjoraRuntime. */
  runtimeUrl?: string;
  /** Transport style for AjoraRuntime endpoints. Defaults to REST. */
  runtimeTransport?: AjoraRuntimeTransport;
  /** Mapping from agent name to its `AbstractAgent` instance. For development only - production requires AjoraRuntime. */
  agents__unsafe_dev_only?: Record<string, AbstractAgent>;
  /** Headers appended to every HTTP request made by `AjoraCore`. */
  headers?: Record<string, string>;
  /** Properties sent as `forwardedProps` to the AG-UI agent. */
  properties?: Record<string, unknown>;
  /** Ordered collection of frontend tools available to the core. */
  tools?: FrontendTool<any>[];
  /** Suggestions config for the core. */
  suggestionsConfig?: SuggestionsConfig[];
}

export type { AjoraCoreAddAgentParams };
export type {
  AjoraCoreRunAgentParams,
  AjoraCoreConnectAgentParams,
  AjoraCoreLoadHistoryParams,
  AjoraCoreGetToolParams,
};
export type { FetchHistoryResponse } from "../agent";

export interface AjoraCoreStopAgentParams {
  agent: AbstractAgent;
}

export class AjoraCore {
  private _headers: Record<string, string>;
  private _properties: Record<string, unknown>;

  private subscribers: Set<AjoraCoreSubscriber> = new Set();

  /** Cleanup handle for the internal onAgentsChanged subscription. */
  private _agentsChangedSubscription: AjoraCoreSubscription | undefined;

  // Delegate classes
  private agentRegistry: AgentRegistry;
  private contextStore: ContextStore;
  /** @internal — accessed by delegate classes via `AjoraCoreFriendsAccess`. */
  public readonly suggestionEngine: SuggestionEngine;
  private runHandler: RunHandler;
  private stateManager: StateManager;

  constructor({
    runtimeUrl,
    runtimeTransport = "rest",
    headers = {},
    properties = {},
    agents__unsafe_dev_only = {},
    tools = [],
    suggestionsConfig = [],
  }: AjoraCoreConfig) {
    console.log("[ajora:debug] AjoraCore constructor", {
      runtimeUrl,
      runtimeTransport,
      headerKeys: Object.keys(headers),
      propertyKeys: Object.keys(properties),
      localAgentIds: Object.keys(agents__unsafe_dev_only),
      toolCount: tools.length,
      suggestionsConfigCount: suggestionsConfig.length,
    });
    this._headers = headers;
    this._properties = properties;

    // Initialize delegate classes
    this.agentRegistry = new AgentRegistry(this);
    this.contextStore = new ContextStore(this);
    this.suggestionEngine = new SuggestionEngine(this);
    this.runHandler = new RunHandler(this);
    this.stateManager = new StateManager(this);

    // Initialize each subsystem
    this.agentRegistry.initialize(agents__unsafe_dev_only);
    this.runHandler.initialize(tools);
    this.suggestionEngine.initialize(suggestionsConfig);
    this.stateManager.initialize();

    // Subscribe to agent changes BEFORE kicking off the initial runtime
    // connection so the state manager picks up agents from the very first
    // notification (otherwise the first batch of remote agents arrives before
    // anyone is listening and never gets registered with the state manager).
    this._agentsChangedSubscription = this.subscribe({
      onAgentsChanged: ({ agents }) => {
        Object.values(agents).forEach((agent) => {
          if (agent.agentId) {
            this.stateManager.subscribeToAgent(agent);
          }
        });
      },
    });

    // Order matters: stash the transport first so the very first
    // `updateRuntimeConnection` (kicked off by `setRuntimeUrl`) reads the
    // correct transport. We pass `{ skipUpdate: true }` so setting the
    // transport does not itself fire a connection attempt while
    // `runtimeUrl` is still undefined — that would race with the real fetch
    // from `setRuntimeUrl`, leaving two concurrent updateRuntimeConnection
    // promises mutating the same state.
    this.agentRegistry.setRuntimeTransport(runtimeTransport, {
      skipUpdate: true,
    });
    this.agentRegistry.setRuntimeUrl(runtimeUrl);
  }

  /**
   * Tear down internal subscriptions. Call this when the AjoraCore instance
   * is no longer needed (e.g. on provider unmount) to avoid memory leaks.
   */
  dispose(): void {
    this._agentsChangedSubscription?.unsubscribe();
    this._agentsChangedSubscription = undefined;
  }

  /**
   * @internal — used by delegate classes to notify subscribers.
   */
  public async notifySubscribers(
    handler: (subscriber: AjoraCoreSubscriber) => void | Promise<void>,
    errorMessage: string,
  ): Promise<void> {
    await Promise.all(
      Array.from(this.subscribers).map(async (subscriber) => {
        try {
          await handler(subscriber);
        } catch (error) {
          console.error(errorMessage, error);
        }
      }),
    );
  }

  /**
   * @internal — used by delegate classes to emit errors.
   */
  public async emitError({
    error,
    code,
    context = {},
  }: {
    error: Error;
    code: AjoraCoreErrorCode;
    context?: Record<string, any>;
  }): Promise<void> {
    await this.notifySubscribers(
      (subscriber) =>
        subscriber.onError?.({
          ajora: this,
          error,
          code,
          context,
        }),
      "Subscriber onError error:",
    );
  }

  /**
   * Snapshot accessors
   */
  get context(): Readonly<Record<string, Context>> {
    return this.contextStore.context;
  }

  get agents(): Readonly<Record<string, AbstractAgent>> {
    return this.agentRegistry.agents;
  }

  get tools(): Readonly<FrontendTool<any>[]> {
    return this.runHandler.tools;
  }

  get runtimeUrl(): string | undefined {
    return this.agentRegistry.runtimeUrl;
  }

  setRuntimeUrl(runtimeUrl: string | undefined): void {
    this.agentRegistry.setRuntimeUrl(runtimeUrl);
  }

  get runtimeTransport(): AjoraRuntimeTransport {
    return this.agentRegistry.runtimeTransport;
  }

  setRuntimeTransport(runtimeTransport: AjoraRuntimeTransport): void {
    this.agentRegistry.setRuntimeTransport(runtimeTransport);
  }

  get runtimeVersion(): string | undefined {
    return this.agentRegistry.runtimeVersion;
  }

  get headers(): Readonly<Record<string, string>> {
    return this._headers;
  }

  get properties(): Readonly<Record<string, unknown>> {
    return this._properties;
  }

  get runtimeConnectionStatus(): AjoraCoreRuntimeConnectionStatus {
    return this.agentRegistry.runtimeConnectionStatus;
  }

  get models(): Readonly<RuntimeModelInfo[]> {
    return this.agentRegistry.models;
  }

  get extraData(): Readonly<Record<string, unknown>> {
    return this.agentRegistry.extraData;
  }

  /**
   * Configuration updates
   *
   * Both `setHeaders` and `setProperties` short-circuit on shallow equality.
   * React callers typically pass freshly-constructed objects on every render
   * (e.g. `{ Authorization: ... }`), and the consumer expects the subscribers
   * to only fire on semantic changes — not on reference-only updates. Without
   * the shallow check, every render would cascade into
   * `onHeadersChanged`/`onPropertiesChanged` → `useAjora` forceUpdate →
   * `useAgent` memo recompute → AjoraChat connect effect re-fire.
   */
  setHeaders(headers: Record<string, string>): void {
    if (shallowEqual(this._headers, headers)) {
      return;
    }
    this._headers = headers;
    this.agentRegistry.applyHeadersToAgents(
      this.agentRegistry.agents as Record<string, AbstractAgent>,
    );
    void this.notifySubscribers(
      (subscriber) =>
        subscriber.onHeadersChanged?.({
          ajora: this,
          headers: this.headers,
        }),
      "Subscriber onHeadersChanged error:",
    );
  }

  setProperties(properties: Record<string, unknown>): void {
    if (shallowEqual(this._properties, properties)) {
      return;
    }
    this._properties = properties;
    void this.notifySubscribers(
      (subscriber) =>
        subscriber.onPropertiesChanged?.({
          ajora: this,
          properties: this.properties,
        }),
      "Subscriber onPropertiesChanged error:",
    );
  }

  /**
   * Agent management (delegated to AgentRegistry)
   */
  setAgents__unsafe_dev_only(agents: Record<string, AbstractAgent>): void {
    this.agentRegistry.setAgents__unsafe_dev_only(agents);
  }

  addAgent__unsafe_dev_only(params: AjoraCoreAddAgentParams): void {
    this.agentRegistry.addAgent__unsafe_dev_only(params);
  }

  removeAgent__unsafe_dev_only(id: string): void {
    this.agentRegistry.removeAgent__unsafe_dev_only(id);
  }

  getAgent(id: string): AbstractAgent | undefined {
    return this.agentRegistry.getAgent(id);
  }

  /**
   * Context management (delegated to ContextStore)
   */
  addContext(context: Context): string {
    return this.contextStore.addContext(context);
  }

  removeContext(id: string): void {
    this.contextStore.removeContext(id);
  }

  /**
   * Suggestions management (delegated to SuggestionEngine)
   */
  addSuggestionsConfig(config: SuggestionsConfig): string {
    return this.suggestionEngine.addSuggestionsConfig(config);
  }

  removeSuggestionsConfig(id: string): void {
    this.suggestionEngine.removeSuggestionsConfig(id);
  }

  reloadSuggestions(agentId: string): void {
    this.suggestionEngine.reloadSuggestions(agentId);
  }

  clearSuggestions(agentId: string): void {
    this.suggestionEngine.clearSuggestions(agentId);
  }

  getSuggestions(agentId: string): AjoraCoreGetSuggestionsResult {
    return this.suggestionEngine.getSuggestions(agentId);
  }

  /**
   * Tool management (delegated to RunHandler)
   */
  addTool<T extends Record<string, unknown> = Record<string, unknown>>(
    tool: FrontendTool<T>,
  ): void {
    this.runHandler.addTool(tool);
  }

  removeTool(id: string, agentId?: string): void {
    this.runHandler.removeTool(id, agentId);
  }

  getTool(params: AjoraCoreGetToolParams): FrontendTool<any> | undefined {
    return this.runHandler.getTool(params);
  }

  setTools(tools: FrontendTool<any>[]): void {
    this.runHandler.setTools(tools);
  }

  /**
   * Subscription lifecycle
   */
  subscribe(subscriber: AjoraCoreSubscriber): AjoraCoreSubscription {
    this.subscribers.add(subscriber);

    // Return subscription with unsubscribe method
    return {
      unsubscribe: () => {
        this.subscribers.delete(subscriber);
      },
    };
  }

  /**
   * Agent connectivity (delegated to RunHandler)
   */
  async connectAgent(
    params: AjoraCoreConnectAgentParams,
  ): Promise<import("@ag-ui/client").RunAgentResult> {
    return this.runHandler.connectAgent(params);
  }

  stopAgent(params: AjoraCoreStopAgentParams): void {
    params.agent.abortRun();
  }

  async runAgent(
    params: AjoraCoreRunAgentParams,
  ): Promise<import("@ag-ui/client").RunAgentResult> {
    return this.runHandler.runAgent(params);
  }

  /**
   * Load persisted history for a thread and merge it into the agent's
   * in-memory `messages` array. See {@link RunHandler.loadHistory}.
   */
  async loadHistory(
    params: AjoraCoreLoadHistoryParams,
  ): Promise<FetchHistoryResponse> {
    return this.runHandler.loadHistory(params);
  }

  /**
   * State management (delegated to StateManager)
   */
  getStateByRun(
    agentId: string,
    threadId: string,
    runId: string,
  ): State | undefined {
    return this.stateManager.getStateByRun(agentId, threadId, runId);
  }

  getRunIdForMessage(
    agentId: string,
    threadId: string,
    messageId: string,
  ): string | undefined {
    return this.stateManager.getRunIdForMessage(agentId, threadId, messageId);
  }

  getRunIdsForThread(agentId: string, threadId: string): string[] {
    return this.stateManager.getRunIdsForThread(agentId, threadId);
  }

  /**
   * @internal — used by delegate classes to build frontend tools.
   */
  public buildFrontendTools(agentId?: string): import("@ag-ui/client").Tool[] {
    return this.runHandler.buildFrontendTools(agentId);
  }
}
