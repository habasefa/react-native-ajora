import { useAjora } from "../providers/AjoraProvider";
import { useMemo, useEffect, useReducer, useRef } from "react";
import { DEFAULT_AGENT_ID } from "../../shared";
import { AbstractAgent } from "@ag-ui/client";
import {
  ProxiedAjoraRuntimeAgent,
  AjoraCoreRuntimeConnectionStatus,
} from "../../core";

// Optional haptics import - gracefully handle if not available
let Haptics: {
  impactAsync?: (style: string) => Promise<void>;
  ImpactFeedbackStyle?: { Light: string };
} = {};

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Haptics = require("expo-haptics");
} catch {
  // expo-haptics not available
  console.warn("expo-haptics not available");
}

export enum UseAgentUpdate {
  OnMessagesChanged = "OnMessagesChanged",
  OnStateChanged = "OnStateChanged",
  OnRunStatusChanged = "OnRunStatusChanged",
}

const ALL_UPDATES: UseAgentUpdate[] = [
  UseAgentUpdate.OnMessagesChanged,
  UseAgentUpdate.OnStateChanged,
  UseAgentUpdate.OnRunStatusChanged,
];

export interface UseAgentProps {
  agentId?: string;
  updates?: UseAgentUpdate[];
}

export function useAgent({ agentId, updates }: UseAgentProps = {}) {
  agentId ??= DEFAULT_AGENT_ID;

  const { ajora } = useAjora();
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const updateFlags = useMemo(
    () => updates ?? ALL_UPDATES,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updates?.length, ...(updates ?? [])],
  );

  // Cache of provisional agents keyed by (runtimeUrl, agentId, transport).
  // Without this cache, `useMemo` would construct a brand-new provisional
  // agent every time any of its deps changed (including the very frequent
  // `ajora.agents` reference change that fires on every runtime sync).
  // That churn propagates into the connect effect in AjoraChat, which then
  // re-fires `connectAgent` against a different agent instance each render —
  // the root cause of concurrent/orphaned connects.
  const provisionalCacheRef = useRef<
    Map<string, ProxiedAjoraRuntimeAgent>
  >(new Map());

  const agent: AbstractAgent = useMemo(() => {
    const existing = ajora.getAgent(agentId);
    const knownAgentIds = Object.keys(ajora.agents ?? {});
    console.log("[ajora:debug] useAgent resolve", {
      requestedAgentId: agentId,
      foundExisting: !!existing,
      knownAgentIds,
      runtimeUrl: ajora.runtimeUrl,
      runtimeStatus: ajora.runtimeConnectionStatus,
      runtimeTransport: ajora.runtimeTransport,
      modelCount: ajora.models?.length ?? 0,
    });
    if (existing) {
      return existing;
    }

    const isRuntimeConfigured = ajora.runtimeUrl !== undefined;
    const status = ajora.runtimeConnectionStatus;

    // If runtime is configured, ALWAYS return a provisional runtime agent
    // when the requested one isn't (yet) registered — including the
    // `Connected` state. There is a window between "runtime fetch resolved"
    // and "consumer re-rendered" where a stale render still sees the old
    // empty agents map. Throwing in render here would crash the entire
    // chat tree (header, back button, input handlers — everything goes
    // dead and the user can only type) on a benign race. A provisional
    // agent keeps the UI responsive; the next render with the populated
    // map swaps it transparently.
    if (isRuntimeConfigured) {
      if (status === AjoraCoreRuntimeConnectionStatus.Connected) {
        const knownAgents = Object.keys(ajora.agents ?? {});
        console.warn(
          `useAgent: Agent '${agentId}' not in registry after runtime sync ` +
            `(runtimeUrl=${ajora.runtimeUrl}). ` +
            (knownAgents.length
              ? `Known agents: [${knownAgents.join(", ")}]. `
              : "No agents registered. ") +
            "Returning a provisional agent so the UI stays responsive — " +
            "verify your runtime /info response and the requested agentId.",
        );
      }

      // Reuse a cached provisional agent so its identity is stable across
      // renders. The cache key includes runtimeUrl + transport so that
      // reconfiguring the runtime still invalidates correctly.
      const cacheKey = `${ajora.runtimeUrl}::${agentId}::${ajora.runtimeTransport}`;
      let provisional = provisionalCacheRef.current.get(cacheKey);
      if (!provisional) {
        provisional = new ProxiedAjoraRuntimeAgent({
          runtimeUrl: ajora.runtimeUrl,
          agentId,
          transport: ajora.runtimeTransport,
        });
        provisionalCacheRef.current.set(cacheKey, provisional);
      }
      // Header sync is handled by the effect below (not inlined here) so
      // this memo stays pure under React's rules-of-hooks.
      return provisional;
    }

    // No runtime configured (pure dev/local) and the agent doesn't exist —
    // there is no way to recover, so the throw is genuinely informative.
    const knownAgents = Object.keys(ajora.agents ?? {});
    throw new Error(
      `useAgent: Agent '${agentId}' not found and no runtimeUrl is configured. ` +
        (knownAgents.length
          ? `Known agents: [${knownAgents.join(", ")}]`
          : "No agents registered.") +
        " Pass `agents__unsafe_dev_only` to <AjoraProvider> or set `runtimeUrl`.",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    agentId,
    ajora.agents,
    ajora.runtimeConnectionStatus,
    ajora.runtimeUrl,
    ajora.runtimeTransport,
    ajora,
  ]);

  // Keep provisional agent headers in sync with the current ajora headers.
  // Previously this was done inside the useMemo via direct mutation, which
  // violates React's rules-of-hooks (memos must be pure). Moving it to an
  // effect means the mutation always happens after commit, against the
  // agent that's actually rendered.
  useEffect(() => {
    if (agent instanceof ProxiedAjoraRuntimeAgent) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (agent as any).headers = { ...ajora.headers };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent, JSON.stringify(ajora.headers)]);

  useEffect(() => {
    if (updateFlags.length === 0) {
      return;
    }

    const handlers: Parameters<AbstractAgent["subscribe"]>[0] = {};

    if (updateFlags.includes(UseAgentUpdate.OnMessagesChanged)) {
      // Content stripping for immutableContent renderers is handled by AjoraCoreReact
      handlers.onMessagesChanged = () => {
        forceUpdate();
        if (
          Haptics.impactAsync &&
          Haptics.ImpactFeedbackStyle &&
          agent.isRunning
        ) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      };
    }

    if (updateFlags.includes(UseAgentUpdate.OnStateChanged)) {
      handlers.onStateChanged = forceUpdate;
    }

    if (updateFlags.includes(UseAgentUpdate.OnRunStatusChanged)) {
      handlers.onRunInitialized = forceUpdate;
      handlers.onRunFinalized = forceUpdate;
      handlers.onRunFailed = forceUpdate;
    }

    const subscription = agent.subscribe(handlers);
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent, forceUpdate, JSON.stringify(updateFlags)]);

  return {
    agent,
  };
}
