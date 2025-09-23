import React from "react";
import { View, Text } from "react-native";
import { IMessage } from "../types";
import { MessageToolCallProps } from "./types";
import styles from "./styles";
import {
  ConfirmTool,
  TodoListTool,
  DocSearchTool,
  nativeTools,
  WebSearchTool,
} from "../nativeTools";

export function MessageToolCall<TMessage extends IMessage = IMessage>({
  currentMessage = {} as TMessage,
  position = "left",
  containerStyle,
  tools,
}: MessageToolCallProps<TMessage>) {
  // Find tool call parts in the message
  const toolCallParts =
    currentMessage.parts?.filter((part) => part.functionCall) || [];
  const toolResponseParts =
    currentMessage.parts?.filter((part) => part.functionResponse) || [];

  if (toolCallParts.length === 0 && toolResponseParts.length === 0) {
    return null;
  }

  // Check if we have custom tool UI components available
  if (tools && toolCallParts.length > 0) {
    const customTools = tools();
    return toolCallParts.map((part, index) => {
      const toolCall = part.functionCall;
      if (!toolCall) return null;

      // Create a tool request object for custom tool UI
      const toolRequest = {
        callId: toolCall.id || `call_${index}`,
        tool: {
          name: toolCall.name || "unknown",
          description: `Tool: ${toolCall.name || "unknown"}`,
          args: toolCall.args || {},
          response: toolCall.response, // Include response data if available
        },
      };

      // Try to find a matching custom tool component
      const matchingTool = customTools?.find((toolComponent: any) => {
        // Check if the tool component matches the tool name
        if (React.isValidElement(toolComponent)) {
          return (
            toolComponent?.key === toolCall.name ||
            (toolComponent?.props as any)?.toolName === toolCall.name
          );
        } else {
          // Handle component classes
          return (
            (toolComponent as any)?.name === toolCall.name ||
            (toolComponent as any)?.displayName === toolCall.name
          );
        }
      });

      if (matchingTool) {
        if (React.isValidElement(matchingTool)) {
          // Clone the element with the tool request props
          return React.cloneElement(matchingTool as React.ReactElement<any>, {
            key: `tool-${index}`,
            request: toolRequest,
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
              request={toolRequest}
              onResponse={() => {
                // Handle tool response if needed
              }}
            />
          );
        }
      }

      // Fallback to default tool call rendering
      return (
        <View key={`tool-${index}`} style={styles.container}>
          <View style={styles.argsContainer}>
            <Text style={styles.argsText}>
              🔧 {toolCall.name || "Unknown Tool"}
            </Text>
            {toolCall.args && Object.keys(toolCall.args).length > 0 && (
              <Text style={styles.argsSubText}>
                {JSON.stringify(toolCall.args, null, 2)}
              </Text>
            )}
          </View>
        </View>
      );
    });
  }

  // Check if the tools are native tools
  if (nativeTools.includes(toolCallParts[0].functionCall?.name || "")) {
    const toolName = toolCallParts[0].functionCall?.name || "";
    const toolRequest = {
      callId: toolCallParts[0].functionCall?.id || `call_${0}`,
      tool: {
        name: toolName,
        description: `Tool: ${toolName}`,
        args: toolCallParts[0].functionCall?.args || {},
      },
    };
    switch (toolName) {
      case "todo_list":
        return <TodoListTool request={toolRequest} />;
      case "confirm_action":
        return <ConfirmTool request={toolRequest} />;
      case "search_web":
        return <WebSearchTool request={toolRequest} />;
      case "search_document":
        return <DocSearchTool request={toolRequest} />;
      default:
        return null;
    }
  }

  return (
    <View
      style={[
        styles.container,
        position === "left" ? styles.leftContainer : styles.rightContainer,
        containerStyle?.[position],
      ]}
    >
      {toolCallParts.map((part, index) => {
        const toolCall = part.functionCall;
        if (!toolCall) return null;
        return (
          <View
            key={index}
            style={{ marginBottom: toolResponseParts.length > 0 ? 8 : 0 }}
          >
            <View style={styles.argsContainer}>
              <Text style={styles.argsText}>
                🔧 {toolCall.name || "Unknown Tool"}
              </Text>
              {toolCall.args && Object.keys(toolCall.args).length > 0 && (
                <Text style={styles.argsSubText}>
                  {JSON.stringify(toolCall.args, null, 2)}
                </Text>
              )}
            </View>
          </View>
        );
      })}

      {toolResponseParts.map((part, index) => {
        const toolResponse = part.functionResponse;
        if (!toolResponse) return null;

        return (
          <View key={`response-${index}`} style={styles.responseContainer}>
            <Text style={styles.responseText}>
              {toolResponse.response
                ? JSON.stringify(toolResponse.response, null, 2)
                : "No response"}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
