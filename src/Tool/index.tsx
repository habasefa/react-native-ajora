import React from "react";
import { View, Text } from "react-native";
import { IMessage } from "../types";
import { MessageToolCallProps } from "./types";
import styles from "./styles";
import {
  TodoListTool,
  DocSearchTool,
  nativeTools,
  WebSearchTool,
} from "../nativeTools";
import { useChatContext } from "../AjoraContext";

export function MessageToolCall<TMessage extends IMessage = IMessage>({
  currentMessage = {} as TMessage,
  position = "left",
  containerStyle,
  tools,
}: MessageToolCallProps<TMessage>) {
  const { ajora } = useChatContext();
  const submitQuery = ajora?.submitQuery;

  // Find tool call parts in the message
  const toolCallParts =
    currentMessage.parts?.filter((part) => part.functionCall) || [];
  const toolResponseParts =
    currentMessage.parts?.filter((part) => part.functionResponse) || [];

  if (toolCallParts.length === 0 && toolResponseParts.length === 0) {
    return null;
  }

  // Process each tool call part
  return toolCallParts.map((part, index) => {
    const toolCall = part.functionCall;
    if (!toolCall) return null;

    const toolName = toolCall.name || "";

    // Create a tool request object
    const toolRequest = {
      callId: toolCall.id || `call_${index}`,
      tool: {
        name: toolName,
        description: `Tool: ${toolName}`,
        args: toolCall.args || {},
        response: toolCall.response,
      },
    };

    // Check if it's a native tool first
    if (nativeTools.includes(toolName)) {
      // Look for function response in the current message parts
      const functionResponsePart = currentMessage.parts?.find(
        (part) => part.functionResponse
      );
      const functionResponse = functionResponsePart?.functionResponse;

      // Update tool request with response data
      toolRequest.tool.response =
        functionResponse?.response || toolCall.response;

      switch (toolName) {
        case "todo_list":
          return (
            <TodoListTool
              key={`tool-${index}`}
              message={currentMessage}
              request={toolRequest}
              submitQuery={submitQuery}
            />
          );

        case "search_web":
          return (
            <WebSearchTool
              key={`tool-${index}`}
              message={currentMessage}
              request={toolRequest}
              submitQuery={submitQuery}
            />
          );
        case "search_document":
          return (
            <DocSearchTool
              key={`tool-${index}`}
              message={currentMessage}
              request={toolRequest}
              submitQuery={submitQuery}
            />
          );
        default:
          return null;
      }
    }

    // Check if we have custom tool UI components available
    if (tools) {
      const customTools = tools();

      // Try to find a matching custom tool component
      const matchingTool = customTools?.find((toolComponent: any) => {
        // Check if the tool component matches the tool name
        if (React.isValidElement(toolComponent)) {
          return (
            toolComponent?.key === toolName ||
            (toolComponent?.props as any)?.toolName === toolName
          );
        } else {
          // Handle component classes
          return (
            (toolComponent as any)?.name === toolName ||
            (toolComponent as any)?.displayName === toolName
          );
        }
      });

      if (matchingTool) {
        if (React.isValidElement(matchingTool)) {
          // Clone the element with the tool request props
          return React.cloneElement(matchingTool as React.ReactElement<any>, {
            key: `tool-${index}`,
            message: currentMessage,
            request: toolRequest,
            submitQuery,
            onResponse: () => {
              // Handle tool response if needed
            },
          });
        } else {
          // Create element from component class
          const ToolComponent =
            matchingTool as unknown as React.ComponentType<any>;
          return (
            <ToolComponent
              key={`tool-${index}`}
              message={currentMessage}
              request={toolRequest}
              submitQuery={submitQuery}
              onResponse={() => {
                // Handle tool response if needed
              }}
            />
          );
        }
      }
    }

    // If no custom tool found and not a native tool, return null
    return null;
  });
}
