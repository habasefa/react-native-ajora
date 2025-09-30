import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { ToolRequest, ToolResponse } from "../Tool/types";
import { UserEvent } from "../api";

interface DocSearchToolProps {
  request: ToolRequest;
  onResponse?: (response: ToolResponse) => void;
  submitQuery?: (query: UserEvent) => Promise<void>;
}

const DocSearchTool: React.FC<DocSearchToolProps> = ({
  request,
  onResponse,
  submitQuery: _submitQuery,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styles = createStyles();

  const { tool } = request;
  const rawQuery = (tool.args || {}).query;
  const queryArray: string[] = Array.isArray(rawQuery)
    ? rawQuery.filter(Boolean).map(String)
    : rawQuery != null
      ? [String(rawQuery)]
      : [];
  const queryString = queryArray.join(" ");

  const performSearch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Server performs the actual search; this enables Retry UX and status update
      if (onResponse && request) {
        onResponse({
          callId: request.callId,
          response: { error: "Search request sent to server" },
        });
      }
    } catch {
      setError("Failed to search documents");
      if (onResponse && request) {
        onResponse({
          callId: request.callId,
          response: { error: "Failed to search documents" },
        });
      }
    } finally {
      setLoading(false);
    }
  }, [request, onResponse]);

  useEffect(() => {
    if (request?.tool.name === "search_document") {
      if (request.tool.response) {
        const serverResponse = request.tool.response;
        if (serverResponse.error) {
          setError(serverResponse.error);
          setLoading(false);
          return;
        }
        // Even with a valid response, we keep the UI minimal (no results list)
        setLoading(false);
        setError(null);
      } else {
        setLoading(true);
        setError(null);
      }
    }
  }, [request]);

  if (!request) {
    return null;
  }

  if (error && !request.tool.response) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={performSearch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isSearching = loading && !request.tool.response;

  return (
    <View style={styles.container}>
      <View style={styles.loadingContainerSearched}>
        <Text style={styles.loadingTextSearched}>
          <Text style={{ fontWeight: "bold" }}>
            {isSearching ? "Searching for" : "Searched for"}
          </Text>{" "}
          "{queryString}"...
        </Text>
      </View>
    </View>
  );
};

DocSearchTool.displayName = "search_document";
export default DocSearchTool;

// Get responsive card width similar to WebSearchTool
const getCardWidth = () => {
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth * 0.9;
  return Math.min(Math.max(cardWidth, 280), 400);
};

const createStyles = () => {
  const cardWidth = getCardWidth();

  return StyleSheet.create({
    container: {
      // marginVertical: 8,
    },
    loadingContainerSearched: {
      width: cardWidth,
      gap: 10,
      padding: 16,
      backgroundColor: "#f8f9fa",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#e2e8f0",
    },
    loadingTextSearched: {
      fontSize: 14,
      color: "#6b7280",
    },
    errorContainer: {
      width: cardWidth,
      padding: 16,
      backgroundColor: "#fef2f2",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#fecaca",
      alignItems: "center",
    },
    errorText: {
      fontSize: 14,
      color: "#dc2626",
      textAlign: "center",
      marginTop: 8,
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
  });
};
