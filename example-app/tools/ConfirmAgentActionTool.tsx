import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { ToolRequest, ToolResponse } from "../../src/Tool/types";
import { UserEvent } from "../../src/api";
import Color from "../../src/Color";
import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";

// Get responsive card width (80% of screen width, max 400px, min 280px)
const getCardWidth = () => {
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth * 0.8;
  return Math.min(Math.max(cardWidth, 280), 400);
};

interface UserConfirmToolProps {
  request: ToolRequest;
  onResponse?: (response: ToolResponse) => void;
  submitQuery?: (query: UserEvent) => Promise<void>;
}

const UserConfirmCard = ({
  message,
  handleConfirm,
}: {
  message: string;
  handleConfirm: (isConfirmed: boolean) => void;
}) => {
  const styles = createStyles();

  return (
    <View style={styles.container}>
      <View style={styles.confirmCard}>
        <View style={styles.header}>
          <MaterialIcons name="person" size={20} color={Color.cardForeground} />
          <Text style={styles.confirmTitle}>User Confirmation Required</Text>
        </View>

        <Text style={styles.messageText}>{message}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => handleConfirm(false)}
          >
            <Text style={styles.cancelButtonText}>No</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={() => handleConfirm(true)}
          >
            <Text style={styles.confirmButtonText}>Yes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const UserConfirmTool: React.FC<UserConfirmToolProps> = ({
  request,
  onResponse,
  submitQuery,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const styles = createStyles();

  const { tool } = request;
  const { message = "Please confirm this action" } = tool.args || {};

  const handleConfirm = useCallback(
    async (isConfirmed: boolean) => {
      setLoading(true);
      setError(null);

      try {
        const result = {
          confirmed: isConfirmed,
          message: isConfirmed
            ? "User confirmed the action"
            : "User cancelled the action",
          timestamp: new Date().toISOString(),
        };

        setConfirmed(isConfirmed);

        // Send response back to the server
        if (submitQuery) {
          await submitQuery({
            type: "function_response",
            message: {
              _id: request.callId,
              role: "user",
              thread_id: "",
              parts: [
                {
                  functionResponse: {
                    name: "user_confirm_action",
                    response: result,
                  },
                },
              ],
              created_at: new Date().toISOString(),
            },
          });
        }

        // Also call the onResponse callback if provided
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
    [request, onResponse, submitQuery]
  );

  useEffect(() => {
    if (request?.tool.name === "user_confirm_action") {
      // Use response data from the merged functionCall
      if (request.tool.response) {
        const responseData = request.tool.response;

        // Handle the new response format with output and error fields
        if (responseData.error) {
          setError(responseData.error);
          setLoading(false);
          return;
        }

        // Handle the response data - could be in output field or directly in response
        const confirmationData = responseData.output || responseData;
        setConfirmed(confirmationData.confirmed);
        setLoading(false);
        setError(null);
      } else {
        setLoading(false);
        setError(null);
      }
    }
  }, [request]);

  if (!request) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No request provided</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.confirmCard}>
          <View style={styles.header}>
            <ActivityIndicator size="small" color={Color.primary} />
            <Text style={styles.confirmTitle}>Processing...</Text>
          </View>
          <Text style={styles.messageText}>
            Please wait while we process your confirmation.
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.header}>
            <MaterialIcons
              name="error-outline"
              size={20}
              color={Color.destructive}
            />
            <Text style={styles.confirmTitle}>Error</Text>
          </View>
          <Text style={styles.messageText}>{error}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setError(null);
                setConfirmed(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (confirmed !== null) {
    return (
      <View style={styles.container}>
        <View style={styles.resultCard}>
          <View style={styles.header}>
            <MaterialIcons
              name={confirmed ? "check-circle" : "cancel"}
              size={20}
              color={confirmed ? Color.primary : Color.destructive}
            />
            <Text style={styles.confirmTitle}>
              {confirmed ? "Action Confirmed" : "Action Cancelled"}
            </Text>
          </View>
          <Text style={styles.messageText}>
            {confirmed
              ? "You have confirmed this action."
              : "You have cancelled this action."}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setConfirmed(null);
                setError(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return <UserConfirmCard message={message} handleConfirm={handleConfirm} />;
};

UserConfirmTool.displayName = "user_confirm_action";
export default UserConfirmTool;

const createStyles = () => {
  const cardWidth = getCardWidth();

  return StyleSheet.create({
    container: {
      marginVertical: 8,
    },
    errorContainer: {
      width: cardWidth,
      padding: 16,
      backgroundColor: Color.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Color.destructive,
      alignItems: "center",
      shadowColor: Color.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    errorText: {
      fontSize: 14,
      color: Color.destructive,
      textAlign: "center",
    },
    confirmCard: {
      width: cardWidth,
      backgroundColor: Color.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: Color.border,
      shadowColor: Color.shadow,
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
      gap: 8,
    },
    confirmTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: Color.cardForeground,
    },
    messageText: {
      fontSize: 14,
      color: Color.mutedForeground,
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
      backgroundColor: Color.secondary,
      borderWidth: 1,
      borderColor: Color.border,
    },
    confirmButton: {
      backgroundColor: Color.primary,
    },
    cancelButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: Color.secondaryForeground,
    },
    confirmButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: Color.primaryForeground,
    },
    resultCard: {
      width: cardWidth,
      backgroundColor: Color.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: Color.border,
      alignItems: "center",
      shadowColor: Color.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    resultText: {
      fontSize: 16,
      fontWeight: "600",
      color: Color.cardForeground,
    },
  });
};
