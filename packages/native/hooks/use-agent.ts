import { useAjora } from "../providers/AjoraProvider";
import { useMemo, useEffect, useReducer } from "react";
import { DEFAULT_AGENT_ID } from "../../shared";
import { AbstractAgent } from "@ag-ui/client";
import {
  ProxiedAjoraRuntimeAgent,
  AjoraCoreRuntimeConnectionStatus,
} from "../../core";

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
    [JSON.stringify(updates)]
  );

  const agent: AbstractAgent = useMemo(() => {
    const existing = ajora.getAgent(agentId);
    if (existing) {
      return existing;
    }

    const isRuntimeConfigured = ajora.runtimeUrl !== undefined;
    const status = ajora.runtimeConnectionStatus;

    if (
      isRuntimeConfigured &&
      (status === AjoraCoreRuntimeConnectionStatus.Disconnected ||
        status === AjoraCoreRuntimeConnectionStatus.Connecting)
    ) {
      const provisional = new ProxiedAjoraRuntimeAgent({
        runtimeUrl: ajora.runtimeUrl,
        agentId,
        transport: ajora.runtimeTransport,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (provisional as any).headers = { ...ajora.headers };
      return provisional;
    }

    const knownAgents = Object.keys(ajora.agents ?? {});
    const runtimePart = isRuntimeConfigured
      ? `runtimeUrl=${ajora.runtimeUrl}`
      : "no runtimeUrl";
    throw new Error(
      `useAgent: Agent '${agentId}' not found after runtime sync (${runtimePart}). ` +
        (knownAgents.length
          ? `Known agents: [${knownAgents.join(", ")}]`
          : "No agents registered.") +
        " Verify your runtime /info and/or agents__unsafe_dev_only."
    );
  }, [
    agentId,
    ajora.agents,
    ajora.runtimeConnectionStatus,
    ajora.runtimeUrl,
    ajora.runtimeTransport,
    JSON.stringify(ajora.headers),
    ajora,
  ]);

  useEffect(() => {
    if (updateFlags.length === 0) {
      return;
    }

    const handlers: Parameters<AbstractAgent["subscribe"]>[0] = {};

    if (updateFlags.includes(UseAgentUpdate.OnMessagesChanged)) {
      handlers.onMessagesChanged = () => {
        forceUpdate();
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
    return () => subscription.unsubscribe();
  }, [agent, forceUpdate, JSON.stringify(updateFlags)]);

  return {
    agent,
  };
}
