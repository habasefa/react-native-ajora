import { useEffect } from "react";
import { useAjora } from "../providers/AjoraProvider";
import { ReactFrontendTool, ReactToolCallRenderer } from "../types";

const EMPTY_DEPS: ReadonlyArray<unknown> = [];

export function useFrontendTool<
  T extends Record<string, unknown> = Record<string, unknown>,
>(tool: ReactFrontendTool<T>, deps?: ReadonlyArray<unknown>) {
  const { ajora } = useAjora();
  const extraDeps = deps ?? EMPTY_DEPS;

  useEffect(() => {
    const name = tool.name;

    // Always register/override the tool for this name on mount
    if (ajora.getTool({ toolName: name, agentId: tool.agentId })) {
      console.warn(
        `Tool '${name}' already exists for agent '${tool.agentId || "global"}'. Overriding with latest registration.`,
      );
      ajora.removeTool(name, tool.agentId);
    }
    ajora.addTool(tool);

    // Register/override renderer by name and agentId through core
    if (tool.render) {
      // Get current render tool calls and merge with new entry
      const keyOf = (rc: ReactToolCallRenderer<any>) =>
        `${rc.agentId ?? ""}:${rc.name}`;
      const currentRenderToolCalls =
        ajora.renderToolCalls as ReactToolCallRenderer<any>[];

      // Build map from existing entries
      const mergedMap = new Map<string, ReactToolCallRenderer<any>>();
      for (const rc of currentRenderToolCalls) {
        mergedMap.set(keyOf(rc), rc);
      }

      // Add/overwrite with new entry
      const newEntry = {
        name,
        args: tool.parameters,
        agentId: tool.agentId,
        render: tool.render,
      } as ReactToolCallRenderer<any>;
      mergedMap.set(keyOf(newEntry), newEntry);

      // Set the merged list back
      ajora.setRenderToolCalls(Array.from(mergedMap.values()));
    }

    return () => {
      ajora.removeTool(name, tool.agentId);
      // we are intentionally not removing the render here so that the tools can still render in the chat history
    };
    // Depend on stable keys by default and allow callers to opt into
    // additional dependencies for dynamic tool configuration.
  }, [tool.name, ajora, extraDeps.length, ...extraDeps]);
}
