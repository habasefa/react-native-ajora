import React from "react";

export interface ToolCallSchema {
  name: string;
  description: string;
  args: any;
  response?: any; // Response data when merged with functionResponse
}

export interface ToolRequest {
  callId: string;
  tool: ToolCallSchema;
}

export interface ToolResponse {
  callId: string;
  response: any;
}

export type ToolUI = (
  request: ToolRequest,
  callback?: (response: ToolResponse) => void
) => React.ReactNode;

export interface Tool {
  tool: ToolCallSchema;
  component: ToolUI;
}

export interface MessageToolCallProps<TMessage = any> {
  currentMessage?: TMessage;
  position?: "left" | "right";
  containerStyle?: any;
  renderTools?: () => any[];
  onToolResponse?: (response: ToolResponse) => void;
}
