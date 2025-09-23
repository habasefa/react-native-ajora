import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { ToolRequest, ToolResponse } from "../Tool/types";

interface ConfirmToolProps {
  request: ToolRequest;
  onResponse?: (response: ToolResponse) => void;
}

const ConfirmTool: React.FC<ConfirmToolProps> = ({ request, onResponse }) => {
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { tool } = request;
  const { message = "Please confirm this action" } = tool.args || {};

  const handleConfirm = useCallback(
    async (isConfirmed: boolean) => {
      setLoading(true);
      setError(null);

      try {
        // Simulate processing
        await new Promise((resolve) => setTimeout(resolve, 500));

        const result = {
          confirmed: isConfirmed,
          message: isConfirmed ? "Action confirmed" : "Action cancelled",
          timestamp: new Date().toISOString(),
        };

        setConfirmed(isConfirmed);

        // Send response back
        if (onResponse && request) {
          onResponse({
            callId: request.callId,
            response: result,
          });
        }
      } catch {
        setError("Failed to process confirmation");
        if (onResponse && request) {
          onResponse({
            callId: request.callId,
            response: { error: "Failed to process confirmation" },
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [request, onResponse]
  );

  useEffect(() => {
    if (request?.tool.name === "confirm_action") {
      // Use response data from the merged functionCall
      if (request.tool.response) {
        setConfirmed(request.tool.response.confirmed);
        setLoading(false);
      } else {
        setLoading(false);
        setError(null);
      }
    }
  }, [request]);

  if (!request) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No request provided</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Processing confirmation...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (confirmed !== null) {
    return (
      <View style={styles.container}>
        <View style={styles.resultCard}>
          <Text style={styles.resultIcon}>{confirmed ? "✅" : "❌"}</Text>
          <Text style={styles.resultText}>
            {confirmed ? "Confirmed" : "Cancelled"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.confirmCard}>
        <View style={styles.header}>
          <Text style={styles.confirmIcon}>❓</Text>
          <Text style={styles.confirmTitle}>Confirmation Required</Text>
        </View>

        <Text style={styles.messageText}>{message}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => handleConfirm(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={() => handleConfirm(true)}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

ConfirmTool.displayName = "confirm_action";
export default ConfirmTool;

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  errorContainer: {
    padding: 16,
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    alignItems: "center",
  },
  errorIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#dc2626",
    textAlign: "center",
  },
  confirmCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  confirmIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  messageText: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  confirmButton: {
    backgroundColor: "#007AFF",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  resultCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  resultIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
});
