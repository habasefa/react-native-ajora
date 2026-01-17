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

    if (ajora.getTool({ toolName: name, agentId: tool.agentId })) {
      console.warn(
        `Tool '${name}' already exists for agent '${tool.agentId || "global"}'. Overriding with latest registration.`
      );
      ajora.removeTool(name, tool.agentId);
    }
    ajora.addTool(tool);

    if (tool.render) {
      const keyOf = (rc: ReactToolCallRenderer<any>) =>
        `${rc.agentId ?? ""}:${rc.name}`;
      const currentRenderToolCalls =
        ajora.renderToolCalls as ReactToolCallRenderer<any>[];

      const mergedMap = new Map<string, ReactToolCallRenderer<any>>();
      for (const rc of currentRenderToolCalls) {
        mergedMap.set(keyOf(rc), rc);
      }

      const newEntry = {
        name,
        args: tool.parameters,
        agentId: tool.agentId,
        render: tool.render,
      } as ReactToolCallRenderer<any>;
      mergedMap.set(keyOf(newEntry), newEntry);

      ajora.setRenderToolCalls(Array.from(mergedMap.values()));
    }

    return () => {
      ajora.removeTool(name, tool.agentId);
    };
  }, [tool.name, ajora, extraDeps.length, ...extraDeps]);
}
