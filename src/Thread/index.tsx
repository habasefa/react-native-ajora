import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  FlatList,
  TextInput,
} from "react-native";
import styles, { DRAWER_WIDTH } from "./styles";
import { Thread as ThreadType, ThreadProps } from "./types";
import { MaterialIcons } from "@expo/vector-icons";
import { useChatContext } from "../AjoraContext";
import { colors } from "../Theme";

const formatTimestamp = (timestamp: string | Date | undefined): string => {
  if (!timestamp) return "";

  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}w ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
};

export function Thread({
  isOpen,
  onClose,
  onThreadSelect,
  onNewThread,
  containerStyle,
  renderEmpty,
}: ThreadProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const { ajora } = useChatContext();
  const { activeThreadId, getThreads } = ajora;

  React.useEffect(() => {
    getThreads();
  }, []);

  const { threads } = ajora;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -DRAWER_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen, slideAnim]);

  const handleThreadPress = (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId);
    if (thread) {
      onThreadSelect(thread);
    }
    onClose();
  };

  type ThreadListItem = ThreadType & {
    lastMessage?: { parts?: { text?: string }[] };
  };

  const renderThreadItem = ({ item }: { item: ThreadListItem }) => (
    <TouchableOpacity
      style={[
        styles.threadItem,
        item.id === activeThreadId && styles.activeThreadItem,
      ]}
      onPress={() => handleThreadPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.threadContent}>
        <Text
          style={[
            styles.threadTitle,
            item.id === activeThreadId && styles.activeThreadTitle,
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {item.lastMessage && (
          <Text
            style={[
              styles.threadLastMessage,
              item.id === activeThreadId && styles.activeThreadLastMessage,
            ]}
            numberOfLines={2}
          >
            {item.lastMessage.parts?.[0]?.text}
          </Text>
        )}
        {(item.createdAt || item.created_at) && (
          <Text
            style={[
              styles.threadTimestamp,
              item.id === activeThreadId && styles.activeThreadTimestamp,
            ]}
          >
            {formatTimestamp(item.createdAt || item.created_at)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyThreads = () => {
    if (renderEmpty) {
      return renderEmpty();
    }

    return (
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
  };

  const filteredThreads = React.useMemo(() => {
    return threads
      .filter((thread) => {
        return thread.title?.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => {
        // Sort in descending order (most recent first)
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
  }, [threads, searchQuery]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />
      )}

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: slideAnim }],
          },
          containerStyle,
        ]}
      >
        {/* Chats Header */}
        <View style={styles.chatsHeader}>
          <Text style={styles.chatsHeaderText}>Chats</Text>
        </View>

        {/* Header */}
        <View style={styles.drawerHeader}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={colors.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onNewThread}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Thread List */}
        <FlatList
          data={filteredThreads}
          keyExtractor={(item) => item.id}
          renderItem={renderThreadItem}
          style={styles.threadList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyThreads}
          ItemSeparatorComponent={() => <View style={styles.threadSeparator} />}
        />
      </Animated.View>
    </>
  );
}
