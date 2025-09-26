import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { ToolRequest, ToolResponse } from "../Tool/types";
import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";

// Get responsive card width (80% of screen width, max 400px, min 280px)
const getCardWidth = () => {
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth * 0.9;
  return Math.min(Math.max(cardWidth, 280), 400);
};

interface WebSearchToolProps {
  request: ToolRequest;
  onResponse?: (response: ToolResponse) => void;
}

const WebSearchTool: React.FC<WebSearchToolProps> = ({
  request,
  onResponse,
}) => {
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styles = createStyles();

  const { tool } = request;
  const { query = [] } = tool.args || {};

  const performSearch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // The actual search is performed by the server, we just need to wait for the response
      // This function is mainly for retry functionality
      if (onResponse && request) {
        onResponse({
          callId: request.callId,
          response: { error: "Search request sent to server" },
        });
      }
    } catch {
      setError("Failed to perform web search");
      if (onResponse && request) {
        onResponse({
          callId: request.callId,
          response: { error: "Failed to perform web search" },
        });
      }
    } finally {
      setLoading(false);
    }
  }, [request, onResponse]);

  useEffect(() => {
    if (request?.tool.name === "search_web") {
      // Use response data from the merged functionCall
      if (request.tool.response) {
        // Transform the server response to match the expected format
        const serverResponse = request.tool.response;
        const transformedResults = {
          query: query.join(" "),
          results: serverResponse.output || [],
          totalResults: serverResponse.output?.length || 0,
          searchTime: "0.45s", // Default value since server doesn't provide this
        };
        setSearchResults(transformedResults);
        setLoading(false);
        setError(null);
      } else {
        setLoading(true);
        setError(null);
      }
    }
  }, [request, query]);

  if (!request) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No request provided</Text>
      </View>
    );
  }

  if (loading && !request.tool.response) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>
            Searching for "{query.join(" ")}"...
          </Text>
        </View>
      </View>
    );
  }

  if (error && !request.tool.response) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={24} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={performSearch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!searchResults) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.loadingContainer}>
        <MaterialIcons name="search" size={20} color="#374151" />
        <Text style={styles.loadingText}>
          Searched for "{query.join(" ")}"...
        </Text>
      </View>
    </View>
  );

  // return (
  //   <View style={styles.container}>
  //     <View style={styles.searchCard}>
  //       <View style={styles.header}>
  //         <MaterialIcons name="search" size={20} color="#374151" />
  //         <Text style={styles.searchTitle}>Web Search Results</Text>
  //         {request.tool.response && (
  //           <View style={styles.completedIndicator}>
  //             <MaterialIcons name="check" size={12} color="#ffffff" />
  //             <Text style={styles.completedText}>Done</Text>
  //           </View>
  //         )}
  //       </View>

  //       <View style={styles.queryContainer}>
  //         <Text style={styles.queryText}>"{searchResults.query}"</Text>
  //         <Text style={styles.metaText}>
  //           {searchResults.totalResults} results in {searchResults.searchTime}
  //         </Text>
  //       </View>

  //       <ScrollView
  //         style={styles.resultsContainer}
  //         showsVerticalScrollIndicator={false}
  //       >
  //         {searchResults.results.map((result: any, index: number) => (
  //           <View key={index} style={styles.resultItem}>
  //             <Text style={styles.resultTitle} numberOfLines={2}>
  //               {result.title}
  //             </Text>
  //             <Text style={styles.resultUrl} numberOfLines={1}>
  //               {result.url}
  //             </Text>
  //             <Text style={styles.resultSnippet} numberOfLines={3}>
  //               {result.description || result.snippet}
  //             </Text>
  //           </View>
  //         ))}
  //       </ScrollView>
  //     </View>
  //   </View>
  // );
};

WebSearchTool.displayName = "search_web";
export default WebSearchTool;

const createStyles = () => {
  const cardWidth = getCardWidth();

  return StyleSheet.create({
    container: {
      // marginVertical: 8,
    },
    loadingContainer: {
      width: cardWidth,
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
    searchCard: {
      width: cardWidth,
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
      gap: 8,
    },
    searchTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#374151",
      flex: 1,
    },
    completedIndicator: {
      backgroundColor: "#10b981",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    completedText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#ffffff",
    },
    queryContainer: {
      marginBottom: 16,
    },
    queryText: {
      fontSize: 14,
      fontWeight: "500",
      color: "#1f2937",
      marginBottom: 4,
    },
    metaText: {
      fontSize: 12,
      color: "#6b7280",
    },
    resultsContainer: {
      maxHeight: 200,
    },
    resultItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#f3f4f6",
    },
    resultTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: "#1e40af",
      marginBottom: 4,
    },
    resultUrl: {
      fontSize: 12,
      color: "#059669",
      marginBottom: 4,
    },
    resultSnippet: {
      fontSize: 13,
      color: "#4b5563",
      lineHeight: 18,
    },
  });
};
