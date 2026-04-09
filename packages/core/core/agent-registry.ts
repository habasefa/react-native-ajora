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

  /** Monotonic counter used to cancel stale `updateRuntimeConnection` calls. */
  private _connectionGeneration = 0;

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

    console.log(
      "[ajora:debug] AgentRegistry.setRuntimeUrl",
      {
        incoming: runtimeUrl,
        normalized: normalizedRuntimeUrl,
        previous: this._runtimeUrl,
        isNoOp: this._runtimeUrl === normalizedRuntimeUrl,
      },
    );

    if (this._runtimeUrl === normalizedRuntimeUrl) {
      return;
    }

    this._runtimeUrl = normalizedRuntimeUrl;
    void this.updateRuntimeConnection();
  }

  setRuntimeTransport(
    runtimeTransport: AjoraRuntimeTransport,
    options?: { skipUpdate?: boolean },
  ): void {
    console.log(
      "[ajora:debug] AgentRegistry.setRuntimeTransport",
      {
        incoming: runtimeTransport,
        previous: this._runtimeTransport,
        skipUpdate: options?.skipUpdate ?? false,
        isNoOp: this._runtimeTransport === runtimeTransport,
      },
    );

    if (this._runtimeTransport === runtimeTransport) {
      return;
    }

    this._runtimeTransport = runtimeTransport;
    if (options?.skipUpdate) {
      return;
    }
    void this.updateRuntimeConnection();
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
        ...this.core.headers,
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
   * Update runtime connection and fetch remote agents.
   *
   * Uses a generation counter to cancel stale calls: if `setRuntimeUrl` or
   * `setRuntimeTransport` fires while a previous `updateRuntimeConnection`
   * is in flight, the new call increments the generation and the old call
   * bails at every await point where it checks `myGeneration`.
   */
  private async updateRuntimeConnection(): Promise<void> {
    const myGeneration = ++this._connectionGeneration;

    const g = globalThis as {
      window?: unknown;
      navigator?: { product?: string };
    };
    const isReactNative = g.navigator?.product === "ReactNative";
    const isBrowser = typeof g.window !== "undefined";

    console.log("[ajora:debug] updateRuntimeConnection: entry", {
      generation: myGeneration,
      runtimeUrl: this._runtimeUrl,
      transport: this._runtimeTransport,
      isReactNative,
      isBrowser,
      navigatorProduct: g.navigator?.product,
      currentStatus: this._runtimeConnectionStatus,
      localAgentCount: Object.keys(this.localAgents).length,
      remoteAgentCount: Object.keys(this.remoteAgents).length,
    });

    if (!isReactNative && !isBrowser) {
      console.log(
        "[ajora:debug] updateRuntimeConnection: skipping — not RN, not browser (SSR path)",
      );
      return;
    }

    if (!this.runtimeUrl) {
      console.log(
        "[ajora:debug] updateRuntimeConnection: no runtimeUrl — marking Disconnected",
      );
      this._runtimeConnectionStatus =
        AjoraCoreRuntimeConnectionStatus.Disconnected;
      this._runtimeVersion = undefined;
      this.remoteAgents = {};
      this._agents = this.localAgents;
      this._models = [];
      this._extraData = {};

      await this.notifyRuntimeStatusChanged(
        AjoraCoreRuntimeConnectionStatus.Disconnected,
      );
      await this.notifyAgentsChanged();
      return;
    }

    this._runtimeConnectionStatus = AjoraCoreRuntimeConnectionStatus.Connecting;
    await this.notifyRuntimeStatusChanged(
      AjoraCoreRuntimeConnectionStatus.Connecting,
    );

    try {
      console.log(
        "[ajora:debug] updateRuntimeConnection: calling fetchRuntimeInfo()",
      );
      const runtimeInfoResponse = await this.fetchRuntimeInfo();

      // Bail if a newer call superseded us while we were awaiting the fetch.
      if (myGeneration !== this._connectionGeneration) {
        console.log(
          "[ajora:debug] updateRuntimeConnection: stale generation after fetch, bailing",
          { myGeneration, current: this._connectionGeneration },
        );
        return;
      }

      console.log(
        "[ajora:debug] updateRuntimeConnection: fetchRuntimeInfo resolved",
        {
          version: runtimeInfoResponse.version,
          agentIds: Object.keys(runtimeInfoResponse.agents ?? {}),
          modelCount: (runtimeInfoResponse.models ?? []).length,
          modelIds: (runtimeInfoResponse.models ?? []).map((m) => m.id),
          hasExtraData: !!runtimeInfoResponse.extraData,
        },
      );
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
      this._runtimeConnectionStatus =
        AjoraCoreRuntimeConnectionStatus.Connected;
      this._runtimeVersion = version;

      console.log(
        "[ajora:debug] updateRuntimeConnection: populated registry",
        {
          mergedAgentIds: Object.keys(this._agents),
          modelCount: this._models.length,
          status: "Connected",
          version,
        },
      );

      await this.notifyRuntimeStatusChanged(
        AjoraCoreRuntimeConnectionStatus.Connected,
      );
      await this.notifyAgentsChanged();
    } catch (error) {
      this._runtimeConnectionStatus = AjoraCoreRuntimeConnectionStatus.Error;
      this._runtimeVersion = undefined;
      this.remoteAgents = {};
      this._agents = this.localAgents;
      this._models = [];
      this._extraData = {};

      console.error(
        "[ajora:debug] updateRuntimeConnection: FAILED",
        {
          runtimeUrl: this.runtimeUrl,
          transport: this._runtimeTransport,
          errorName: error instanceof Error ? error.name : typeof error,
          errorMessage:
            error instanceof Error ? error.message : JSON.stringify(error),
          errorStack: error instanceof Error ? error.stack : undefined,
        },
      );

      await this.notifyRuntimeStatusChanged(
        AjoraCoreRuntimeConnectionStatus.Error,
      );
      await this.notifyAgentsChanged();

      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      logger.warn(
        `Failed to load runtime info (${this.runtimeUrl}/info): ${message}`,
      );
      const runtimeError =
        error instanceof Error ? error : new Error(String(error));
      await this.core.emitError({
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

    const baseHeaders = this.core.headers;
    const headers: Record<string, string> = {
      ...baseHeaders,
    };

    // Redacted header view for logs — show keys but not auth token values.
    const redactedHeaders = Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [
        k,
        /auth|token|key|secret/i.test(k) && typeof v === "string"
          ? `<redacted:${v.length}>`
          : v,
      ]),
    );

    // Abort the fetch after 15s so a hung connection surfaces as a visible
    // error in the logs instead of silently leaving status=Connecting forever.
    // (15s is long enough to cover normal LAN latency + cold-start Mastra
    // agent instantiation but short enough that a user sees *something*
    // before giving up on the app.)
    const INFO_FETCH_TIMEOUT_MS = 15_000;
    const timeoutController = new AbortController();
    const timeoutHandle = setTimeout(() => {
      console.warn(
        `[ajora:debug] fetchRuntimeInfo: ${INFO_FETCH_TIMEOUT_MS}ms timeout — aborting`,
      );
      timeoutController.abort();
    }, INFO_FETCH_TIMEOUT_MS);

    if (this._runtimeTransport === "single") {
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
      console.log("[ajora:debug] fetchRuntimeInfo: POST single-route", {
        url: this.runtimeUrl,
        headers: redactedHeaders,
        timeoutMs: INFO_FETCH_TIMEOUT_MS,
      });
      let response: Response;
      try {
        response = (await fetch(this.runtimeUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({ method: "info" }),
          signal: timeoutController.signal,
        })) as Response;
      } catch (err) {
        clearTimeout(timeoutHandle);
        console.error("[ajora:debug] fetchRuntimeInfo: fetch() threw", {
          url: this.runtimeUrl,
          errorName: err instanceof Error ? err.name : typeof err,
          errorMessage: err instanceof Error ? err.message : String(err),
          wasAborted: timeoutController.signal.aborted,
        });
        throw err;
      }
      clearTimeout(timeoutHandle);
      console.log("[ajora:debug] fetchRuntimeInfo: response (single)", {
        status: response.status,
        ok: response.ok,
        contentType: response.headers?.get?.("content-type"),
      });
      if ("ok" in response && !response.ok) {
        const bodyText = await response.text().catch(() => "<unreadable>");
        console.error(
          "[ajora:debug] fetchRuntimeInfo: non-OK response body",
          { status: response.status, body: bodyText.slice(0, 500) },
        );
        throw new Error(
          `Runtime info request failed with status ${response.status}: ${bodyText.slice(0, 200)}`,
        );
      }
      const parsed = (await response.json()) as RuntimeInfo;
      console.log("[ajora:debug] fetchRuntimeInfo: parsed payload (single)", {
        version: parsed.version,
        agentIds: Object.keys(parsed.agents ?? {}),
        modelCount: (parsed.models ?? []).length,
      });
      return parsed;
    }

    const infoUrl = `${this.runtimeUrl}/info`;
    console.log("[ajora:debug] fetchRuntimeInfo: GET REST", {
      url: infoUrl,
      headers: redactedHeaders,
      timeoutMs: INFO_FETCH_TIMEOUT_MS,
    });
    let response: Response;
    try {
      response = (await fetch(infoUrl, {
        headers,
        signal: timeoutController.signal,
      })) as Response;
    } catch (err) {
      clearTimeout(timeoutHandle);
      console.error("[ajora:debug] fetchRuntimeInfo: fetch() threw", {
        url: infoUrl,
        errorName: err instanceof Error ? err.name : typeof err,
        errorMessage: err instanceof Error ? err.message : String(err),
        wasAborted: timeoutController.signal.aborted,
      });
      throw err;
    }
    clearTimeout(timeoutHandle);
    console.log("[ajora:debug] fetchRuntimeInfo: response (REST)", {
      status: response.status,
      ok: response.ok,
      contentType: response.headers?.get?.("content-type"),
    });
    if ("ok" in response && !response.ok) {
      const bodyText = await response.text().catch(() => "<unreadable>");
      console.error("[ajora:debug] fetchRuntimeInfo: non-OK response body", {
        status: response.status,
        body: bodyText.slice(0, 500),
      });
      throw new Error(
        `Runtime info request failed with status ${response.status}: ${bodyText.slice(0, 200)}`,
      );
    }
    const parsed = (await response.json()) as RuntimeInfo;
    console.log("[ajora:debug] fetchRuntimeInfo: parsed payload (REST)", {
      version: parsed.version,
      agentIds: Object.keys(parsed.agents ?? {}),
      modelCount: (parsed.models ?? []).length,
    });
    return parsed;
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
    await this.core.notifySubscribers(
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
    await this.core.notifySubscribers(
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
    await this.core.notifySubscribers(
      (subscriber) =>
        subscriber.onModelsChanged?.({
          ajora: this.core,
          models: this._models,
        }),
      "Subscriber onModelsChanged error:",
    );
  }
}
