import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { z } from "zod";
import { FrontendTool } from "@ajora-ai/core";
import { AbstractAgent } from "@ag-ui/client";
import { AjoraCoreReact } from "../lib/react-core";
import {
  ReactToolCallRenderer,
  ReactActivityMessageRenderer,
  ReactCustomMessageRenderer,
  ReactFrontendTool,
  ReactHumanInTheLoop,
} from "../types";

const HEADER_NAME = "X-CopilotCloud-Public-Api-Key";
const COPILOT_CLOUD_CHAT_URL = "https://api.cloud.copilotkit.ai/copilotkit/v1";

export interface AjoraContextValue {
  ajora: AjoraCoreReact;
  executingToolCallIds: ReadonlySet<string>;
}

const EMPTY_SET: ReadonlySet<string> = new Set();

const AjoraContext = createContext<AjoraContextValue>({
  ajora: null!,
  executingToolCallIds: EMPTY_SET,
});

export interface AjoraProviderProps {
  children: ReactNode;
  runtimeUrl?: string;
  headers?: Record<string, string>;
  publicApiKey?: string;
  publicLicenseKey?: string;
  properties?: Record<string, unknown>;
  useSingleEndpoint?: boolean;
  agents__unsafe_dev_only?: Record<string, AbstractAgent>;
  renderToolCalls?: ReactToolCallRenderer<any>[];
  renderActivityMessages?: ReactActivityMessageRenderer<any>[];
  renderCustomMessages?: ReactCustomMessageRenderer[];
  frontendTools?: ReactFrontendTool[];
  humanInTheLoop?: ReactHumanInTheLoop[];
}

function useStableArrayProp<T>(
  prop: T[] | undefined,
  warningMessage?: string,
  isMeaningfulChange?: (initial: T[], next: T[]) => boolean
): T[] {
  const empty = useMemo<T[]>(() => [], []);
  const value = prop ?? empty;
  const initial = useRef(value);

  useEffect(() => {
    if (
      warningMessage &&
      value !== initial.current &&
      (isMeaningfulChange ? isMeaningfulChange(initial.current, value) : true)
    ) {
      console.error(warningMessage);
    }
  }, [value, warningMessage]);

  return value;
}

export const AjoraProvider: React.FC<AjoraProviderProps> = ({
  children,
  runtimeUrl,
  headers = {},
  publicApiKey,
  publicLicenseKey,
  properties = {},
  agents__unsafe_dev_only: agents = {},
  renderToolCalls,
  renderActivityMessages,
  renderCustomMessages,
  frontendTools,
  humanInTheLoop,
  useSingleEndpoint = false,
}) => {
  const renderToolCallsList = useStableArrayProp<ReactToolCallRenderer<any>>(
    renderToolCalls,
    "renderToolCalls must be a stable array. If you want to dynamically add or remove tools, use `useFrontendTool` instead.",
    (initial, next) => {
      const key = (rc?: ReactToolCallRenderer<unknown>) =>
        `${rc?.agentId ?? ""}:${rc?.name ?? ""}`;
      const setFrom = (arr: ReactToolCallRenderer<unknown>[]) =>
        new Set(arr.map(key));
      const a = setFrom(initial);
      const b = setFrom(next);
      if (a.size !== b.size) return true;
      for (const k of a) if (!b.has(k)) return true;
      return false;
    }
  );

  const renderCustomMessagesList =
    useStableArrayProp<ReactCustomMessageRenderer>(
      renderCustomMessages,
      "renderCustomMessages must be a stable array."
    );

  const renderActivityMessagesList = useStableArrayProp<
    ReactActivityMessageRenderer<any>
  >(renderActivityMessages, "renderActivityMessages must be a stable array.");

  const resolvedPublicKey = publicApiKey ?? publicLicenseKey;
  const hasLocalAgents = agents && Object.keys(agents).length > 0;

  const mergedHeaders = useMemo(() => {
    if (!resolvedPublicKey) return headers;
    if (headers[HEADER_NAME]) return headers;
    return {
      ...headers,
      [HEADER_NAME]: resolvedPublicKey,
    };
  }, [headers, resolvedPublicKey]);

  if (!runtimeUrl && !resolvedPublicKey && !hasLocalAgents) {
    const message =
      "Missing required prop: 'runtimeUrl' or 'publicApiKey' or 'publicLicenseKey'";
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    } else {
      console.warn(message);
    }
  }

  const chatApiEndpoint =
    runtimeUrl ?? (resolvedPublicKey ? COPILOT_CLOUD_CHAT_URL : undefined);

  const frontendToolsList = useStableArrayProp<ReactFrontendTool>(
    frontendTools,
    "frontendTools must be a stable array. If you want to dynamically add or remove tools, use `useFrontendTool` instead."
  );
  const humanInTheLoopList = useStableArrayProp<ReactHumanInTheLoop>(
    humanInTheLoop,
    "humanInTheLoop must be a stable array. If you want to dynamically add or remove human-in-the-loop tools, use `useHumanInTheLoop` instead."
  );

  const processedHumanInTheLoopTools = useMemo(() => {
    const processedTools: FrontendTool[] = [];
    const processedRenderToolCalls: ReactToolCallRenderer<unknown>[] = [];

    humanInTheLoopList.forEach((tool) => {
      const frontendTool: FrontendTool = {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        followUp: tool.followUp,
        ...(tool.agentId && { agentId: tool.agentId }),
        handler: async () => {
          return new Promise((resolve) => {
            console.warn(
              `Human-in-the-loop tool '${tool.name}' called but no interactive handler is set up.`
            );
            resolve(undefined);
          });
        },
      };
      processedTools.push(frontendTool);

      if (tool.render) {
        processedRenderToolCalls.push({
          name: tool.name,
          args: tool.parameters!,
          render: tool.render,
          ...(tool.agentId && { agentId: tool.agentId }),
        } as ReactToolCallRenderer<unknown>);
      }
    });

    return { tools: processedTools, renderToolCalls: processedRenderToolCalls };
  }, [humanInTheLoopList]);

  const allTools = useMemo(() => {
    const tools: FrontendTool[] = [];
    tools.push(...frontendToolsList);
    tools.push(...processedHumanInTheLoopTools.tools);
    return tools;
  }, [frontendToolsList, processedHumanInTheLoopTools]);

  const allRenderToolCalls = useMemo(() => {
    const combined: ReactToolCallRenderer<unknown>[] = [...renderToolCallsList];
    frontendToolsList.forEach((tool) => {
      if (tool.render) {
        const args =
          tool.parameters || (tool.name === "*" ? z.any() : undefined);
        if (args) {
          combined.push({
            name: tool.name,
            args: args,
            render: tool.render,
          } as ReactToolCallRenderer<unknown>);
        }
      }
    });
    combined.push(...processedHumanInTheLoopTools.renderToolCalls);
    return combined;
  }, [renderToolCallsList, frontendToolsList, processedHumanInTheLoopTools]);

  const ajora = useMemo(() => {
    const ajora = new AjoraCoreReact({
      runtimeUrl: chatApiEndpoint,
      runtimeTransport: useSingleEndpoint ? "single" : "rest",
      headers: mergedHeaders,
      properties,
      agents__unsafe_dev_only: agents,
      tools: allTools,
      renderToolCalls: allRenderToolCalls,
      renderActivityMessages: renderActivityMessagesList,
      renderCustomMessages: renderCustomMessagesList,
    });

    return ajora;
  }, [
    allTools,
    allRenderToolCalls,
    renderActivityMessagesList,
    renderCustomMessagesList,
    useSingleEndpoint,
  ]);

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const subscription = ajora.subscribe({
      onRenderToolCallsChanged: () => {
        forceUpdate();
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [ajora]);

  const [executingToolCallIds, setExecutingToolCallIds] = useState<
    ReadonlySet<string>
  >(() => new Set());

  useEffect(() => {
    const subscription = ajora.subscribe({
      onToolExecutionStart: ({ toolCallId }: { toolCallId: string }) => {
        setExecutingToolCallIds((prev) => {
          if (prev.has(toolCallId)) return prev;
          const next = new Set(prev);
          next.add(toolCallId);
          return next;
        });
      },
      onToolExecutionEnd: ({ toolCallId }: { toolCallId: string }) => {
        setExecutingToolCallIds((prev) => {
          if (!prev.has(toolCallId)) return prev;
          const next = new Set(prev);
          next.delete(toolCallId);
          return next;
        });
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [ajora]);

  useEffect(() => {
    ajora.setRuntimeUrl(chatApiEndpoint);
    ajora.setRuntimeTransport(useSingleEndpoint ? "single" : "rest");
    ajora.setHeaders(mergedHeaders);
    ajora.setProperties(properties);
    ajora.setAgents__unsafe_dev_only(agents);
  }, [chatApiEndpoint, mergedHeaders, properties, agents, useSingleEndpoint]);

  return (
    <AjoraContext.Provider
      value={{
        ajora,
        executingToolCallIds,
      }}
    >
      {children}
    </AjoraContext.Provider>
  );
};

export const useAjora = (): AjoraContextValue => {
  const context = useContext(AjoraContext);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  if (!context) {
    throw new Error("useAjora must be used within AjoraProvider");
  }
  useEffect(() => {
    const subscription = context.ajora.subscribe({
      onRuntimeConnectionStatusChanged: () => {
        forceUpdate();
      },
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return context;
};
