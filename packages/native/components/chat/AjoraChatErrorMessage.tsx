import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";

import { AjoraChatError } from "../../types";

export interface AjoraChatErrorMessageProps {
  message: string | AjoraChatError;
  onRetry?: () => void;
}

export default function AjoraChatErrorMessage({
  message,
  onRetry,
}: AjoraChatErrorMessageProps) {
  const theme = useAjoraTheme();

  const formattedMessage = useMemo(() => {
    if (!message) return "An unexpected error occurred.";

    if (typeof message === "object" && message !== null) {
      if (message.type === "network") {
        return "Network error. Please check your connection and try again.";
      }
      return message.message || "An unexpected error occurred.";
    }

    try {
      const parsed = JSON.parse(message);
      if (typeof parsed === "object" && parsed !== null) {
        if (typeof parsed.message === "string") return parsed.message;
        if (typeof parsed.error === "string") return parsed.error;

        // If it's a JSON object but we don't know how to format it nicely, use a generic error
        console.warn(
          "AjoraChat: Received unhandled JSON error structure",
          parsed,
        );
        return "An unexpected error occurred. Please try again later.";
      }
    } catch (e) {
      // not JSON
    }

    // Check if the string itself is very long or looks like a raw stack trace/unformatted error
    if (
      message.length > 200 ||
      message.includes("Error:") ||
      message.includes("Exception:")
    ) {
      // If it looks like a stack trace, return generic
      if (message.includes(" at ") && message.includes(".js:")) {
        return "An unexpected error occurred. Please try again later.";
      }
    }

    return message;
  }, [message]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.contentContainer}>
          <Ionicons
            name="alert-circle"
            size={20}
            color={theme.colors.text}
            style={styles.icon}
          />
          <Text
            style={[
              styles.text,
              { color: theme.colors.text || "#000000" }, // Fallback color
            ]}
          >
            {formattedMessage}
          </Text>
        </View>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <Text style={[styles.retryText, { color: theme.colors.text }]}>
              Try again
            </Text>
            <Ionicons name="refresh" size={16} color={theme.colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 10,
    alignItems: "flex-start", // Left align like assistant messages
    width: "90%",
  },
  bubble: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    width: "100%",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "flex-start", // align icon with top line of text for long errors
    marginBottom: 4,
  },
  icon: {
    marginRight: 8,
    marginTop: 2, // adjust icon slightly to align with text
  },
  text: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
    fontFamily: "monospace", // use monospace for pretty-printed JSON if applicable
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    paddingTop: 4,
  },
  retryText: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
});
