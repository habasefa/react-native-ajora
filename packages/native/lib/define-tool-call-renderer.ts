import React from "react";
import { z } from "zod";
import { ReactToolCallRenderer } from "../types";
import { ToolCallStatus } from "../../core";

type RenderProps<T> =
  | {
      name: string;
      args: Partial<T>;
      status: ToolCallStatus.InProgress;
      result: undefined;
    }
  | {
      name: string;
      args: T;
      status: ToolCallStatus.Executing;
      result: undefined;
    }
  | {
      name: string;
      args: T;
      status: ToolCallStatus.Complete;
      result: string;
    };

export function defineToolCallRenderer(def: {
  name: "*";
  render: (props: RenderProps<any>) => React.ReactElement;
  agentId?: string;
}): ReactToolCallRenderer<any>;

export function defineToolCallRenderer<S extends z.ZodTypeAny>(def: {
  name: string;
  args: S;
  render: (props: RenderProps<z.infer<S>>) => React.ReactElement;
  agentId?: string;
}): ReactToolCallRenderer<z.infer<S>>;

export function defineToolCallRenderer<S extends z.ZodTypeAny>(def: {
  name: string;
  args?: S;
  render: (props: any) => React.ReactElement;
  agentId?: string;
}): ReactToolCallRenderer<any> {
  const argsSchema = def.name === "*" && !def.args ? z.any() : def.args;

  return {
    name: def.name,
    args: argsSchema as any,
    render: def.render as React.ComponentType<any>,
    ...(def.agentId ? { agentId: def.agentId } : {}),
  };
}
