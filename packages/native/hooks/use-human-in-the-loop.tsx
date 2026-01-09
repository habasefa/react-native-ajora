import * as React from "react";
import { useCallback, useRef, useEffect } from "react";
import { useAjora } from "../providers/AjoraProvider";
import { useFrontendTool } from "./use-frontend-tool";
import {
  ReactFrontendTool,
  ReactToolCallRenderer,
  ReactHumanInTheLoop,
} from "../types";

export function useHumanInTheLoop<
  T extends Record<string, unknown> = Record<string, unknown>,
>(tool: ReactHumanInTheLoop<T>, deps?: ReadonlyArray<unknown>) {
  const { ajora } = useAjora();
  const resolvePromiseRef = useRef<((result: unknown) => void) | null>(null);

  const respond = useCallback(async (result: unknown) => {
    if (resolvePromiseRef.current) {
      resolvePromiseRef.current(result);
      resolvePromiseRef.current = null;
    }
  }, []);

  const handler = useCallback(async () => {
    return new Promise((resolve) => {
      resolvePromiseRef.current = resolve;
    });
  }, []);

  const RenderComponent: ReactToolCallRenderer<T>["render"] = useCallback(
    (props) => {
      const ToolComponent = tool.render;

      if (!ToolComponent) {
        return null;
      }

      // Enhance props based on current status
      if (props.status === "inProgress") {
        const enhancedProps = {
          ...props,
          name: tool.name,
          description: tool.description || "",
          respond: undefined,
        };
        return React.createElement(ToolComponent, enhancedProps);
      } else if (props.status === "executing") {
        const enhancedProps = {
          ...props,
          name: tool.name,
          description: tool.description || "",
          respond,
        };
        return React.createElement(ToolComponent, enhancedProps);
      } else if (props.status === "complete") {
        const enhancedProps = {
          ...props,
          name: tool.name,
          description: tool.description || "",
          respond: undefined,
        };
        return React.createElement(ToolComponent, enhancedProps);
      }

      // Fallback - just render with original props
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return React.createElement(ToolComponent, props as any);
    },
    [tool.render, tool.name, tool.description, respond]
  );

  const frontendTool: ReactFrontendTool<T> = {
    ...tool,
    handler,
    render: RenderComponent,
  };

  useFrontendTool(frontendTool, deps);

  // Human-in-the-loop tools should remove their renderer on unmount
  // since they can't respond to user interactions anymore
  useEffect(() => {
    return () => {
      const keyOf = (rc: ReactToolCallRenderer<any>) =>
        `${rc.agentId ?? ""}:${rc.name}`;
      const currentRenderToolCalls =
        ajora.renderToolCalls as ReactToolCallRenderer<any>[];
      const filtered = currentRenderToolCalls.filter(
        (rc) =>
          keyOf(rc) !== keyOf({ name: tool.name, agentId: tool.agentId } as any)
      );
      ajora.setRenderToolCalls(filtered);
    };
  }, [ajora, tool.name, tool.agentId]);
}
