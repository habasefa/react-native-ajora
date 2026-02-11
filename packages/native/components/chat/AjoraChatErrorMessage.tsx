import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";

export interface AjoraChatErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function AjoraChatErrorMessage({
  message,
  onRetry,
}: AjoraChatErrorMessageProps) {
  const theme = useAjoraTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: theme.colors.error + "20", // 20% opacity
            borderColor: theme.colors.error,
          },
        ]}
      >
        <View style={styles.contentContainer}>
          <Ionicons
            name="alert-circle"
            size={20}
            color={theme.colors.error}
            style={styles.icon}
          />
          <Text
            style={[
              styles.text,
              { color: theme.colors.text || "#000000" }, // Fallback color
            ]}
          >
            {message || "Error"}
          </Text>
        </View>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <Text style={[styles.retryText, { color: theme.colors.error }]}>
              Try again
            </Text>
            <Ionicons name="refresh" size={16} color={theme.colors.error} />
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
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    maxWidth: "85%",
    minWidth: 100, // Ensure it's not too small
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
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
