// @ts-nocheck
import * as React from "react";
import { useCallback, useMemo, useState } from "react";
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
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
 * Follows the library's color system patterns
 */
export interface AjoraThreadDrawerTheme {
  // Base colors
  backgroundColor?: string;
  overlayColor?: string;

  // Header
  headerBackgroundColor?: string;
  headerBorderColor?: string;
  headerTitleColor?: string;

  // Search bar
  searchBackgroundColor?: string;
  searchBorderColor?: string;
  searchTextColor?: string;
  searchPlaceholderColor?: string;
  searchIconColor?: string;

  // Section header
  sectionHeaderColor?: string;
  sectionChevronColor?: string;

  // Thread items
  itemBackgroundColor?: string;
  itemSelectedBackgroundColor?: string;
  itemPressedBackgroundColor?: string;
  itemTitleColor?: string;
  itemDateColor?: string;
  itemIconColor?: string;
  itemMenuIconColor?: string;
  itemSelectedIndicatorColor?: string;

  // New thread button
  newThreadButtonBackgroundColor?: string;
  newThreadButtonBorderColor?: string;
  newThreadButtonTextColor?: string;
  newThreadButtonIconColor?: string;
  newThreadButtonPressedBackgroundColor?: string;

  // Footer / User profile area
  footerBackgroundColor?: string;
  footerBorderColor?: string;
  userNameColor?: string;
  userAvatarBackgroundColor?: string;
  userAvatarTextColor?: string;
  settingsIconColor?: string;

  // Layout
  drawerWidth?: number | string;
  headerHeight?: number;
  itemHeight?: number;
  borderRadius?: number;
}

/**
 * Default light theme - consistent with library patterns
 */
export const DEFAULT_DRAWER_LIGHT_THEME: AjoraThreadDrawerTheme = {
  backgroundColor: "#FAFAFA",
  overlayColor: "rgba(0, 0, 0, 0.35)",

  headerBackgroundColor: "#FAFAFA",
  headerBorderColor: "#E5E7EB",
  headerTitleColor: "#1F2937",

  searchBackgroundColor: "#FFFFFF",
  searchBorderColor: "#E8E8E8",
  searchTextColor: "#1F2937",
  searchPlaceholderColor: "#9CA3AF",
  searchIconColor: "#9CA3AF",

  sectionHeaderColor: "#6B7280",
  sectionChevronColor: "#C4C4C6",

  itemBackgroundColor: "transparent",
  itemSelectedBackgroundColor: "transparent",
  itemPressedBackgroundColor: "#F3F4F6",
  itemTitleColor: "#1F2937",
  itemDateColor: "#9CA3AF",
  itemIconColor: "#6B7280",
  itemMenuIconColor: "#D1D1D6",
  itemSelectedIndicatorColor: "#3B82F6",

  newThreadButtonBackgroundColor: "#FFFFFF",
  newThreadButtonBorderColor: "#E8E8E8",
  newThreadButtonTextColor: "#1F2937",
  newThreadButtonIconColor: "#6B7280",
  newThreadButtonPressedBackgroundColor: "#F5F5F5",

  footerBackgroundColor: "#FAFAFA",
  footerBorderColor: "transparent",
  userNameColor: "#1F2937",
  userAvatarBackgroundColor: "#E5E7EB",
  userAvatarTextColor: "#6B7280",
  settingsIconColor: "#8E8E93",

  drawerWidth: "85%",
  headerHeight: 56,
  itemHeight: 64,
  borderRadius: 24,
};

/**
 * Default dark theme - follows library dark mode patterns
 */
export const DEFAULT_DRAWER_DARK_THEME: AjoraThreadDrawerTheme = {
  backgroundColor: "#0D0D0D",
  overlayColor: "rgba(0, 0, 0, 0.6)",

  headerBackgroundColor: "#0D0D0D",
  headerBorderColor: "#1F1F1F",
  headerTitleColor: "#FFFFFF",

  searchBackgroundColor: "transparent",
  searchBorderColor: "transparent",
  searchTextColor: "#FFFFFF",
  searchPlaceholderColor: "#6B7280",
  searchIconColor: "#6B7280",

  sectionHeaderColor: "#8E8E93",
  sectionChevronColor: "#6B7280",

  itemBackgroundColor: "transparent",
  itemSelectedBackgroundColor: "#1C2536",
  itemPressedBackgroundColor: "#1A1A1A",
  itemTitleColor: "#FFFFFF",
  itemDateColor: "#8E8E93",
  itemIconColor: "#6B7280",
  itemMenuIconColor: "#48484A",
  itemSelectedIndicatorColor: "#60A5FA",

  newThreadButtonBackgroundColor: "transparent",
  newThreadButtonBorderColor: "#2D2D2D",
  newThreadButtonTextColor: "#FFFFFF",
  newThreadButtonIconColor: "#9CA3AF",
  newThreadButtonPressedBackgroundColor: "#1A1A1A",

  footerBackgroundColor: "#0D0D0D",
  footerBorderColor: "#1F1F1F",
  userNameColor: "#FFFFFF",
  userAvatarBackgroundColor: "#2D2D2D",
  userAvatarTextColor: "#9CA3AF",
  settingsIconColor: "#6B7280",

  drawerWidth: "85%",
  headerHeight: 56,
  itemHeight: 52,
  borderRadius: 10,
};

// ============================================================================
// Sub-component Types
// ============================================================================

export interface AjoraThreadDrawerSearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  theme?: AjoraThreadDrawerTheme;
}

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
  dateStyle?: StyleProp<TextStyle>;
  onPress?: (thread: Thread) => void;
  onLongPress?: (thread: Thread) => void;
  onMenuPress?: (thread: Thread) => void;
  onDelete?: (thread: Thread) => void;
  showMenuButton?: boolean;
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

export interface AjoraThreadDrawerSectionHeaderProps {
  title?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
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
  onMenuPressThread?: (thread: Thread) => void;
  itemTheme?: AjoraThreadDrawerTheme;
  /** Custom render function for each thread item */
  renderItem?: (props: AjoraThreadDrawerItemProps) => React.ReactElement;
  /** Empty state component */
  emptyComponent?: React.ReactNode;
  /** Section header title */
  sectionTitle?: string;
  /** Search filter text */
  searchFilter?: string;
}

export interface AjoraThreadDrawerFooterProps {
  userName?: string;
  userInitials?: string;
  onSettingsPress?: () => void;
  style?: StyleProp<ViewStyle>;
  theme?: AjoraThreadDrawerTheme;
}

// ============================================================================
// Slot Types
// ============================================================================

type DrawerSlots = {
  searchBar: typeof AjoraThreadDrawer.SearchBar;
  header: typeof AjoraThreadDrawer.Header;
  list: typeof AjoraThreadDrawer.List;
  newButton: typeof AjoraThreadDrawer.NewButton;
  item: typeof AjoraThreadDrawer.Item;
  sectionHeader: typeof AjoraThreadDrawer.SectionHeader;
  footer: typeof AjoraThreadDrawer.Footer;
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
  /** Whether to show the search bar */
  showSearchBar?: boolean;
  /** Whether to show the header */
  showHeader?: boolean;
  /** Whether to show the new thread button */
  showNewThreadButton?: boolean;
  /** Whether to show section header */
  showSectionHeader?: boolean;
  /** Whether to show footer */
  showFooter?: boolean;
  /** Header title override */
  headerTitle?: string;
  /** New thread button label override */
  newThreadButtonLabel?: string;
  /** Section header title */
  sectionTitle?: string;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** User name for footer */
  userName?: string;
  /** Callback when a thread is selected */
  onSelectThread?: (thread: Thread) => void;
  /** Callback when a thread is deleted */
  onDeleteThread?: (thread: Thread) => void;
  /** Callback when a thread is long pressed */
  onLongPressThread?: (thread: Thread) => void;
  /** Callback when thread menu is pressed */
  onMenuPressThread?: (thread: Thread) => void;
  /** Callback when new thread button is pressed */
  onNewThread?: () => void;
  /** Callback when settings is pressed */
  onSettingsPress?: () => void;
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
// Helper Functions
// ============================================================================

/**
 * Format date for thread item display
 * Returns formats like: "3:11 PM", "Yesterday", "Dec 20, 2025"
 */
function formatThreadDate(date: Date | undefined): string {
  if (!date) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const threadDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (threadDate.getTime() === today.getTime()) {
    // Today - show time
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } else if (threadDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else {
    // Show date
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}

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
  showSearchBar = true,
  showHeader = false,
  showNewThreadButton = true,
  showSectionHeader = true,
  showFooter = false,
  headerTitle,
  newThreadButtonLabel,
  sectionTitle,
  searchPlaceholder,
  userName,
  onSelectThread,
  onDeleteThread,
  onLongPressThread,
  onMenuPressThread,
  onNewThread,
  onSettingsPress,
  closeOnSelect = true,
  emptyComponent,
  renderItem,
  searchBar,
  header,
  list,
  newButton,
  sectionHeader,
  footer,
  children,
  ...rest
}: AjoraThreadDrawerProps) {
  const threadContext = useAjoraThreadContext();
  const configuration = useAjoraChatConfiguration();
  const insets = useSafeAreaInsets();

  // Local state
  const [searchText, setSearchText] = useState("");
  const [isSectionExpanded, setIsSectionExpanded] = useState(true);

  // Use controlled state or context state
  const isOpen = controlledIsOpen ?? threadContext?.isDrawerOpen ?? false;

  const threads = threadContext?.threads ?? [];
  const currentThreadId = threadContext?.currentThreadId ?? null;

  // Filter threads by search
  const filteredThreads = useMemo(() => {
    if (!searchText.trim()) return threads;
    const search = searchText.toLowerCase();
    return threads.filter(
      (thread) =>
        thread.name.toLowerCase().includes(search) ||
        thread.subtitle?.toLowerCase().includes(search)
    );
  }, [threads, searchText]);

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

  const resolvedSectionTitle = sectionTitle ?? "Conversations";
  const resolvedSearchPlaceholder = searchPlaceholder ?? "Search conversations";

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

  const handleMenuPressThread = useCallback(
    (thread: Thread) => {
      if (onMenuPressThread) {
        onMenuPressThread(thread);
      } else if (onLongPressThread) {
        // Fallback to long press handler
        onLongPressThread(thread);
      }
    },
    [onMenuPressThread, onLongPressThread]
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

  const handleToggleSection = useCallback(() => {
    setIsSectionExpanded((prev) => !prev);
  }, []);

  // Calculate drawer width
  const screenWidth = Dimensions.get("window").width;
  const drawerWidth =
    typeof theme.drawerWidth === "string"
      ? (parseFloat(theme.drawerWidth) / 100) * screenWidth
      : (theme.drawerWidth ?? screenWidth * 0.85);

  // Render slots
  const BoundSearchBar = renderSlot(searchBar, AjoraThreadDrawer.SearchBar, {
    value: searchText,
    onChangeText: setSearchText,
    placeholder: resolvedSearchPlaceholder,
    theme,
  });

  const BoundHeader = renderSlot(header, AjoraThreadDrawer.Header, {
    title: resolvedHeaderTitle,
    onClose: handleClose,
    theme,
  });

  const BoundNewButton = renderSlot(newButton, AjoraThreadDrawer.NewButton, {
    label: resolvedNewThreadLabel,
    onPress: handleNewThread,
    theme,
  });

  const BoundSectionHeader = renderSlot(
    sectionHeader,
    AjoraThreadDrawer.SectionHeader,
    {
      title: resolvedSectionTitle,
      isExpanded: isSectionExpanded,
      onToggle: handleToggleSection,
      theme,
    }
  );

  const BoundList = renderSlot(list, AjoraThreadDrawer.List, {
    threads: isSectionExpanded ? filteredThreads : [],
    currentThreadId,
    onSelectThread: handleSelectThread,
    onDeleteThread: handleDeleteThread,
    onLongPressThread: handleLongPressThread,
    onMenuPressThread: handleMenuPressThread,
    itemTheme: theme,
    renderItem,
    emptyComponent,
    searchFilter: searchText,
  });

  const BoundFooter = renderSlot(footer, AjoraThreadDrawer.Footer, {
    userName,
    onSettingsPress,
    theme,
  });

  // Render function children pattern
  if (children) {
    return (
      <React.Fragment>
        {children({
          searchBar: BoundSearchBar,
          header: BoundHeader,
          list: BoundList,
          newButton: BoundNewButton,
          sectionHeader: BoundSectionHeader,
          footer: BoundFooter,
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
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
            drawerTransform,
            style,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header (optional) */}
          {showHeader && BoundHeader}

          {/* Search bar */}
          {showSearchBar && (
            <View style={styles.searchBarContainer}>{BoundSearchBar}</View>
          )}

          {/* New thread button */}
          {showNewThreadButton && (
            <View style={styles.newButtonContainer}>{BoundNewButton}</View>
          )}

          {/* Section header */}
          {showSectionHeader && (
            <View style={styles.sectionHeaderContainer}>
              {BoundSectionHeader}
            </View>
          )}

          {/* Thread list */}
          <View style={styles.listContainer}>{BoundList}</View>

          {/* Footer */}
          {showFooter && BoundFooter}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================================================
// Namespace Sub-components
// ============================================================================

export namespace AjoraThreadDrawer {
  export const SearchBar: React.FC<AjoraThreadDrawerSearchBarProps> = ({
    value = "",
    onChangeText,
    placeholder = "Search",
    style,
    inputStyle,
    theme = DEFAULT_DRAWER_LIGHT_THEME,
  }) => (
    <View
      style={[
        styles.searchBar,
        {
          backgroundColor: theme.searchBackgroundColor,
          borderColor: theme.searchBorderColor,
          borderRadius: theme.borderRadius,
        },
        style,
      ]}
    >
      <Ionicons
        name="search-outline"
        size={20}
        color={theme.searchIconColor}
        style={styles.searchIcon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.searchPlaceholderColor}
        style={[
          styles.searchInput,
          { color: theme.searchTextColor },
          inputStyle,
        ]}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      {value.length > 0 && Platform.OS !== "ios" && (
        <Pressable
          onPress={() => onChangeText?.("")}
          style={styles.searchClearButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="close-circle"
            size={18}
            color={theme.searchIconColor}
          />
        </Pressable>
      )}
    </View>
  );

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

  export const SectionHeader: React.FC<AjoraThreadDrawerSectionHeaderProps> = ({
    title = "Conversations",
    isExpanded = true,
    onToggle,
    style,
    titleStyle,
    theme = DEFAULT_DRAWER_LIGHT_THEME,
  }) => (
    <Pressable
      onPress={onToggle}
      style={[styles.sectionHeader, style]}
      accessibilityRole="button"
      accessibilityState={{ expanded: isExpanded }}
    >
      <Text
        style={[
          styles.sectionHeaderTitle,
          { color: theme.sectionHeaderColor },
          titleStyle,
        ]}
      >
        {title}
      </Text>
      <Ionicons
        name={isExpanded ? "chevron-up" : "chevron-down"}
        size={18}
        color={theme.sectionChevronColor}
      />
    </Pressable>
  );

  export const NewButton: React.FC<AjoraThreadDrawerNewButtonProps> = ({
    style,
    textStyle,
    onPress,
    label = "New Chat",
    iconName = "create-outline",
    theme = DEFAULT_DRAWER_LIGHT_THEME,
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.newButton,
        {
          backgroundColor: pressed
            ? theme.newThreadButtonPressedBackgroundColor
            : theme.newThreadButtonBackgroundColor,
          borderColor: theme.newThreadButtonBorderColor,
          borderRadius: theme.borderRadius,
        },
        style,
      ]}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View style={styles.newButtonIconWrapper}>
        <Ionicons
          name={iconName}
          size={20}
          color={theme.newThreadButtonIconColor}
        />
      </View>
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

  export const Item: React.FC<AjoraThreadDrawerItemProps> = ({
    thread,
    isSelected = false,
    style,
    titleStyle,
    dateStyle,
    onPress,
    onLongPress,
    onMenuPress,
    onDelete,
    showMenuButton = true,
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
        dateStyle,
        onPress,
        onLongPress,
        onMenuPress,
        onDelete,
        showMenuButton,
        showSelectedIndicator,
        theme,
      });
    }

    const formattedDate = useMemo(() => {
      const date = thread.updatedAt || thread.createdAt;
      return formatThreadDate(date);
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
              : pressed
                ? theme.itemPressedBackgroundColor
                : theme.itemBackgroundColor,
            minHeight: theme.itemHeight,
            borderRadius: 8,
          },
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

        {/* Thread info */}
        <View style={styles.itemContent}>
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
            style={[styles.itemDate, { color: theme.itemDateColor }, dateStyle]}
            numberOfLines={1}
          >
            {formattedDate}
          </Text>
        </View>

        {/* Menu button */}
        {showMenuButton && (
          <Pressable
            onPress={() => onMenuPress?.(thread)}
            style={({ pressed }) => [
              styles.menuButton,
              pressed && styles.menuButtonPressed,
            ]}
            accessibilityLabel="Thread options"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color={theme.itemMenuIconColor}
            />
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
    onMenuPressThread,
    itemTheme = DEFAULT_DRAWER_LIGHT_THEME,
    renderItem,
    emptyComponent,
    searchFilter,
  }) => {
    if (threads.length === 0) {
      if (searchFilter && searchFilter.length > 0) {
        return (
          <View style={[styles.list, style]}>
            <View style={styles.emptyState}>
              <Ionicons
                name="search-outline"
                size={32}
                color={itemTheme.itemDateColor}
              />
              <Text
                style={[
                  styles.emptyStateTitle,
                  { color: itemTheme.itemTitleColor },
                ]}
              >
                No results found
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { color: itemTheme.itemDateColor },
                ]}
              >
                Try a different search term
              </Text>
            </View>
          </View>
        );
      }

      if (emptyComponent) {
        return <View style={[styles.list, style]}>{emptyComponent}</View>;
      }

      return (
        <View style={[styles.list, style]}>
          <View style={styles.emptyState}>
            <Ionicons
              name="chatbubbles-outline"
              size={32}
              color={itemTheme.itemDateColor}
            />
            <Text
              style={[
                styles.emptyStateTitle,
                { color: itemTheme.itemTitleColor },
              ]}
            >
              No conversations yet
            </Text>
            <Text
              style={[
                styles.emptyStateSubtitle,
                { color: itemTheme.itemDateColor },
              ]}
            >
              Start a new conversation to begin
            </Text>
          </View>
        </View>
      );
    }

    return (
      <ScrollView
        style={[styles.list, style]}
        contentContainerStyle={[styles.listContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {threads.map((thread) => (
          <AjoraThreadDrawer.Item
            key={thread.id}
            thread={thread}
            isSelected={thread.id === currentThreadId}
            onPress={onSelectThread}
            onLongPress={onLongPressThread}
            onMenuPress={onMenuPressThread}
            onDelete={onDeleteThread}
            showMenuButton={true}
            theme={itemTheme}
            renderItem={renderItem}
          />
        ))}
      </ScrollView>
    );
  };

  export const Footer: React.FC<AjoraThreadDrawerFooterProps> = ({
    userName = "User",
    userInitials,
    onSettingsPress,
    style,
    theme = DEFAULT_DRAWER_LIGHT_THEME,
  }) => {
    const initials = userInitials ?? userName.slice(0, 2).toUpperCase();

    return (
      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.footerBackgroundColor,
            borderTopColor: theme.footerBorderColor,
          },
          style,
        ]}
      >
        <View style={styles.footerContent}>
          <View
            style={[
              styles.userAvatar,
              { backgroundColor: theme.userAvatarBackgroundColor },
            ]}
          >
            <Text
              style={[
                styles.userInitials,
                { color: theme.userAvatarTextColor },
              ]}
            >
              {initials}
            </Text>
          </View>
          <Text
            style={[styles.userName, { color: theme.userNameColor }]}
            numberOfLines={1}
          >
            {userName}
          </Text>
        </View>
        {onSettingsPress && (
          <Pressable
            onPress={onSettingsPress}
            style={({ pressed }) => [
              styles.settingsButton,
              pressed && styles.settingsButtonPressed,
            ]}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color={theme.settingsIconColor}
            />
          </Pressable>
        )}
      </View>
    );
  };
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
    letterSpacing: -0.4,
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
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  searchClearButton: {
    padding: 4,
  },
  sectionHeaderContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  newButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  newButtonIconWrapper: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  newButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  listContainer: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 0,
    marginVertical: 0,
    position: "relative",
  },
  selectedIndicator: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  itemContent: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 0,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  itemTitleSelected: {
    fontWeight: "600",
  },
  itemDate: {
    fontSize: 14,
    letterSpacing: 0,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    marginLeft: 8,
  },
  menuButtonPressed: {
    backgroundColor: "rgba(0, 0, 0, 0.06)",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 4,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 0,
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  userInitials: {
    fontSize: 14,
    fontWeight: "600",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    letterSpacing: -0.2,
  },
  settingsButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  settingsButtonPressed: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
});

export default AjoraThreadDrawer;
