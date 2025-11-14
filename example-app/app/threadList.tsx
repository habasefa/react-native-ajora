import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useChatContext } from "../../src/AjoraContext";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useThreads, useCreateThread, ThreadItem } from "../api";
import { SafeAreaView } from "react-native-safe-area-context";

// Theme values (self-contained)
const colors = {
  appPrimary: "#4095E5",
  appSecondary: "#F3F4F6",
  text: "#1F2937",
  primaryText: "#111827",
  secondaryText: "#6B7280",
  background: "#F9FAFB",
  white: "#FFFFFF",
  border: "#E5E7EB",
  shadow: "#000000",
};

const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
  },
  weights: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
  "3xl": 48,
};

const borderRadius = {
  sm: 8,
  base: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// No longer using drawer width, it's a full screen

const formatTimestamp = (timestamp: string | Date | undefined): string => {
  if (!timestamp) return "";
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}w ago`;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

export default function ThreadListScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const { ajora } = useChatContext();
  const { activeThreadId, switchThread } = ajora;

  // Use react-query hooks
  const { data: threadsData = [] } = useThreads();
  const createThreadMutation = useCreateThread();

  const filteredThreads = useMemo(() => {
    return threadsData
      .filter((thread: ThreadItem) =>
        thread.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a: ThreadItem, b: ThreadItem) => {
        const dateA =
          a.createdAt || a.created_at
            ? new Date(a.createdAt || a.created_at!).getTime()
            : 0;
        const dateB =
          b.createdAt || b.created_at
            ? new Date(b.createdAt || b.created_at!).getTime()
            : 0;
        return dateB - dateA;
      });
  }, [threadsData, searchQuery]);

  const handleThreadPress = (threadId: string) => {
    switchThread(threadId);
    router.back();
  };

  const handleNewThread = async () => {
    try {
      const newThread = await createThreadMutation.mutateAsync(undefined);
      if (newThread?.id) {
        switchThread(newThread.id);
      }
      router.back();
    } catch (error) {
      console.warn("[Ajora]: Failed to create thread", error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const renderEmptyThreads = () => (
    <View style={styles.threadEmptyContainer}>
      <MaterialIcons
        name="chat-bubble-outline"
        size={48}
        color={colors.secondaryText}
        style={styles.threadEmptyIcon}
      />
      <Text style={styles.threadEmptyTitle}>No chats yet</Text>
      <Text style={styles.threadEmptySubtitle}>
        Tap &quot;Plus&quot; to start your first chat
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Chats</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleNewThread}
          activeOpacity={0.7}
        >
          <MaterialIcons name="add" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={24}
          color={colors.secondaryText}
          style={{ marginRight: spacing.sm }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats..."
          placeholderTextColor={colors.secondaryText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSearchQuery("")}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="close"
              size={20}
              color={colors.secondaryText}
            />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredThreads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: ThreadItem }) => (
          <TouchableOpacity
            style={[
              styles.itemContainer,
              item.id === activeThreadId && styles.activeThreadItem,
            ]}
            onPress={() => handleThreadPress(item.id)}
            activeOpacity={0.8}
          >
            <View style={styles.threadRow}>
              <View style={styles.threadContent}>
                <View style={styles.threadHeader}>
                  <Text
                    style={[
                      styles.threadTitle,
                      item.id === activeThreadId && styles.activeThreadTitle,
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                </View>
                {(item.createdAt || item.created_at) && (
                  <Text
                    style={[
                      styles.threadTimestamp,
                      item.id === activeThreadId &&
                        styles.activeThreadTimestamp,
                    ]}
                  >
                    {formatTimestamp(item.createdAt || item.created_at)}
                  </Text>
                )}
                {item.lastMessage && (
                  <Text
                    style={[
                      styles.threadLastMessage,
                      item.id === activeThreadId &&
                        styles.activeThreadLastMessage,
                    ]}
                    numberOfLines={1}
                  >
                    {item.lastMessage.parts?.[0]?.text}
                  </Text>
                )}
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={colors.secondaryText}
                style={styles.chevron}
              />
            </View>
          </TouchableOpacity>
        )}
        style={styles.threadList}
        contentContainerStyle={styles.threadListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyThreads}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
    letterSpacing: -0.3,
    flex: 1,
    textAlign: "center",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  searchHeader: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    backgroundColor: colors.white,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.appSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.text,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: "transparent",
    textAlignVertical: "center",
    lineHeight: 22,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  threadList: {
    flex: 1,
  },
  threadListContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  itemContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 72,
    // subtle shadow
    shadowColor: colors.shadow,
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 0,
  },
  activeThreadItem: {
    backgroundColor: colors.appSecondary,
    borderColor: colors.appPrimary,
  },
  threadRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  threadTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as any,
    color: colors.text,
    flex: 1,
  },
  activeThreadTitle: {
    color: colors.primaryText,
    fontWeight: typography.weights.semibold as any,
  },
  threadLastMessage: {
    fontSize: typography.sizes.sm,
    color: colors.secondaryText,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  activeThreadLastMessage: {
    color: colors.text,
  },
  threadTimestamp: {
    fontSize: typography.sizes.xs,
    color: colors.secondaryText,
    marginTop: spacing.xs,
  },
  activeThreadTimestamp: {
    color: colors.text,
  },
  chevron: {
    marginLeft: spacing.base,
  },
  threadEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["3xl"],
  },
  threadEmptyIcon: {
    fontSize: typography.sizes["4xl"],
    marginBottom: spacing.base,
    textAlign: "center",
  },
  threadEmptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  threadEmptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.secondaryText,
    textAlign: "center",
    lineHeight: 20,
  },
});
