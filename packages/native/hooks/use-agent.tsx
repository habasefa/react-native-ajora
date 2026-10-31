import { useAjora } from "../providers/AjoraProvider";
import { useMemo, useEffect, useReducer, useRef } from "react";
import { DEFAULT_AGENT_ID } from "../../shared";
import { AbstractAgent } from "@ag-ui/client";
import {
  ProxiedAjoraRuntimeAgent,
  AjoraCoreRuntimeConnectionStatus,
} from "../../core";
import { installThinkingSubscriber } from "../lib/thinking-subscriber";
import { useAjoraHaptics } from "./use-haptics";

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
  const { impactLight } = useAjoraHaptics();

  // Streaming fires `onMessagesChanged` very frequently. Buzzing on every
  // tick is a continuous vibration; counting and firing on every *other*
  // tick halves it into a discernible pulse. Ref, not state — must not
  // re-render or re-subscribe.
  const hapticTickRef = useRef(0);

  // Stabilize the updates array so callers don't need to memoize it.
  const updatesRef = useRef(updates);
  const updatesJson = JSON.stringify(updates);
  const prevUpdatesJson = useRef(updatesJson);
  if (prevUpdatesJson.current !== updatesJson) {
    prevUpdatesJson.current = updatesJson;
    updatesRef.current = updates;
  }

  const updateFlags = useMemo(
    () => updatesRef.current ?? ALL_UPDATES,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updatesRef.current],
  );

  // Stabilize headers so the agent memo doesn't re-fire on every render.
  const headersRef = useRef(ajora.headers);
  const headersJson = JSON.stringify(ajora.headers);
  const prevHeadersJson = useRef(headersJson);
  if (prevHeadersJson.current !== headersJson) {
    prevHeadersJson.current = headersJson;
    headersRef.current = ajora.headers;
  }
  const stableHeaders = headersRef.current;

  // Stabilize the agents dependency: `ajora.agents` is a getter that returns
  // the internal `_agents` object. Its *reference* changes whenever the
  // registry replaces the object (e.g. `setAgents__unsafe_dev_only`,
  // `updateRuntimeConnection`) even when the *logical content* (set of agent
  // ids) hasn't changed. Using the raw getter as a useMemo dep causes the
  // agent memo to recalculate on every such replacement — creating new
  // provisional or looked-up agent instances — which cascades into the
  // connect effect and subscription lifecycle. Instead, derive a primitive
  // string key from the agent ids. The memo only re-fires when agents are
  // actually added or removed.
  const agentKeys = Object.keys(ajora.agents ?? {}).sort().join(",");

  const agent: AbstractAgent = useMemo(() => {
    const existing = ajora.getAgent(agentId);
    if (existing) {
      return existing;
    }

    const isRuntimeConfigured = ajora.runtimeUrl !== undefined;
    const status = ajora.runtimeConnectionStatus;

    // While runtime is not yet synced, return a provisional runtime agent
    if (
      isRuntimeConfigured &&
      (status === AjoraCoreRuntimeConnectionStatus.Disconnected ||
        status === AjoraCoreRuntimeConnectionStatus.Connecting ||
        status === AjoraCoreRuntimeConnectionStatus.Error)
    ) {
      const provisional = new ProxiedAjoraRuntimeAgent({
        runtimeUrl: ajora.runtimeUrl,
        agentId,
        transport: ajora.runtimeTransport,
      });
      // Apply current headers so runs/connects inherit them
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (provisional as any).headers = { ...stableHeaders };
      return provisional;
    }

    // After runtime has synced (Connected or Error) or no runtime configured
    // and the agent doesn't exist, throw a descriptive error
    const knownAgents = Object.keys(ajora.agents ?? {});
    const runtimePart = isRuntimeConfigured
      ? `runtimeUrl=${ajora.runtimeUrl}`
      : "no runtimeUrl";
    throw new Error(
      `useAgent: Agent '${agentId}' not found after runtime sync (${runtimePart}). ` +
        (knownAgents.length
          ? `Known agents: [${knownAgents.join(", ")}]`
          : "No agents registered.") +
        " Verify your runtime /info and/or agents__unsafe_dev_only.",
    );
  }, [
    agentId,
    agentKeys,
    ajora.runtimeConnectionStatus,
    ajora.runtimeUrl,
    ajora.runtimeTransport,
    stableHeaders,
    ajora,
  ]);

  useEffect(() => {
    installThinkingSubscriber(agent);
  }, [agent]);

  useEffect(() => {
    if (updateFlags.length === 0) {
      return;
    }
    const handlers: Parameters<AbstractAgent["subscribe"]>[0] = {};

    if (updateFlags.includes(UseAgentUpdate.OnMessagesChanged)) {
      handlers.onMessagesChanged = () => {
        forceUpdate();
        if (agent.isRunning) {
          hapticTickRef.current += 1;
          if (hapticTickRef.current % 2 === 0) {
            // No-ops unless the consumer opted into haptics.
            impactLight();
          }
        } else {
          // Reset between runs so each response starts on the same phase.
          hapticTickRef.current = 0;
        }
      };
    }

    if (updateFlags.includes(UseAgentUpdate.OnStateChanged)) {
      handlers.onStateChanged = () => {
        forceUpdate();
      };
    }

    if (updateFlags.includes(UseAgentUpdate.OnRunStatusChanged)) {
      handlers.onRunInitialized = () => {
        forceUpdate();
      };
      handlers.onRunFinalized = () => {
        forceUpdate();
      };
      handlers.onRunFailed = () => {
        forceUpdate();
      };
    }

    const subscription = agent.subscribe(handlers);
    return () => {
      subscription.unsubscribe();
    };
  }, [agent, forceUpdate, updateFlags, impactLight]);

  return {
    agent,
  };
}
