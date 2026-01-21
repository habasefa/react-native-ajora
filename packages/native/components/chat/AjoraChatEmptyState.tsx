import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Pressable,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome,
  FontAwesome5,
  FontAwesome6,
  Feather,
  AntDesign,
  Entypo,
  EvilIcons,
  Foundation,
  Octicons,
  SimpleLineIcons,
  Zocial,
} from "@expo/vector-icons";
import { renderSlot, WithSlots } from "../../lib/slots";
import {
  useAjoraChatConfiguration,
  AjoraChatDefaultLabels,
} from "../../providers/AjoraChatConfigurationProvider";
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";
import { Suggestion } from "../../../core";

// ============================================================================
// Types
// ============================================================================

/**
 * Color overrides for the empty state component
 */
export interface AjoraChatEmptyStateColors {
  /** Icon color */
  icon?: string;
  /** Title text color */
  title?: string;
  /** Subtitle text color */
  subtitle?: string;
  /** Suggestion card background color */
  suggestionBackground?: string;
  /** Suggestion card text color */
  suggestionText?: string;
  /** Suggestion card subtitle/description color */
  suggestionSubtitle?: string;
  /** Suggestion card border color */
  suggestionBorder?: string;
  /** Suggestion card icon color */
  suggestionIcon?: string;
  /** Suggestion card icon background color */
  suggestionIconBackground?: string;
  /** Suggestion card arrow color */
  suggestionArrow?: string;
  /** Background color */
  background?: string;
}

// ============================================================================
// Icon Types & Components
// ============================================================================

/**
 * Supported icon families from @expo/vector-icons (for internal use)
 */
type IconFamily =
  | "Ionicons"
  | "MaterialIcons"
  | "MaterialCommunityIcons"
  | "FontAwesome"
  | "FontAwesome5"
  | "FontAwesome6"
  | "Feather"
  | "AntDesign"
  | "Entypo"
  | "EvilIcons"
  | "Foundation"
  | "Octicons"
  | "SimpleLineIcons"
  | "Zocial";

/**
 * Icon component map for rendering different icon families
 */
const ICON_COMPONENTS: Record<IconFamily, React.ComponentType<any>> = {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome,
  FontAwesome5,
  FontAwesome6,
  Feather,
  AntDesign,
  Entypo,
  EvilIcons,
  Foundation,
  Octicons,
  SimpleLineIcons,
  Zocial,
};

/** Default icon family */
const DEFAULT_ICON_FAMILY: IconFamily = "Ionicons";

/** Default icon used when no icon is specified */
const DEFAULT_SUGGESTION_ICON = "sparkles-outline";

/**
 * Render an icon from any supported icon family
 */
function renderIcon(
  name: string,
  family: IconFamily = DEFAULT_ICON_FAMILY,
  size: number = 20,
  color: string = "#3B82F6",
): React.ReactNode {
  const IconComponent = ICON_COMPONENTS[family] || Ionicons;
  return <IconComponent name={name} size={size} color={color} />;
}

// ============================================================================
// Sub-component Types
// ============================================================================

export interface AjoraChatEmptyStateIconProps {
  name?: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export interface AjoraChatEmptyStateTitleProps {
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export interface AjoraChatEmptyStateSubtitleProps {
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export interface AjoraChatEmptyStateSuggestionProps {
  suggestion: Suggestion;
  onPress?: (suggestion: Suggestion) => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  colors?: AjoraChatEmptyStateColors;
  /** Override icon name for this suggestion */
  icon?: string;
  /** Override icon family for this suggestion */
  iconFamily?: IconFamily;
  /** Show subtitle/description */
  showDescription?: boolean;
}

export interface AjoraChatEmptyStateSuggestionsProps {
  suggestions?: Suggestion[];
  onSelectSuggestion?: (suggestion: Suggestion) => void;
  style?: StyleProp<ViewStyle>;
  colors?: AjoraChatEmptyStateColors;
}

// ============================================================================
// Slot Types
// ============================================================================

type EmptyStateSlots = {
  icon: typeof AjoraChatEmptyState.Icon;
  title: typeof AjoraChatEmptyState.Title;
  subtitle: typeof AjoraChatEmptyState.Subtitle;
  suggestions: typeof AjoraChatEmptyState.Suggestions;
};

type EmptyStateRestProps = {
  /** Custom icon name */
  iconName?: keyof typeof Ionicons.glyphMap;
  /** Custom title text */
  title?: string;
  /** Custom subtitle text */
  subtitle?: string;
  /** Starter suggestions to show */
  suggestions?: Suggestion[];
  /** Callback when a suggestion is selected */
  onSelectSuggestion?: (suggestion: Suggestion) => void;
  /** Color overrides */
  colors?: AjoraChatEmptyStateColors;
  /** Icon size */
  iconSize?: number;
  /** Container style */
  style?: StyleProp<ViewStyle>;
};

export type AjoraChatEmptyStateProps = WithSlots<
  EmptyStateSlots,
  EmptyStateRestProps
>;

// ============================================================================
// Main Component
// ============================================================================

export function AjoraChatEmptyState({
  iconName = "sparkles",
  title,
  subtitle,
  suggestions,
  onSelectSuggestion,
  colors: colorOverrides,
  iconSize = 56,
  style,
  icon,
  title: titleSlot,
  subtitle: subtitleSlot,
  suggestions: suggestionsSlot,
  children,
  ...rest
}: AjoraChatEmptyStateProps) {
  const configuration = useAjoraChatConfiguration();
  const theme = useAjoraTheme();

  // ========================================================================
  // Theme - Priority: colorOverrides > global theme (user custom > default)
  // ========================================================================

  const colors = React.useMemo(
    () => ({
      icon: colorOverrides?.icon ?? theme.colors.primary,
      title: colorOverrides?.title ?? theme.colors.text,
      subtitle: colorOverrides?.subtitle ?? theme.colors.textSecondary,
      suggestionBackground:
        colorOverrides?.suggestionBackground ?? theme.colors.surface,
      suggestionText: colorOverrides?.suggestionText ?? theme.colors.text,
      suggestionSubtitle:
        colorOverrides?.suggestionSubtitle ?? theme.colors.textSecondary,
      suggestionBorder: colorOverrides?.suggestionBorder ?? theme.colors.border,
      suggestionIcon: colorOverrides?.suggestionIcon ?? theme.colors.primary,
      suggestionIconBackground:
        colorOverrides?.suggestionIconBackground ??
        theme.colors.assistantBubble,
      suggestionArrow:
        colorOverrides?.suggestionArrow ?? theme.colors.textSecondary,
      background: colorOverrides?.background ?? "transparent",
    }),
    [theme, colorOverrides],
  );

  // Resolve labels
  const resolvedTitle =
    title ??
    configuration?.labels.chatEmptyStateTitle ??
    AjoraChatDefaultLabels.chatEmptyStateTitle ??
    "How can I help you today?";

  const resolvedSubtitle =
    subtitle ??
    configuration?.labels.chatEmptyStateSubtitle ??
    AjoraChatDefaultLabels.chatEmptyStateSubtitle;

  // Render slots
  const BoundIcon = renderSlot(icon, AjoraChatEmptyState.Icon, {
    name: iconName,
    size: iconSize,
    color: colors.icon,
  });

  const BoundTitle = renderSlot(titleSlot, AjoraChatEmptyState.Title, {
    children: resolvedTitle,
    style: { color: colors.title },
  });

  const BoundSubtitle = resolvedSubtitle
    ? renderSlot(subtitleSlot, AjoraChatEmptyState.Subtitle, {
        children: resolvedSubtitle,
        style: { color: colors.subtitle },
      })
    : null;

  const hasSuggestions = suggestions && suggestions.length > 0;
  const BoundSuggestions = hasSuggestions
    ? renderSlot(suggestionsSlot, AjoraChatEmptyState.Suggestions, {
        suggestions,
        onSelectSuggestion,
        colors,
      })
    : null;

  // Render function children pattern
  if (children) {
    return (
      <React.Fragment>
        {children({
          icon: BoundIcon,
          title: BoundTitle,
          subtitle: BoundSubtitle ?? <></>,
          suggestions: BoundSuggestions ?? <></>,
          ...rest,
        })}
      </React.Fragment>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }, style]}
      {...rest}
    >
      {BoundIcon}
      <View style={styles.textContainer}>
        {BoundTitle}
        {BoundSubtitle}
      </View>
      {BoundSuggestions}
    </View>
  );
}

// ============================================================================
// Namespace Sub-components
// ============================================================================

export namespace AjoraChatEmptyState {
  export const Icon: React.FC<AjoraChatEmptyStateIconProps> = ({
    name = "sparkles",
    size = 56,
    color = "#3B82F6", // primary
    style,
  }) => (
    <View style={[styles.iconContainer, style]}>
      <View style={[styles.iconGlow, { backgroundColor: color + "15" }]}>
        <Ionicons name={name} size={size} color={color} />
      </View>
    </View>
  );

  export const Title: React.FC<AjoraChatEmptyStateTitleProps> = ({
    children,
    style,
  }) => (
    <Text style={[styles.title, style]} accessibilityRole="header">
      {children}
    </Text>
  );

  export const Subtitle: React.FC<AjoraChatEmptyStateSubtitleProps> = ({
    children,
    style,
  }) => <Text style={[styles.subtitle, style]}>{children}</Text>;

  export const Suggestion: React.FC<AjoraChatEmptyStateSuggestionProps> = ({
    suggestion,
    onPress,
    style,
    textStyle,
    colors,
    icon,
    iconFamily,
    showDescription = true,
  }) => {
    const resolvedIcon = icon ?? suggestion.icon ?? DEFAULT_SUGGESTION_ICON;
    const resolvedIconFamily = (iconFamily ??
      suggestion.iconFamily ??
      DEFAULT_ICON_FAMILY) as IconFamily;
    const title = suggestion.title || suggestion.message;
    const description = suggestion.title ? suggestion.message : null;

    return (
      <Pressable
        onPress={() => onPress?.(suggestion)}
        style={({ pressed }) => [
          styles.suggestionCard,
          {
            backgroundColor: colors?.suggestionBackground,
            borderColor: colors?.suggestionBorder,
          },
          pressed && styles.suggestionCardPressed,
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {/* Icon */}
        <View
          style={[
            styles.suggestionIconWrapper,
            { backgroundColor: colors?.suggestionIconBackground },
          ]}
        >
          {renderIcon(
            resolvedIcon,
            resolvedIconFamily,
            20,
            colors?.suggestionIcon,
          )}
        </View>

        {/* Text content */}
        <View style={styles.suggestionTextContainer}>
          <Text
            style={[
              styles.suggestionTitle,
              { color: colors?.suggestionText },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {showDescription && description && (
            <Text
              style={[
                styles.suggestionDescription,
                { color: colors?.suggestionSubtitle },
              ]}
              numberOfLines={1}
            >
              {description}
            </Text>
          )}
        </View>

        {/* Arrow indicator */}
        <View style={styles.suggestionArrow}>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors?.suggestionArrow}
          />
        </View>
      </Pressable>
    );
  };

  export const Suggestions: React.FC<AjoraChatEmptyStateSuggestionsProps> = ({
    suggestions = [],
    onSelectSuggestion,
    style,
    colors,
  }) => {
    if (suggestions.length === 0) return null;

    return (
      <View style={[styles.suggestionsContainer, style]}>
        {suggestions.map((suggestion, index) => (
          <AjoraChatEmptyState.Suggestion
            key={suggestion.id ?? `suggestion-${index}`}
            suggestion={suggestion}
            onPress={onSelectSuggestion}
            colors={colors}
          />
        ))}
      </View>
    );
  };
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGlow: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 32,
    maxWidth: 320,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  suggestionsContainer: {
    width: "100%",
    maxWidth: 400,
    gap: 10,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
    marginLeft: 4,
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 72,
  },
  suggestionCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  suggestionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  suggestionTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  suggestionDescription: {
    fontSize: 14,
    marginTop: 3,
  },
  suggestionArrow: {
    marginLeft: 10,
    opacity: 0.6,
  },
});

export default AjoraChatEmptyState;
