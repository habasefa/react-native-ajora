// @ts-nocheck
import * as React from "react";
import { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
  TextStyle,
  ScrollView,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { renderSlot, WithSlots } from "../../lib/slots";
import {
  useAjoraThreadContext,
  Thread,
} from "../../providers/AjoraThreadProvider";
import {
  useAjoraChatConfiguration,
  AjoraChatDefaultLabels,
} from "../../providers/AjoraChatConfigurationProvider";

// ============================================================================
// Types
// ============================================================================

/**
 * Theme configuration for the thread drawer
 */
export interface AjoraThreadDrawerTheme {
  /** Background color of the drawer */
  backgroundColor?: string;
  /** Background color of the overlay */
  overlayColor?: string;
  /** Header background color */
  headerBackgroundColor?: string;
  /** Header border color */
  headerBorderColor?: string;
  /** Header title color */
  headerTitleColor?: string;
  /** Thread item background color */
  itemBackgroundColor?: string;
  /** Thread item background color when selected */
  itemSelectedBackgroundColor?: string;
  /** Thread item background color when pressed */
  itemPressedBackgroundColor?: string;
  /** Thread item title color */
  itemTitleColor?: string;
  /** Thread item subtitle color */
  itemSubtitleColor?: string;
  /** Thread item icon color */
  itemIconColor?: string;
  /** Thread item selected indicator color */
  itemSelectedIndicatorColor?: string;
  /** New thread button background color */
  newThreadButtonBackgroundColor?: string;
  /** New thread button text color */
  newThreadButtonTextColor?: string;
  /** Drawer width (number for fixed, string for percentage) */
  drawerWidth?: number | string;
  /** Header height */
  headerHeight?: number;
  /** Thread item height */
  itemHeight?: number;
}

/**
 * Default light theme for the drawer
 */
export const DEFAULT_DRAWER_LIGHT_THEME: AjoraThreadDrawerTheme = {
  backgroundColor: "#FFFFFF",
  overlayColor: "rgba(0, 0, 0, 0.5)",
  headerBackgroundColor: "#FFFFFF",
  headerBorderColor: "#E5E5EA",
  headerTitleColor: "#000000",
  itemBackgroundColor: "#FFFFFF",
  itemSelectedBackgroundColor: "#F3F4F6",
  itemPressedBackgroundColor: "#E5E7EB",
  itemTitleColor: "#000000",
  itemSubtitleColor: "#6B7280",
  itemIconColor: "#6B7280",
  itemSelectedIndicatorColor: "#007AFF",
  newThreadButtonBackgroundColor: "#007AFF",
  newThreadButtonTextColor: "#FFFFFF",
  drawerWidth: "80%",
  headerHeight: 56,
  itemHeight: 64,
};

/**
 * Default dark theme for the drawer
 */
export const DEFAULT_DRAWER_DARK_THEME: AjoraThreadDrawerTheme = {
  backgroundColor: "#1C1C1E",
  overlayColor: "rgba(0, 0, 0, 0.7)",
  headerBackgroundColor: "#1C1C1E",
  headerBorderColor: "#38383A",
  headerTitleColor: "#FFFFFF",
  itemBackgroundColor: "#1C1C1E",
  itemSelectedBackgroundColor: "#2C2C2E",
  itemPressedBackgroundColor: "#3A3A3C",
  itemTitleColor: "#FFFFFF",
  itemSubtitleColor: "#8E8E93",
  itemIconColor: "#8E8E93",
  itemSelectedIndicatorColor: "#0A84FF",
  newThreadButtonBackgroundColor: "#0A84FF",
  newThreadButtonTextColor: "#FFFFFF",
  drawerWidth: "80%",
  headerHeight: 56,
  itemHeight: 64,
};

// ============================================================================
// Sub-component Types
// ============================================================================

export interface AjoraThreadDrawerHeaderProps {
  title?: string;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  onClose?: () => void;
  showCloseButton?: boolean;
  theme?: AjoraThreadDrawerTheme;
}

export interface AjoraThreadDrawerItemProps {
  thread: Thread;
  isSelected?: boolean;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  onPress?: (thread: Thread) => void;
  onLongPress?: (thread: Thread) => void;
  onDelete?: (thread: Thread) => void;
  showDeleteButton?: boolean;
  showSelectedIndicator?: boolean;
  theme?: AjoraThreadDrawerTheme;
  /** Custom render function for the thread item */
  renderItem?: (props: AjoraThreadDrawerItemProps) => React.ReactElement;
}

export interface AjoraThreadDrawerNewButtonProps {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
  label?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  theme?: AjoraThreadDrawerTheme;
}

export interface AjoraThreadDrawerListProps {
  threads: Thread[];
  currentThreadId?: string | null;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onSelectThread?: (thread: Thread) => void;
  onDeleteThread?: (thread: Thread) => void;
  onLongPressThread?: (thread: Thread) => void;
  itemTheme?: AjoraThreadDrawerTheme;
  /** Custom render function for each thread item */
  renderItem?: (props: AjoraThreadDrawerItemProps) => React.ReactElement;
  /** Empty state component */
  emptyComponent?: React.ReactNode;
}

// ============================================================================
// Slot Types
// ============================================================================

type DrawerSlots = {
  header: typeof AjoraThreadDrawer.Header;
  list: typeof AjoraThreadDrawer.List;
  newButton: typeof AjoraThreadDrawer.NewButton;
  item: typeof AjoraThreadDrawer.Item;
};

type DrawerRestProps = {
  /** Whether the drawer is visible */
  isOpen?: boolean;
  /** Callback when the drawer should close */
  onClose?: () => void;
  /** Theme configuration */
  theme?: AjoraThreadDrawerTheme;
  /** Custom style for the drawer container */
  style?: StyleProp<ViewStyle>;
  /** Custom style for the overlay */
  overlayStyle?: StyleProp<ViewStyle>;
  /** Position of the drawer */
  position?: "left" | "right";
  /** Whether to show the header */
  showHeader?: boolean;
  /** Whether to show the new thread button */
  showNewThreadButton?: boolean;
  /** Header title override */
  headerTitle?: string;
  /** New thread button label override */
  newThreadButtonLabel?: string;
  /** Callback when a thread is selected */
  onSelectThread?: (thread: Thread) => void;
  /** Callback when a thread is deleted */
  onDeleteThread?: (thread: Thread) => void;
  /** Callback when a thread is long pressed */
  onLongPressThread?: (thread: Thread) => void;
  /** Callback when new thread button is pressed */
  onNewThread?: () => void;
  /** Whether to close drawer when a thread is selected */
  closeOnSelect?: boolean;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Empty state component when no threads */
  emptyComponent?: React.ReactNode;
  /** Custom render function for thread items */
  renderItem?: (props: AjoraThreadDrawerItemProps) => React.ReactElement;
};

export type AjoraThreadDrawerProps = WithSlots<DrawerSlots, DrawerRestProps>;

// ============================================================================
// Main Component
// ============================================================================

export function AjoraThreadDrawer({
  isOpen: controlledIsOpen,
  onClose,
  theme = DEFAULT_DRAWER_LIGHT_THEME,
  style,
  overlayStyle,
  position = "left",
  showHeader = true,
  showNewThreadButton = true,
  headerTitle,
  newThreadButtonLabel,
  onSelectThread,
  onDeleteThread,
  onLongPressThread,
  onNewThread,
  closeOnSelect = true,
  emptyComponent,
  renderItem,
  header,
  list,
  newButton,
  children,
  ...rest
}: AjoraThreadDrawerProps) {
  const threadContext = useAjoraThreadContext();
  const configuration = useAjoraChatConfiguration();

  // Use controlled state or context state
  const isOpen = controlledIsOpen ?? threadContext?.isDrawerOpen ?? false;

  const threads = threadContext?.threads ?? [];
  const currentThreadId = threadContext?.currentThreadId ?? null;

  // Resolve labels
  const resolvedHeaderTitle =
    headerTitle ??
    configuration?.labels.threadDrawerTitle ??
    AjoraChatDefaultLabels.threadDrawerTitle ??
    "Chats";

  const resolvedNewThreadLabel =
    newThreadButtonLabel ??
    configuration?.labels.threadDrawerNewButtonLabel ??
    AjoraChatDefaultLabels.threadDrawerNewButtonLabel ??
    "New Chat";

  // Handlers
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else if (threadContext) {
      threadContext.setDrawerOpen(false);
    }
  }, [onClose, threadContext]);

  const handleSelectThread = useCallback(
    (thread: Thread) => {
      if (onSelectThread) {
        onSelectThread(thread);
      } else if (threadContext) {
        threadContext.selectThread(thread.id);
      }

      if (closeOnSelect) {
        handleClose();
      }
    },
    [onSelectThread, threadContext, closeOnSelect, handleClose]
  );

  const handleDeleteThread = useCallback(
    (thread: Thread) => {
      if (onDeleteThread) {
        onDeleteThread(thread);
      } else if (threadContext) {
        threadContext.deleteThread(thread.id);
      }
    },
    [onDeleteThread, threadContext]
  );

  const handleLongPressThread = useCallback(
    (thread: Thread) => {
      if (onLongPressThread) {
        onLongPressThread(thread);
      }
    },
    [onLongPressThread]
  );

  const handleNewThread = useCallback(() => {
    if (onNewThread) {
      onNewThread();
    } else if (threadContext) {
      threadContext.createThread();
    }

    if (closeOnSelect) {
      handleClose();
    }
  }, [onNewThread, threadContext, closeOnSelect, handleClose]);

  // Calculate drawer width
  const screenWidth = Dimensions.get("window").width;
  const drawerWidth =
    typeof theme.drawerWidth === "string"
      ? (parseFloat(theme.drawerWidth) / 100) * screenWidth
      : theme.drawerWidth ?? screenWidth * 0.8;

  // Render slots
  const BoundHeader = renderSlot(header, AjoraThreadDrawer.Header, {
    title: resolvedHeaderTitle,
    onClose: handleClose,
    theme,
  });

  const BoundList = renderSlot(list, AjoraThreadDrawer.List, {
    threads,
    currentThreadId,
    onSelectThread: handleSelectThread,
    onDeleteThread: handleDeleteThread,
    onLongPressThread: handleLongPressThread,
    itemTheme: theme,
    renderItem,
    emptyComponent,
  });

  const BoundNewButton = renderSlot(newButton, AjoraThreadDrawer.NewButton, {
    label: resolvedNewThreadLabel,
    onPress: handleNewThread,
    theme,
  });

  // Render function children pattern
  if (children) {
    return (
      <React.Fragment>
        {children({
          header: BoundHeader,
          list: BoundList,
          newButton: BoundNewButton,
          ...rest,
        })}
      </React.Fragment>
    );
  }

  const drawerTransform = position === "left" ? { left: 0 } : { right: 0 };

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      {/* Overlay */}
      <Pressable
        style={[
          styles.overlay,
          { backgroundColor: theme.overlayColor },
          overlayStyle,
        ]}
        onPress={handleClose}
        accessibilityLabel="Close drawer"
        accessibilityRole="button"
      >
        {/* Drawer container */}
        <Pressable
          style={[
            styles.drawer,
            {
              backgroundColor: theme.backgroundColor,
              width: drawerWidth,
            },
            drawerTransform,
            style,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {showHeader && BoundHeader}

          {/* New thread button at top */}
          {showNewThreadButton && (
            <View style={styles.newButtonContainer}>{BoundNewButton}</View>
          )}

          {/* Thread list */}
          {BoundList}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================================================
// Namespace Sub-components (following AjoraModalHeader pattern)
// ============================================================================

export namespace AjoraThreadDrawer {
  export const Header: React.FC<AjoraThreadDrawerHeaderProps> = ({
    title = "Chats",
    style,
    titleStyle,
    onClose,
    showCloseButton = true,
    theme = DEFAULT_DRAWER_LIGHT_THEME,
  }) => (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.headerBackgroundColor,
          borderBottomColor: theme.headerBorderColor,
          height: theme.headerHeight,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.headerTitle,
          { color: theme.headerTitleColor },
          titleStyle,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {showCloseButton && (
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.closeButtonPressed,
          ]}
          accessibilityLabel="Close drawer"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color={theme.headerTitleColor} />
        </Pressable>
      )}
    </View>
  );

  export const Item: React.FC<AjoraThreadDrawerItemProps> = ({
    thread,
    isSelected = false,
    style,
    titleStyle,
    subtitleStyle,
    onPress,
    onLongPress,
    onDelete,
    showDeleteButton = false,
    showSelectedIndicator = true,
    theme = DEFAULT_DRAWER_LIGHT_THEME,
    renderItem,
  }) => {
    if (renderItem) {
      return renderItem({
        thread,
        isSelected,
        style,
        titleStyle,
        subtitleStyle,
        onPress,
        onLongPress,
        onDelete,
        showDeleteButton,
        showSelectedIndicator,
        theme,
      });
    }

    const formattedDate = useMemo(() => {
      const date = thread.updatedAt || thread.createdAt;
      if (!date) return "";

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (diffDays === 1) {
        return "Yesterday";
      } else if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: "short" });
      } else {
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
      }
    }, [thread.updatedAt, thread.createdAt]);

    return (
      <Pressable
        onPress={() => onPress?.(thread)}
        onLongPress={() => onLongPress?.(thread)}
        style={({ pressed }) => [
          styles.item,
          {
            backgroundColor: isSelected
              ? theme.itemSelectedBackgroundColor
              : theme.itemBackgroundColor,
            minHeight: theme.itemHeight,
          },
          pressed && { backgroundColor: theme.itemPressedBackgroundColor },
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Thread: ${thread.name}`}
        accessibilityState={{ selected: isSelected }}
      >
        {/* Selected indicator */}
        {showSelectedIndicator && isSelected && (
          <View
            style={[
              styles.selectedIndicator,
              { backgroundColor: theme.itemSelectedIndicatorColor },
            ]}
          />
        )}

        {/* Thread icon */}
        <View style={styles.itemIcon}>
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={theme.itemIconColor}
          />
        </View>

        {/* Thread info */}
        <View style={styles.itemContent}>
          <View style={styles.itemTitleRow}>
            <Text
              style={[
                styles.itemTitle,
                { color: theme.itemTitleColor },
                isSelected && styles.itemTitleSelected,
                titleStyle,
              ]}
              numberOfLines={1}
            >
              {thread.name}
            </Text>
            <Text
              style={[styles.itemDate, { color: theme.itemSubtitleColor }]}
              numberOfLines={1}
            >
              {formattedDate}
            </Text>
          </View>
          {thread.subtitle && (
            <Text
              style={[
                styles.itemSubtitle,
                { color: theme.itemSubtitleColor },
                subtitleStyle,
              ]}
              numberOfLines={1}
            >
              {thread.subtitle}
            </Text>
          )}
        </View>

        {/* Delete button */}
        {showDeleteButton && (
          <Pressable
            onPress={() => onDelete?.(thread)}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
            ]}
            accessibilityLabel="Delete thread"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </Pressable>
        )}
      </Pressable>
    );
  };

  export const List: React.FC<AjoraThreadDrawerListProps> = ({
    threads,
    currentThreadId,
    style,
    contentContainerStyle,
    onSelectThread,
    onDeleteThread,
    onLongPressThread,
    itemTheme = DEFAULT_DRAWER_LIGHT_THEME,
    renderItem,
    emptyComponent,
  }) => {
    if (threads.length === 0 && emptyComponent) {
      return <View style={[styles.list, style]}>{emptyComponent}</View>;
    }

    return (
      <ScrollView
        style={[styles.list, style]}
        contentContainerStyle={[styles.listContent, contentContainerStyle]}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {threads.map((thread) => (
          <AjoraThreadDrawer.Item
            key={thread.id}
            thread={thread}
            isSelected={thread.id === currentThreadId}
            onPress={onSelectThread}
            onLongPress={onLongPressThread}
            onDelete={onDeleteThread}
            showDeleteButton={threads.length > 1}
            theme={itemTheme}
            renderItem={renderItem}
          />
        ))}
      </ScrollView>
    );
  };

  export const NewButton: React.FC<AjoraThreadDrawerNewButtonProps> = ({
    style,
    textStyle,
    onPress,
    label = "New Chat",
    iconName = "add",
    theme = DEFAULT_DRAWER_LIGHT_THEME,
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.newButton,
        { backgroundColor: theme.newThreadButtonBackgroundColor },
        pressed && styles.newButtonPressed,
        style,
      ]}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Ionicons
        name={iconName}
        size={20}
        color={theme.newThreadButtonTextColor}
        style={styles.newButtonIcon}
      />
      <Text
        style={[
          styles.newButtonText,
          { color: theme.newThreadButtonTextColor },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  drawer: {
    flex: 1,
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  closeButtonPressed: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: "relative",
  },
  selectedIndicator: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
    justifyContent: "center",
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  itemTitleSelected: {
    fontWeight: "600",
  },
  itemDate: {
    fontSize: 12,
  },
  itemSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    marginLeft: 8,
  },
  deleteButtonPressed: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  newButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  newButtonPressed: {
    opacity: 0.8,
  },
  newButtonIcon: {
    marginRight: 8,
  },
  newButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AjoraThreadDrawer;
