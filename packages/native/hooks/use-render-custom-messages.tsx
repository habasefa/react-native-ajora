import { useAjora } from "../providers/AjoraProvider";
import { useAjoraChatConfiguration } from "../providers/AjoraChatConfigurationProvider";
import { ReactCustomMessageRendererPosition } from "../types";
import { Message } from "@ag-ui/core";
import React from "react";

interface UseRenderCustomMessagesParams {
  message: Message;
  position: ReactCustomMessageRendererPosition;
}

export function useRenderCustomMessages() {
  const { ajora } = useAjora();
  const config = useAjoraChatConfiguration();

  if (!config) {
    return null;
  }

  const { agentId, threadId } = config;

  const customMessageRenderers = ajora.renderCustomMessages
    .filter(
      (renderer) =>
        renderer.agentId === undefined || renderer.agentId === agentId
    )
    .sort((a, b) => {
      const aHasAgent = a.agentId !== undefined;
      const bHasAgent = b.agentId !== undefined;
      if (aHasAgent === bHasAgent) return 0;
      return aHasAgent ? -1 : 1;
    });

  return function (params: UseRenderCustomMessagesParams) {
    if (!customMessageRenderers.length) {
      return null;
    }
    const { message, position } = params;
    const runId = ajora.getRunIdForMessage(agentId, threadId, message.id)!;
    const agent = ajora.getAgent(agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    const messagesIdsInRun = agent.messages
      .filter(
        (msg) => ajora.getRunIdForMessage(agentId, threadId, msg.id) === runId
      )
      .map((msg) => msg.id);

    const messageIndex =
      agent.messages.findIndex((msg) => msg.id === message.id) ?? 0;
    const messageIndexInRun = Math.max(messagesIdsInRun.indexOf(message.id), 0);
    const numberOfMessagesInRun = messagesIdsInRun.length;
    const stateSnapshot = ajora.getStateByRun(agentId, threadId, runId);

    let result = null;
    for (const renderer of customMessageRenderers) {
      if (!renderer.render) {
        continue;
      }
      const Component = renderer.render;
      result = (
        <Component
          key={`${runId}-${message.id}-${position}`}
          message={message}
          position={position}
          runId={runId}
          messageIndex={messageIndex}
          messageIndexInRun={messageIndexInRun}
          numberOfMessagesInRun={numberOfMessagesInRun}
          agentId={agentId}
          stateSnapshot={stateSnapshot}
        />
      );
      if (result) {
        break;
      }
    }
    return result;
  };
}
