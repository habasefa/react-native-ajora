import { ActivityMessage } from "@ag-ui/core";
import { DEFAULT_AGENT_ID } from "@ajora-ai/shared";
import { useAjora } from "../providers/AjoraProvider";
import { useAjoraChatConfiguration } from "../providers/AjoraChatConfigurationProvider";
import React, { useCallback } from "react";

export function useRenderActivityMessage() {
  const { ajora } = useAjora();
  const config = useAjoraChatConfiguration();
  const agentId = config?.agentId ?? DEFAULT_AGENT_ID;

  const renderers = ajora.renderActivityMessages;

  return useCallback(
    (message: ActivityMessage): React.ReactElement | null => {
      if (!renderers.length) {
        return null;
      }

      const matches = renderers.filter(
        (renderer) => renderer.activityType === message.activityType
      );

      const renderer =
        matches.find((candidate) => candidate.agentId === agentId) ??
        matches.find((candidate) => candidate.agentId === undefined) ??
        renderers.find((candidate) => candidate.activityType === "*");

      if (!renderer) {
        return null;
      }

      const parseResult = renderer.content.safeParse(message.content);

      if (!parseResult.success) {
        console.warn(
          `Failed to parse content for activity message '${message.activityType}':`,
          parseResult.error
        );
        return null;
      }

      const Component = renderer.render;

      const agent = ajora.getAgent(agentId);

      return (
        <Component
          key={message.id}
          activityType={message.activityType}
          content={parseResult.data}
          message={message}
          agent={agent}
        />
      );
    },
    [agentId, ajora, renderers]
  );
}
