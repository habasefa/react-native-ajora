import React, { useRef } from "react";
import { View, Text, TouchableOpacity, Animated, FlatList } from "react-native";
import styles, { DRAWER_WIDTH } from "./styles";
import { ThreadItem, ThreadProps } from "./types";
import { MaterialIcons } from "@expo/vector-icons";
import { useChatContext } from "../AjoraContext";

const formatTimestamp = (timestamp: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - timestamp.getTime();
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
    return timestamp.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        timestamp.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
};

export function Thread({
  threads,
  isOpen,
  onClose,
  onThreadSelect,
  onNewThread,
  containerStyle,
  renderEmpty,
}: ThreadProps) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const { ajora } = useChatContext();
  const { activeThreadId, addNewThread, switchThread } = ajora;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -DRAWER_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen, slideAnim]);

  const renderThreadItem = ({ item }: { item: ThreadItem }) => (
    <TouchableOpacity
      style={[
        styles.threadItem,
        item.id === activeThreadId && styles.activeThreadItem,
      ]}
      onPress={() => switchThread(item.id)}
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
        {item.timestamp && (
          <Text
            style={[
              styles.threadTimestamp,
              item.id === activeThreadId && styles.activeThreadTimestamp,
            ]}
          >
            {formatTimestamp(item.timestamp)}
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
          color="#9CA3AF"
          style={styles.threadEmptyIcon}
        />
        <Text style={styles.threadEmptyTitle}>No chat threads yet</Text>
        <Text style={styles.threadEmptySubtitle}>
          Tap &quot;New Thread&quot; to start your first chat thread
        </Text>
      </View>
    );
  };

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
        {/* Header */}
        <View style={styles.drawerHeader}>
          <View style={styles.headerContent}>
            <Text style={styles.drawerTitle}>Threads</Text>
            <Text style={styles.drawerSubtitle}>Manage your conversations</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeIcon}>×</Text>
          </TouchableOpacity>
        </View>

        {/* New Thread Button */}
        <TouchableOpacity
          style={styles.newThreadButton}
          onPress={addNewThread}
          activeOpacity={0.7}
        >
          <Text style={styles.newThreadIcon}>+</Text>
          <Text style={styles.newThreadText}>New Thread</Text>
        </TouchableOpacity>

        {/* Thread List */}
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={renderThreadItem}
          style={styles.threadList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyThreads}
        />
      </Animated.View>
    </>
  );
}
