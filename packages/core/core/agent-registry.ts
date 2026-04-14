import { AbstractAgent, HttpAgent } from "@ag-ui/client";
import {
  logger,
  RuntimeInfo,
  RuntimeModelInfo,
  AgentDescription,
} from "../../shared";
import { ProxiedAjoraRuntimeAgent } from "../agent";
import type { AjoraCore } from "./core";
import {
  AjoraCoreErrorCode,
  AjoraCoreRuntimeConnectionStatus,
  AjoraCoreFriendsAccess,
} from "./core-types";
import { AjoraRuntimeTransport } from "../types";

export interface AjoraCoreAddAgentParams {
  id: string;
  agent: AbstractAgent;
}

/**
 * Manages agent registration, lifecycle, and runtime connectivity for AjoraCore.
 * Handles both local development agents and remote runtime agents.
 */
export class AgentRegistry {
  private _agents: Record<string, AbstractAgent> = {};
  private localAgents: Record<string, AbstractAgent> = {};
  private remoteAgents: Record<string, AbstractAgent> = {};
  private _models: RuntimeModelInfo[] = [];
  private _extraData: Record<string, unknown> = {};

  private _runtimeUrl?: string;
  private _runtimeVersion?: string;
  private _runtimeConnectionStatus: AjoraCoreRuntimeConnectionStatus =
    AjoraCoreRuntimeConnectionStatus.Disconnected;
  private _runtimeTransport: AjoraRuntimeTransport = "rest";

  // Coalescing guard for updateRuntimeConnection. setRuntimeUrl and
  // setRuntimeTransport are typically called back-to-back in the provider's
  // config-sync effect — without coalescing they trigger two concurrent
  // /info fetches and a cascade of status notifications (Disconnected →
  // Connecting → Connected, twice), each of which wakes every subscriber.
  // We schedule at most one runtime-connection refresh per microtask and
  // track the in-flight promise so callers can still await it.
  private _pendingConnectionUpdate: Promise<void> | null = null;
  private _connectionUpdateScheduled = false;

  constructor(private core: AjoraCore) {}

  /**
   * Get all agents as a readonly record
   */
  get agents(): Readonly<Record<string, AbstractAgent>> {
    return this._agents;
  }

  get runtimeUrl(): string | undefined {
    return this._runtimeUrl;
  }

  get runtimeVersion(): string | undefined {
    return this._runtimeVersion;
  }

  get runtimeConnectionStatus(): AjoraCoreRuntimeConnectionStatus {
    return this._runtimeConnectionStatus;
  }

  get runtimeTransport(): AjoraRuntimeTransport {
    return this._runtimeTransport;
  }

  /**
   * Get models received from the runtime
   */
  get models(): Readonly<RuntimeModelInfo[]> {
    return this._models;
  }

  /**
   * Get extra data received from the runtime
   */
  get extraData(): Readonly<Record<string, unknown>> {
    return this._extraData;
  }

  /**
   * Initialize agents from configuration
   */
  initialize(agents: Record<string, AbstractAgent>): void {
    this.localAgents = this.assignAgentIds(agents);
    this.applyHeadersToAgents(this.localAgents);
    this._agents = this.localAgents;
  }

  /**
   * Set the runtime URL and update connection
   */
  setRuntimeUrl(runtimeUrl: string | undefined): void {
    const normalizedRuntimeUrl = runtimeUrl
      ? runtimeUrl.replace(/\/$/, "")
      : undefined;

    if (this._runtimeUrl === normalizedRuntimeUrl) {
      return;
    }

    this._runtimeUrl = normalizedRuntimeUrl;
    this.scheduleRuntimeConnectionUpdate();
  }

  setRuntimeTransport(runtimeTransport: AjoraRuntimeTransport): void {
    if (this._runtimeTransport === runtimeTransport) {
      return;
    }

    this._runtimeTransport = runtimeTransport;
    this.scheduleRuntimeConnectionUpdate();
  }

  /**
   * Coalesce multiple synchronous calls to setRuntimeUrl/setRuntimeTransport
   * into a single runtime-info fetch. Any call that arrives while one is
   * already in flight joins the existing promise rather than starting a
   * second one.
   */
  private scheduleRuntimeConnectionUpdate(): void {
    if (this._connectionUpdateScheduled) {
      return;
    }
    this._connectionUpdateScheduled = true;

    // Defer to a microtask so that a batch of synchronous setters
    // (setRuntimeUrl + setRuntimeTransport) in the same tick produce a
    // single updateRuntimeConnection call.
    queueMicrotask(() => {
      this._connectionUpdateScheduled = false;
      this._pendingConnectionUpdate = this.updateRuntimeConnection().finally(
        () => {
          this._pendingConnectionUpdate = null;
        },
      );
    });
  }

  /**
   * Set all agents at once (for development use)
   */
  setAgents__unsafe_dev_only(agents: Record<string, AbstractAgent>): void {
    // Validate all agents before making any changes
    Object.entries(agents).forEach(([id, agent]) => {
      if (agent) {
        this.validateAndAssignAgentId(id, agent);
      }
    });
    this.localAgents = agents;
    this._agents = { ...this.localAgents, ...this.remoteAgents };
    this.applyHeadersToAgents(this._agents);
    void this.notifyAgentsChanged();
  }

  /**
   * Add a single agent (for development use)
   */
  addAgent__unsafe_dev_only({ id, agent }: AjoraCoreAddAgentParams): void {
    this.validateAndAssignAgentId(id, agent);
    this.localAgents[id] = agent;
    this.applyHeadersToAgent(agent);
    this._agents = { ...this.localAgents, ...this.remoteAgents };
    void this.notifyAgentsChanged();
  }

  /**
   * Remove an agent by ID (for development use)
   */
  removeAgent__unsafe_dev_only(id: string): void {
    delete this.localAgents[id];
    this._agents = { ...this.localAgents, ...this.remoteAgents };
    void this.notifyAgentsChanged();
  }

  /**
   * Get an agent by ID
   */
  getAgent(id: string): AbstractAgent | undefined {
    if (id in this._agents) {
      return this._agents[id] as AbstractAgent;
    }

    // Silently return undefined if we're still loading runtime agents
    if (
      this.runtimeUrl !== undefined &&
      (this.runtimeConnectionStatus ===
        AjoraCoreRuntimeConnectionStatus.Disconnected ||
        this.runtimeConnectionStatus ===
          AjoraCoreRuntimeConnectionStatus.Connecting)
    ) {
      return undefined;
    }

    console.warn(`Agent ${id} not found`);
    return undefined;
  }

  /**
   * Apply current headers to an agent
   */
  applyHeadersToAgent(agent: AbstractAgent): void {
    if (agent instanceof HttpAgent) {
      agent.headers = {
        ...(this.core as unknown as AjoraCoreFriendsAccess).headers,
      };
    }
  }

  /**
   * Apply current headers to all agents
   */
  applyHeadersToAgents(agents: Record<string, AbstractAgent>): void {
    Object.values(agents).forEach((agent) => {
      this.applyHeadersToAgent(agent);
    });
  }

  /**
   * Update runtime connection and fetch remote agents
   */
  private async updateRuntimeConnection(): Promise<void> {
    // Skip fetching on the server (SSR). React Native does not define
    // `window`, so a naive `typeof window === "undefined"` check would also
    // skip the fetch on RN — which is exactly the place we *most* need it,
    // since RN has no static prerender path. Detect RN explicitly via the
    // `navigator.product` UA marker, and only bail when we're in a Node
    // environment with no `window` (true SSR).
    const g = globalThis as {
      window?: unknown;
      navigator?: { product?: string };
    };
    const isReactNative = g.navigator?.product === "ReactNative";
    const isBrowser = typeof g.window !== "undefined";
    if (!isReactNative && !isBrowser) {
      return;
    }

    const prevStatus = this._runtimeConnectionStatus;

    if (!this.runtimeUrl) {
      this._runtimeConnectionStatus =
        AjoraCoreRuntimeConnectionStatus.Disconnected;
      this._runtimeVersion = undefined;
      this.remoteAgents = {};
      this._agents = this.localAgents;
      this._models = [];
      this._extraData = {};

      if (prevStatus !== AjoraCoreRuntimeConnectionStatus.Disconnected) {
        await this.notifyRuntimeStatusChanged(
          AjoraCoreRuntimeConnectionStatus.Disconnected,
        );
      }
      await this.notifyAgentsChanged();
      return;
    }

    if (prevStatus !== AjoraCoreRuntimeConnectionStatus.Connecting) {
      this._runtimeConnectionStatus =
        AjoraCoreRuntimeConnectionStatus.Connecting;
      await this.notifyRuntimeStatusChanged(
        AjoraCoreRuntimeConnectionStatus.Connecting,
      );
    } else {
      this._runtimeConnectionStatus =
        AjoraCoreRuntimeConnectionStatus.Connecting;
    }

    try {
      const runtimeInfoResponse = await this.fetchRuntimeInfo();
      const {
        version,
        agents: agentDescriptions,
        models,
        extraData,
      } = runtimeInfoResponse;

      const agents: Record<string, AbstractAgent> = Object.fromEntries(
        Object.entries(agentDescriptions).map(([id, { description }]) => {
          const agent = new ProxiedAjoraRuntimeAgent({
            runtimeUrl: this.runtimeUrl,
            agentId: id, // Runtime agents always have their ID set correctly
            description: description,
            transport: this._runtimeTransport,
          });
          this.applyHeadersToAgent(agent);
          return [id, agent];
        }),
      );

      this.remoteAgents = agents;
      this._agents = { ...this.localAgents, ...this.remoteAgents };
      this._models = models ?? [];
      this._extraData = extraData ?? {};
      const wasConnected =
        this._runtimeConnectionStatus ===
        AjoraCoreRuntimeConnectionStatus.Connected;
      this._runtimeConnectionStatus =
        AjoraCoreRuntimeConnectionStatus.Connected;
      this._runtimeVersion = version;

      if (!wasConnected) {
        await this.notifyRuntimeStatusChanged(
          AjoraCoreRuntimeConnectionStatus.Connected,
        );
      }
      await this.notifyAgentsChanged();
    } catch (error) {
      const wasError =
        this._runtimeConnectionStatus ===
        AjoraCoreRuntimeConnectionStatus.Error;
      this._runtimeConnectionStatus = AjoraCoreRuntimeConnectionStatus.Error;
      this._runtimeVersion = undefined;
      this.remoteAgents = {};
      this._agents = this.localAgents;
      this._models = [];
      this._extraData = {};

      if (!wasError) {
        await this.notifyRuntimeStatusChanged(
          AjoraCoreRuntimeConnectionStatus.Error,
        );
      }
      await this.notifyAgentsChanged();

      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      logger.warn(
        `Failed to load runtime info (${this.runtimeUrl}/info): ${message}`,
      );
      const runtimeError =
        error instanceof Error ? error : new Error(String(error));
      await (this.core as unknown as AjoraCoreFriendsAccess).emitError({
        error: runtimeError,
        code: AjoraCoreErrorCode.RUNTIME_INFO_FETCH_FAILED,
        context: {
          runtimeUrl: this.runtimeUrl,
        },
      });
    }
  }

  private async fetchRuntimeInfo(): Promise<RuntimeInfo> {
    if (!this.runtimeUrl) {
      throw new Error("Runtime URL is not set");
    }

    const baseHeaders = (this.core as unknown as AjoraCoreFriendsAccess)
      .headers;
    const headers: Record<string, string> = {
      ...baseHeaders,
    };

    if (this._runtimeTransport === "single") {
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
      const response = await fetch(this.runtimeUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ method: "info" }),
      });
      if ("ok" in response && !(response as Response).ok) {
        throw new Error(
          `Runtime info request failed with status ${response.status}`,
        );
      }
      return (await response.json()) as RuntimeInfo;
    }

    const response = await fetch(`${this.runtimeUrl}/info`, {
      headers,
    });
    if ("ok" in response && !(response as Response).ok) {
      throw new Error(
        `Runtime info request failed with status ${response.status}`,
      );
    }
    return (await response.json()) as RuntimeInfo;
  }

  /**
   * Assign agent IDs to a record of agents
   */
  private assignAgentIds(
    agents: Record<string, AbstractAgent>,
  ): Record<string, AbstractAgent> {
    Object.entries(agents).forEach(([id, agent]) => {
      if (agent) {
        this.validateAndAssignAgentId(id, agent);
      }
    });
    return agents;
  }

  /**
   * Validate and assign an agent ID
   */
  private validateAndAssignAgentId(
    registrationId: string,
    agent: AbstractAgent,
  ): void {
    if (agent.agentId && agent.agentId !== registrationId) {
      throw new Error(
        `Agent registration mismatch: Agent with ID "${agent.agentId}" cannot be registered under key "${registrationId}". ` +
          `The agent ID must match the registration key or be undefined.`,
      );
    }
    if (!agent.agentId) {
      agent.agentId = registrationId;
    }
  }

  /**
   * Notify subscribers of runtime status changes
   */
  private async notifyRuntimeStatusChanged(
    status: AjoraCoreRuntimeConnectionStatus,
  ): Promise<void> {
    await (this.core as unknown as AjoraCoreFriendsAccess).notifySubscribers(
      (subscriber) =>
        subscriber.onRuntimeConnectionStatusChanged?.({
          ajora: this.core,
          status,
        }),
      "Error in AjoraCore subscriber (onRuntimeConnectionStatusChanged):",
    );
  }

  /**
   * Notify subscribers of agent changes
   */
  private async notifyAgentsChanged(): Promise<void> {
    await (this.core as unknown as AjoraCoreFriendsAccess).notifySubscribers(
      (subscriber) =>
        subscriber.onAgentsChanged?.({
          ajora: this.core,
          agents: this._agents,
        }),
      "Subscriber onAgentsChanged error:",
    );
  }

  /**
   * Notify subscribers of model changes
   */
  private async notifyModelsChanged(): Promise<void> {
    await (this.core as unknown as AjoraCoreFriendsAccess).notifySubscribers(
      (subscriber) =>
        subscriber.onModelsChanged?.({
          ajora: this.core,
          models: this._models,
        }),
      "Subscriber onModelsChanged error:",
    );
  }
}
