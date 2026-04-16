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
import {
  AjoraCoreRuntimeConnectionStatus,
  FrontendTool,
} from "../../core";
import { AbstractAgent } from "@ag-ui/client";
import { AjoraCoreReact } from "../lib/react-core";
import {
  ReactToolCallRenderer,
  ReactActivityMessageRenderer,
  ReactCustomMessageRenderer,
  ReactFrontendTool,
  ReactHumanInTheLoop,
} from "../types";
import type {
  AttachmentLimits,
  UploadAttachmentFn,
} from "../lib/uploader";


export interface AjoraContextValue {
  ajora: AjoraCoreReact;
  executingToolCallIds: ReadonlySet<string>;
  /**
   * Runtime connection status mirrored into React state so consumers get a
   * single, batched re-render when the status changes — instead of each
   * `useAjora()` caller opening its own subscription (which previously
   * produced one forceUpdate per consumer per status change).
   */
  runtimeConnectionStatus: AjoraCoreRuntimeConnectionStatus;
  /**
   * Consumer-provided uploader for file attachments. When absent, the chat
   * input surfaces an "Upload handler not configured" error if a user tries
   * to attach something — the attach button itself is hidden by
   * {@link AjoraContextValue.attachmentsEnabled}.
   */
  uploadAttachment?: UploadAttachmentFn;
  /**
   * Optional overrides for attachment validation. Missing fields fall back to
   * `DEFAULT_ATTACHMENT_LIMITS`.
   */
  attachmentLimits?: AttachmentLimits;
  /**
   * True iff `uploadAttachment` is wired. The input uses this to decide
   * whether to render the attach button at all — avoids dead UI in apps that
   * haven't opted in.
   */
  attachmentsEnabled: boolean;
}

const AjoraContext = createContext<AjoraContextValue | null>(null);

export interface AjoraProviderProps {
  children: ReactNode;
  runtimeUrl?: string;
  headers?: Record<string, string>;
  properties?: Record<string, unknown>;
  useSingleEndpoint?: boolean;
  agents__unsafe_dev_only?: Record<string, AbstractAgent>;
  renderToolCalls?: ReactToolCallRenderer<any>[];
  renderActivityMessages?: ReactActivityMessageRenderer<any>[];
  renderCustomMessages?: ReactCustomMessageRenderer[];
  frontendTools?: ReactFrontendTool[];
  humanInTheLoop?: ReactHumanInTheLoop[];
  /**
   * Uploader called for each attachment the user picks. The hook resolves
   * with a remote URL (and optional storage key); the library owns
   * cancellation, progress, retry, and sends the URL in the outgoing message
   * as a multimodal `binary` content part. When omitted, the attach button
   * is hidden.
   */
  uploadAttachment?: UploadAttachmentFn;
  /**
   * Overrides for attachment validation (max count, size, allowed MIME types).
   * Fields not set fall back to `DEFAULT_ATTACHMENT_LIMITS`.
   */
  attachmentLimits?: AttachmentLimits;
}

// Stable defaults — inline `= {}` creates a new object every render, which
// destabilises useEffect/useMemo dependency arrays and causes infinite
// re-render loops (the config-sync effect fires, replaces _agents, notifies
// subscribers, triggers re-renders, which re-create `{}`, ad infinitum).
const EMPTY_AGENTS: Record<string, AbstractAgent> = {};
const EMPTY_HEADERS: Record<string, string> = {};
const EMPTY_PROPERTIES: Record<string, unknown> = {};

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
  headers = EMPTY_HEADERS,
  properties = EMPTY_PROPERTIES,
  agents__unsafe_dev_only: agents = EMPTY_AGENTS,
  renderToolCalls,
  renderActivityMessages,
  renderCustomMessages,
  frontendTools,
  humanInTheLoop,
  useSingleEndpoint = false,
  uploadAttachment,
  attachmentLimits,
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

  const hasLocalAgents = agents && Object.keys(agents).length > 0;

  if (!runtimeUrl && !hasLocalAgents) {
    const message =
      "Missing required prop: 'runtimeUrl' or 'agents__unsafe_dev_only'";
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    } else {
      console.warn(message);
    }
  }

  const chatApiEndpoint = runtimeUrl;

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
      headers: headers,
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
      onRenderToolCallsChanged: () => forceUpdate(),
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [ajora]);

  // Mirror the runtime connection status into React state. A single
  // subscription here replaces one-per-consumer subscriptions inside
  // `useAjora()`; with ~8-14 hooks pulling the context on a typical screen,
  // that change collapses tens of forceUpdates per status transition into a
  // single context-driven render pass.
  const [runtimeConnectionStatus, setRuntimeConnectionStatus] =
    useState<AjoraCoreRuntimeConnectionStatus>(
      () => ajora.runtimeConnectionStatus,
    );

  useEffect(() => {
    // Sync once in case the status changed between construction and mount.
    setRuntimeConnectionStatus(ajora.runtimeConnectionStatus);
    const subscription = ajora.subscribe({
      onRuntimeConnectionStatusChanged: ({ status }) => {
        setRuntimeConnectionStatus(status);
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
    ajora.setHeaders(headers);
    ajora.setProperties(properties);
    ajora.setAgents__unsafe_dev_only(agents);
  }, [chatApiEndpoint, headers, properties, agents, useSingleEndpoint]);

  const attachmentsEnabled = !!uploadAttachment;

  const contextValue = useMemo<AjoraContextValue>(
    () => ({
      ajora,
      executingToolCallIds,
      runtimeConnectionStatus,
      uploadAttachment,
      attachmentLimits,
      attachmentsEnabled,
    }),
    [
      ajora,
      executingToolCallIds,
      runtimeConnectionStatus,
      uploadAttachment,
      attachmentLimits,
      attachmentsEnabled,
    ],
  );

  return (
    <AjoraContext.Provider value={contextValue}>
      {children}
    </AjoraContext.Provider>
  );
};

export const useAjora = (): AjoraContextValue => {
  const context = useContext(AjoraContext);
  if (!context) {
    throw new Error("useAjora must be used within AjoraProvider");
  }
  // Runtime-status-driven re-renders now flow through context (the provider
  // subscribes once and updates state). Consumers just read context — no
  // per-hook subscription needed.
  return context;
};
