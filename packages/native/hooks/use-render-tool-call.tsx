import React, { useCallback, useMemo, useEffect, useReducer } from "react";
import { ToolCall, ToolMessage } from "@ag-ui/core";
import { ToolCallStatus } from "../../core";
import { useAjora } from "../providers/AjoraProvider";
import { useAjoraChatConfiguration } from "../providers/AjoraChatConfigurationProvider";
import { DEFAULT_AGENT_ID, partialJSONParse } from "../../shared";
import { ReactToolCallRenderer } from "../types";

export interface UseRenderToolCallProps {
  toolCall: ToolCall;
  toolMessage?: ToolMessage;
}

interface ToolCallRendererProps {
  toolCall: ToolCall;
  toolMessage?: ToolMessage;
  RenderComponent: ReactToolCallRenderer<unknown>["render"];
  isExecuting: boolean;
}

const ToolCallRenderer = React.memo(
  function ToolCallRenderer({
    toolCall,
    toolMessage,
    RenderComponent,
    isExecuting,
  }: ToolCallRendererProps) {
    const args = useMemo(
      () => partialJSONParse(toolCall.function.arguments),
      [toolCall.function.arguments]
    );

    const toolName = toolCall.function.name;

    if (toolMessage) {
      return (
        <RenderComponent
          name={toolName}
          args={args}
          status={ToolCallStatus.Complete}
          result={toolMessage.content}
        />
      );
    } else if (isExecuting) {
      return (
        <RenderComponent
          name={toolName}
          args={args}
          status={ToolCallStatus.Executing}
          result={undefined}
        />
      );
    } else {
      return (
        <RenderComponent
          name={toolName}
          args={args}
          status={ToolCallStatus.InProgress}
          result={undefined}
        />
      );
    }
  },
  (prevProps, nextProps) => {
    if (prevProps.toolCall.id !== nextProps.toolCall.id) return false;
    if (prevProps.toolCall.function.name !== nextProps.toolCall.function.name)
      return false;
    if (
      prevProps.toolCall.function.arguments !==
      nextProps.toolCall.function.arguments
    )
      return false;

    const prevResult = prevProps.toolMessage?.content;
    const nextResult = nextProps.toolMessage?.content;
    if (prevResult !== nextResult) return false;

    if (prevProps.isExecuting !== nextProps.isExecuting) return false;
    if (prevProps.RenderComponent !== nextProps.RenderComponent) return false;

    return true;
  }
);

export function useRenderToolCall() {
  const { ajora, executingToolCallIds } = useAjora();
  const config = useAjoraChatConfiguration();
  const agentId = config?.agentId ?? DEFAULT_AGENT_ID;

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

  const renderToolCalls = ajora.renderToolCalls;

  const renderToolCall = useCallback(
    ({
      toolCall,
      toolMessage,
    }: UseRenderToolCallProps): React.ReactElement | null => {
      const exactMatches = renderToolCalls.filter(
        (rc) => rc.name === toolCall.function.name
      );

      const renderConfig =
        exactMatches.find((rc) => rc.agentId === agentId) ||
        exactMatches.find((rc) => !rc.agentId) ||
        exactMatches[0] ||
        renderToolCalls.find((rc) => rc.name === "*");

      if (!renderConfig) {
        return null;
      }

      const RenderComponent = renderConfig.render;
      const isExecuting = executingToolCallIds.has(toolCall.id);

      return (
        <ToolCallRenderer
          key={toolCall.id}
          toolCall={toolCall}
          toolMessage={toolMessage}
          RenderComponent={RenderComponent}
          isExecuting={isExecuting}
        />
      );
    },
    [renderToolCalls, executingToolCallIds, agentId]
  );

  return renderToolCall;
}
