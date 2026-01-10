// @ts-nocheck
import * as React from "react";
import { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { renderSlot, WithSlots } from "../../lib/slots";
import {
  useAjoraChatConfiguration,
  AjoraChatDefaultLabels,
} from "../../providers/AjoraChatConfigurationProvider";
import { useAjoraThreadContext } from "../../providers/AjoraThreadProvider";

// ============================================================================
// Types
// ============================================================================

/**
 * Theme configuration for the chat header
 */
export interface AjoraChatHeaderTheme {
  /** Background color of the header */
  backgroundColor?: string;
  /** Border color at the bottom */
  borderColor?: string;
  /** Title text color */
  titleColor?: string;
  /** Subtitle text color */
  subtitleColor?: string;
  /** Icon color */
  iconColor?: string;
  /** Icon color when pressed */
  iconPressedColor?: string;
  /** Button background color */
  buttonBackgroundColor?: string;
  /** Button background color when pressed */
  buttonPressedBackgroundColor?: string;
  /** Header height */
  height?: number;
  /** Horizontal padding */
  paddingHorizontal?: number;
}

/**
 * Default light theme for the header
 */
export const DEFAULT_HEADER_LIGHT_THEME: AjoraChatHeaderTheme = {
  backgroundColor: "#FFFFFF",
  borderColor: "#E5E5EA",
  titleColor: "#000000",
  subtitleColor: "#8E8E93",
  iconColor: "#000000",
  iconPressedColor: "#6B7280",
  buttonBackgroundColor: "transparent",
  buttonPressedBackgroundColor: "rgba(0, 0, 0, 0.05)",
  height: 56,
  paddingHorizontal: 12,
};

/**
 * Default dark theme for the header
 */
export const DEFAULT_HEADER_DARK_THEME: AjoraChatHeaderTheme = {
  backgroundColor: "#1C1C1E",
  borderColor: "#38383A",
  titleColor: "#FFFFFF",
  subtitleColor: "#8E8E93",
  iconColor: "#FFFFFF",
  iconPressedColor: "#A0A0A0",
  buttonBackgroundColor: "transparent",
  buttonPressedBackgroundColor: "rgba(255, 255, 255, 0.1)",
  height: 56,
  paddingHorizontal: 12,
};

// ============================================================================
// Sub-component Types
// ============================================================================

export interface AjoraChatHeaderMenuButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<TextStyle>;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  accessibilityLabel?: string;
}

export interface AjoraChatHeaderTitleProps {
  title?: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
  showChevron?: boolean;
}

export interface AjoraChatHeaderNewThreadButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<TextStyle>;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  accessibilityLabel?: string;
}

// ============================================================================
// Slot Types
// ============================================================================

type HeaderSlots = {
  menuButton: typeof AjoraChatHeader.MenuButton;
  titleContent: typeof AjoraChatHeader.Title;
  newThreadButton: typeof AjoraChatHeader.NewThreadButton;
};

type HeaderRestProps = {
  /** Override the title text */
  title?: string;
  /** Subtitle text (e.g., agent name or status) */
  subtitle?: string;
  /** Theme configuration */
  theme?: AjoraChatHeaderTheme;
  /** Custom style for the header container */
  style?: StyleProp<ViewStyle>;
  /** Whether to show the menu button */
  showMenuButton?: boolean;
  /** Whether to show the new thread button */
  showNewThreadButton?: boolean;
  /** Callback when menu button is pressed */
  onMenuPress?: () => void;
  /** Callback when new thread button is pressed */
  onNewThreadPress?: () => void;
  /** Callback when title is pressed */
  onTitlePress?: () => void;
};

export type AjoraChatHeaderProps = WithSlots<HeaderSlots, HeaderRestProps>;

// ============================================================================
// Main Component
// ============================================================================

export function AjoraChatHeader({
  title,
  subtitle,
  theme = DEFAULT_HEADER_LIGHT_THEME,
  style,
  showMenuButton = true,
  showNewThreadButton = true,
  onMenuPress,
  onNewThreadPress,
  onTitlePress,
  menuButton,
  titleContent,
  newThreadButton,
  children,
  ...rest
}: AjoraChatHeaderProps) {
  const configuration = useAjoraChatConfiguration();
  const threadContext = useAjoraThreadContext();

  // Resolve title from props, thread context, or default
  const resolvedTitle =
    title ??
    threadContext?.currentThread?.name ??
    configuration?.labels.chatHeaderTitle ??
    AjoraChatDefaultLabels.chatHeaderTitle ??
    "Chat";

  const resolvedSubtitle = subtitle ?? threadContext?.currentThread?.subtitle;

  // Resolve handlers - prefer props, then thread context
  const handleMenuPress = useCallback(() => {
    if (onMenuPress) {
      onMenuPress();
    } else if (threadContext) {
      threadContext.toggleDrawer();
    }
  }, [onMenuPress, threadContext]);

  const handleNewThreadPress = useCallback(() => {
    if (onNewThreadPress) {
      onNewThreadPress();
    } else if (threadContext) {
      threadContext.createThread();
    }
  }, [onNewThreadPress, threadContext]);

  const handleTitlePress = useCallback(() => {
    if (onTitlePress) {
      onTitlePress();
    }
  }, [onTitlePress]);

  // Render slots
  const BoundMenuButton = renderSlot(menuButton, AjoraChatHeader.MenuButton, {
    onPress: handleMenuPress,
    iconColor: theme.iconColor,
  });

  const BoundTitle = renderSlot(titleContent, AjoraChatHeader.Title, {
    title: resolvedTitle,
    subtitle: resolvedSubtitle,
    titleStyle: { color: theme.titleColor },
    subtitleStyle: { color: theme.subtitleColor },
    onPress: onTitlePress ? handleTitlePress : undefined,
    showChevron: !!onTitlePress,
  });

  const BoundNewThreadButton = renderSlot(
    newThreadButton,
    AjoraChatHeader.NewThreadButton,
    {
      onPress: handleNewThreadPress,
      iconColor: theme.iconColor,
    }
  );

  // Render function children pattern
  if (children) {
    return (
      <React.Fragment>
        {children({
          menuButton: BoundMenuButton,
          titleContent: BoundTitle,
          newThreadButton: BoundNewThreadButton,
          title: resolvedTitle,
          subtitle: resolvedSubtitle,
          ...rest,
        })}
      </React.Fragment>
    );
  }

  const containerStyle = [
    styles.header,
    {
      backgroundColor: theme.backgroundColor,
      borderBottomColor: theme.borderColor,
      height: theme.height,
      paddingHorizontal: theme.paddingHorizontal,
    },
    style,
  ];

  return (
    <View style={containerStyle} {...rest}>
      {/* Left section - Menu button */}
      <View style={styles.leftSection}>
        {showMenuButton && BoundMenuButton}
      </View>

      {/* Center section - Title */}
      <View style={styles.centerSection}>{BoundTitle}</View>

      {/* Right section - New thread button */}
      <View style={styles.rightSection}>
        {showNewThreadButton && BoundNewThreadButton}
      </View>
    </View>
  );
}

// ============================================================================
// Namespace Sub-components (following AjoraModalHeader pattern)
// ============================================================================

export namespace AjoraChatHeader {
  export const MenuButton: React.FC<AjoraChatHeaderMenuButtonProps> = ({
    onPress,
    style,
    iconName = "menu",
    iconSize = 24,
    iconColor = "#000000",
    accessibilityLabel = "Open menu",
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && styles.iconButtonPressed,
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Ionicons name={iconName} size={iconSize} color={iconColor} />
    </Pressable>
  );

  export const Title: React.FC<AjoraChatHeaderTitleProps> = ({
    title,
    subtitle,
    style,
    titleStyle,
    subtitleStyle,
    onPress,
    showChevron = false,
  }) => {
    const content = (
      <View style={[styles.titleContainer, style]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
          {showChevron && (
            <Ionicons
              name="chevron-down"
              size={16}
              color="#8E8E93"
              style={styles.titleChevron}
            />
          )}
        </View>
        {subtitle && (
          <Text style={[styles.subtitle, subtitleStyle]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    );

    if (onPress) {
      return (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [pressed && styles.titlePressed]}
          accessibilityRole="button"
          accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ""}`}
        >
          {content}
        </Pressable>
      );
    }

    return content;
  };

  export const NewThreadButton: React.FC<
    AjoraChatHeaderNewThreadButtonProps
  > = ({
    onPress,
    style,
    iconName = "create-outline",
    iconSize = 24,
    iconColor = "#000000",
    accessibilityLabel = "Create new thread",
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && styles.iconButtonPressed,
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Ionicons name={iconName} size={iconSize} color={iconColor} />
    </Pressable>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftSection: {
    width: 48,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  rightSection: {
    width: 48,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  iconButtonPressed: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  titleContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  titleChevron: {
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
  titlePressed: {
    opacity: 0.7,
  },
});

export default AjoraChatHeader;
