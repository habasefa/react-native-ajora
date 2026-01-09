import { useAjora } from "../providers/AjoraProvider";
import { useEffect, useMemo } from "react";

export type JsonSerializable =
  | string
  | number
  | boolean
  | null
  | JsonSerializable[]
  | { [key: string]: JsonSerializable };

export interface AgentContextInput {
  description: string;
  value: JsonSerializable;
}

export function useAgentContext(context: AgentContextInput) {
  const { description, value } = context;
  const { ajora } = useAjora();

  const stringValue = useMemo(() => {
    if (typeof value === "string") {
      return value;
    }
    return JSON.stringify(value);
  }, [value]);

  useEffect(() => {
    if (!ajora) return;

    const id = ajora.addContext({ description, value: stringValue });
    return () => {
      ajora.removeContext(id);
    };
  }, [description, stringValue, ajora]);
}
