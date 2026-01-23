import { ReactToolCallRenderer, ToolCallStatus } from "@ajora-ai/native";
import React, { useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WebSearchArgs {
  query: string;
}

interface WebSearchResult {
  title: string | null;
  url: string;
  content: string;
  publishedDate?: string;
  author?: string;
  favicon?: string;
  id?: string;
}

export const WebSearchTool: ReactToolCallRenderer<
  WebSearchResult[]
>["render"] = ({ args, status, result }) => {
  const typedArgs = args as unknown as WebSearchArgs;
  const [expanded, setExpanded] = useState(true);

  // 1. Executing / In Progress State
  if (
    status === ToolCallStatus.Executing ||
    status === ToolCallStatus.InProgress
  ) {
    return (
      <View style={styles.executingContainer}>
        <ActivityIndicator size="small" color="#666" />
        <Text style={styles.executingText}>
          Searching for &quot;{typedArgs.query}&quot;...
        </Text>
      </View>
    );
  }

  // 2. Completed State
  if (status === ToolCallStatus.Complete && result) {
    let results: WebSearchResult[] = [];
    try {
      results = typeof result === "string" ? JSON.parse(result) : result;
    } catch (e) {
      console.error("Failed to parse search results", e);
      return (
        <View style={styles.executingContainer}>
          <Text style={styles.errorText}>Failed to load results</Text>
        </View>
      );
    }

    if (!Array.isArray(results) || results.length === 0) return null;

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.headerRow}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.headerText}>
            Searched for &quot;{typedArgs.query}&quot;
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color="#666"
          />
        </TouchableOpacity>

        {expanded && (
          <View style={styles.resultsList}>
            {results.slice(0, 3).map((item, index) => (
              <TouchableOpacity
                key={item.id ?? index}
                style={styles.resultItem}
                onPress={() => Linking.openURL(item.url)}
              >
                <Text style={styles.resultTitle} numberOfLines={1}>
                  {item.title || "No Title"}
                </Text>
                <Text style={styles.resultUrl} numberOfLines={1}>
                  {item.url}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    width: "100%",
  },
  executingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    // No background color as requested
  },
  executingText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    // Add a subtle border to separate if needed, or keep it clean
  },
  headerText: {
    fontSize: 14,
    color: "#444",
    fontWeight: "500",
    flex: 1, // Take available space
    marginRight: 8,
  },
  resultsList: {
    marginTop: 4,
    marginLeft: 4,
    borderLeftWidth: 2,
    borderLeftColor: "#e5e5e5",
    paddingLeft: 12,
  },
  resultItem: {
    marginBottom: 10,
  },
  resultTitle: {
    fontWeight: "600",
    fontSize: 14,
    color: "#007AFF", // Link color for title
    marginBottom: 2,
  },
  resultUrl: {
    fontSize: 12,
    color: "#888",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginLeft: 8,
  },
});
