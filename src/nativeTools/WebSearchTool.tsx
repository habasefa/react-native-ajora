import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
} from "react-native-reanimated";
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
  const { query = "" } = tool.args || {};

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
        const serverResponse = request.tool.response;

        // Handle the new response format with output and error fields
        if (serverResponse.error) {
          setError(serverResponse.error);
          setLoading(false);
          return;
        }

        // Transform the server response to match the expected format
        const transformedResults = {
          query: query,
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

  const renderAvatarsGroup = () => {
    if (!searchResults?.results || searchResults.results.length === 0) {
      return <MaterialIcons name="search" size={20} color="#374151" />;
    }

    const avatars = searchResults.results
      .slice(0, 4) // Show max 4 avatars
      .map((result: any, index: number) => {
        const imgUrl = result.profile?.img;
        return (
          <View key={index} style={styles.avatarContainer}>
            {imgUrl ? (
              <Image
                source={{ uri: imgUrl }}
                style={styles.avatar}
                onError={() => {}}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <MaterialIcons name="public" size={12} color="#6b7280" />
              </View>
            )}
          </View>
        );
      });

    return (
      <View style={styles.avatarsGroup}>
        {avatars}
        {searchResults.results.length > 4 && (
          <View style={[styles.avatar, styles.avatarMore]}>
            <Text style={styles.avatarMoreText}>
              +{searchResults.results.length - 4}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const SearchingAnimation = () => {
    return (
      <View style={styles.searchingAnimation}>
        <SearchingDots />
      </View>
    );
  };

  const SearchingDots = () => {
    const dot1 = useSharedValue(0);
    const dot2 = useSharedValue(0);
    const dot3 = useSharedValue(0);

    useEffect(() => {
      const animateDots = () => {
        dot1.value = withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 200 })
        );
        dot2.value = withSequence(
          withTiming(0, { duration: 200 }),
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 200 })
        );
        dot3.value = withSequence(
          withTiming(0, { duration: 400 }),
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 200 })
        );
      };

      const interval = setInterval(animateDots, 600);
      return () => clearInterval(interval);
    }, []);

    const dot1Style = useAnimatedStyle(() => ({
      opacity: interpolate(dot1.value, [0, 1], [0.3, 1]),
      transform: [{ scale: interpolate(dot1.value, [0, 1], [0.8, 1.2]) }],
    }));

    const dot2Style = useAnimatedStyle(() => ({
      opacity: interpolate(dot2.value, [0, 1], [0.3, 1]),
      transform: [{ scale: interpolate(dot2.value, [0, 1], [0.8, 1.2]) }],
    }));

    const dot3Style = useAnimatedStyle(() => ({
      opacity: interpolate(dot3.value, [0, 1], [0.3, 1]),
      transform: [{ scale: interpolate(dot3.value, [0, 1], [0.8, 1.2]) }],
    }));

    return (
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, dot1Style]} />
        <Animated.View style={[styles.dot, dot2Style]} />
        <Animated.View style={[styles.dot, dot3Style]} />
      </View>
    );
  };

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

  if (!request) {
    return null;
  }

  const isSearching = loading && !request.tool.response;
  const hasResults = searchResults && searchResults.results;

  return (
    <View style={styles.container}>
      <View style={styles.loadingContainerSearched}>
        <Text style={styles.loadingTextSearched}>
          <Text style={{ fontWeight: "bold" }}>
            {isSearching ? "Searching for" : "Searched for"}
          </Text>{" "}
          "{query}"...
        </Text>
        {isSearching ? (
          <SearchingAnimation />
        ) : (
          hasResults && renderAvatarsGroup()
        )}
      </View>
    </View>
  );
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
      gap: 10,
      padding: 16,
      backgroundColor: "#f8f9fa",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#e2e8f0",
    },
    loadingContainerSearched: {
      width: cardWidth,
      // flexDirection: "row",
      // alignItems: "center",
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
    avatarsGroup: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 8,
    },
    avatarContainer: {
      marginLeft: -4, // Overlap avatars slightly
    },
    avatar: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 0.5,
      backgroundColor: "white",
      borderColor: "grey",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarFallback: {
      backgroundColor: "#f3f4f6",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarMore: {
      backgroundColor: "#e5e7eb",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarMoreText: {
      fontSize: 10,
      fontWeight: "600",
      color: "#6b7280",
    },
    searchingAnimation: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    dotsContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#000000",
    },
  });
};
