import * as React from "react";
import { useRenderToolCall } from "../../hooks/use-render-tool-call";
import { AssistantMessage, Message, ToolMessage } from "@ag-ui/core";

export type AjoraChatToolCallsViewProps = {
  message: AssistantMessage;
  messages?: Message[];
};

export function AjoraChatToolCallsView({
  message,
  messages = [],
}: AjoraChatToolCallsViewProps) {
  const renderToolCall = useRenderToolCall();

  if (!message.toolCalls || message.toolCalls.length === 0) {
    return null;
  }

  return (
    <React.Fragment>
      {message.toolCalls.map((toolCall) => {
        const toolMessage = messages.find(
          (m) => m.role === "tool" && m.toolCallId === toolCall.id
        ) as ToolMessage | undefined;

        return (
          <React.Fragment key={toolCall.id}>
            {renderToolCall({
              toolCall,
              toolMessage,
            })}
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
}

export default AjoraChatToolCallsView;
