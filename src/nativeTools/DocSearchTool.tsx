import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { ToolRequest, ToolResponse } from "../Tool/types";

interface DocSearchToolProps {
  request: ToolRequest;
  onResponse?: (response: ToolResponse) => void;
}

const DocSearchTool: React.FC<DocSearchToolProps> = ({
  request,
  onResponse,
}) => {
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { tool } = request;
  const { query = [] } = tool.args || {};

  const performSearch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call - in real implementation, you'd call an actual document search API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock document search results
      const mockResults = {
        query: query.join(" "),
        results: [
          {
            title: "Introduction to Human Nutrition",
            source: "intro_to_human_nutrition.pdf",
            content:
              "Nutrition is the science that interprets the nutrients and other substances in food in relation to maintenance, growth, reproduction, health and disease of an organism.",
            relevance: 0.95,
            page: 1,
          },
          {
            title: "Macronutrients and Micronutrients",
            source: "intro_to_human_nutrition.pdf",
            content:
              "Macronutrients include carbohydrates, proteins, and fats, while micronutrients include vitamins and minerals essential for proper body function.",
            relevance: 0.87,
            page: 15,
          },
          {
            title: "Meal Planning Principles",
            source: "intro_to_human_nutrition.pdf",
            content:
              "Effective meal planning involves balancing macronutrients, considering individual dietary needs, and ensuring variety in food choices.",
            relevance: 0.82,
            page: 42,
          },
        ],
        totalResults: 3,
        searchTime: "0.23s",
      };

      setSearchResults(mockResults);

      // Send response back
      if (onResponse && request) {
        onResponse({
          callId: request.callId,
          response: mockResults,
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
  }, [query, request, onResponse]);

  useEffect(() => {
    if (request?.tool.name === "search_document") {
      // Use response data from the merged functionCall
      if (request.tool.response) {
        setSearchResults(request.tool.response);
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
          <Text style={styles.loadingText}>
            Searching documents for "{query.join(" ")}"...
          </Text>
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
      <View style={styles.searchCard}>
        <View style={styles.header}>
          <Text style={styles.searchIcon}>📚</Text>
          <Text style={styles.searchTitle}>Document Search Results</Text>
        </View>

        <View style={styles.queryContainer}>
          <Text style={styles.queryText}>"{searchResults.query}"</Text>
          <Text style={styles.metaText}>
            {searchResults.totalResults} results in {searchResults.searchTime}
          </Text>
        </View>

        <ScrollView
          style={styles.resultsContainer}
          showsVerticalScrollIndicator={false}
        >
          {searchResults.results.map((result: any, index: number) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle} numberOfLines={2}>
                  {result.title}
                </Text>
                <Text style={styles.relevanceScore}>
                  {Math.round(result.relevance * 100)}%
                </Text>
              </View>
              <Text style={styles.resultSource}>
                {result.source} • Page {result.page}
              </Text>
              <Text style={styles.resultContent} numberOfLines={4}>
                {result.content}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

DocSearchTool.displayName = "search_document";
export default DocSearchTool;

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
  searchCard: {
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
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
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
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
    marginRight: 8,
  },
  relevanceScore: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultSource: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
  },
  resultContent: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 18,
  },
});
