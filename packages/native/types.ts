import React from "react";
import { z } from "zod";
import { FrontendTool, ToolCallStatus } from "../core";
import { AbstractAgent } from "@ag-ui/client";

export interface ReactToolCallRenderer<T> {
  name: string;
  args: z.ZodSchema<T>;
  agentId?: string;
  render: React.ComponentType<
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
      }
  >;
}

export interface ReactFrontendTool<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends FrontendTool<T> {
  render?: ReactToolCallRenderer<T>["render"];
}

export interface ReactActivityMessageRenderer<T> {
  activityType: string;
  agentId?: string;
  content: z.Schema<T>;
  render: React.ComponentType<{
    activityType: string;
    content: T;
    message: any;
    agent?: AbstractAgent;
  }>;
}

export type ReactCustomMessageRendererPosition = "before" | "after";

export interface ReactCustomMessageRenderer {
  agentId?: string;
  render?: React.ComponentType<any>;
}

export interface ReactHumanInTheLoop<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends ReactFrontendTool<T> {}
