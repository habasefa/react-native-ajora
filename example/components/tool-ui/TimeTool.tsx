import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { ToolRequest, ToolResponse } from "../../../src/Tool/types";

interface TimeToolProps {
  request: ToolRequest;
  onResponse?: (response: ToolResponse) => void;
}

const TimeTool: React.FC<TimeToolProps> = ({ request, onResponse }) => {
  const [timeData, setTimeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { tool } = request;
  const { timezone = "UTC", format = "12h" } = tool.args || {};

  const getCurrentTime = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call - in real implementation, you'd call an actual time API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const now = new Date();

      // Format time based on requested format
      const timeOptions: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: format === "12h",
      };

      const dateOptions: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };

      const formattedTime = now.toLocaleTimeString("en-US", timeOptions);
      const formattedDate = now.toLocaleDateString("en-US", dateOptions);

      // For timestamp, just use current time
      const timeInTimezone = now;

      const timeInfo = {
        timezone: timezone,
        time: formattedTime,
        date: formattedDate,
        format: format,
        timestamp: timeInTimezone.getTime(),
        utcOffset: timeInTimezone.getTimezoneOffset(),
        description: `Current time in ${timezone}`,
      };

      setTimeData(timeInfo);

      // Send response back
      if (onResponse && request) {
        onResponse({
          callId: request.callId,
          response: timeInfo,
        });
      }
    } catch {
      setError("Failed to get current time");
      if (onResponse && request) {
        onResponse({
          callId: request.callId,
          response: { error: "Failed to get current time" },
        });
      }
    } finally {
      setLoading(false);
    }
  }, [timezone, format, request, onResponse]);

  useEffect(() => {
    if (request?.tool.name === "get_current_time") {
      // Use response data from the merged functionCall
      if (request.tool.response) {
        setTimeData(request.tool.response);
        setLoading(false);
      } else {
        setLoading(true);
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
          <Text style={styles.loadingText}>Getting time for {timezone}...</Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={getCurrentTime}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!timeData) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.timeCard}>
        <View style={styles.header}>
          <Text style={styles.timeIcon}>🕐</Text>
          <Text style={styles.timezoneText}>{timeData.timezone}</Text>
        </View>

        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{timeData.time}</Text>
          <Text style={styles.dateText}>{timeData.date}</Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>Format: {timeData.format}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>🌍</Text>
            <Text style={styles.detailText}>
              UTC Offset: {timeData.utcOffset}min
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{timeData.description}</Text>
      </View>
    </View>
  );
};

TimeTool.displayName = "get_current_time";
export default TimeTool;

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
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#dc2626",
    borderRadius: 6,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  timeCard: {
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
  timeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  timezoneText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  timeContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  timeText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
    fontFamily: "monospace",
  },
  dateText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  detailText: {
    fontSize: 12,
    color: "#6b7280",
  },
  description: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    fontStyle: "italic",
  },
});
