import React from "react";
import { View, Text } from "react-native";
import { IMessage } from "../types";
import { MessageToolCallProps } from "./types";
import styles from "./styles";

export function MessageToolCall<TMessage extends IMessage = IMessage>({
  currentMessage = {} as TMessage,
  position = "left",
  containerStyle,
  renderTools,
}: MessageToolCallProps<TMessage>) {
  // Find tool call parts in the message
  const toolCallParts =
    currentMessage.parts?.filter((part) => part.functionCall) || [];
  const toolResponseParts =
    currentMessage.parts?.filter((part) => part.functionResponse) || [];

  if (toolCallParts.length === 0 && toolResponseParts.length === 0) {
    return null;
  }

  // If custom tools are provided, let the parent handle rendering
  if (renderTools && toolCallParts.length > 0) {
    return null; // Parent will handle rendering via Bubble component
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

        // Create tool request for potential future use
        // const toolRequest: ToolRequest = {
        //   callId: toolCall.id || `call_${index}`,
        //   tool: {
        //     name: toolCall.name || "unknown",
        //     description: `Tool: ${toolCall.name || "unknown"}`,
        //     args: toolCall.args || {},
        //   },
        // };

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
