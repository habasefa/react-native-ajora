import React, { FC } from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SuggestionsProvidedProps } from "react-native-controlled-mentions";
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";
import { Ionicons } from "@expo/vector-icons";

export interface MentionSuggestion {
  id: string;
  name: string;
  image?: string;
  subtitle?: string; // e.g. "Agent" or "User"
  icon?: keyof typeof Ionicons.glyphMap;
}

export interface AjoraMentionSuggestionsTheme {
  container?: StyleProp<ViewStyle>;
  item?: StyleProp<ViewStyle>;
  itemText?: StyleProp<TextStyle>;
  itemSubtitle?: StyleProp<TextStyle>;
  colors?: {
    background?: string;
    text?: string;
    subtitle?: string;
    border?: string;
    highlight?: string;
  };
}

export interface AjoraMentionSuggestionsProps extends Omit<
  SuggestionsProvidedProps,
  "onSelect"
> {
  suggestions?: MentionSuggestion[];
  theme?: AjoraMentionSuggestionsTheme;
  onSelect: (suggestion: MentionSuggestion) => void;
  maxHeight?: number;
  SuggestionItem?: React.ComponentType<{
    item: MentionSuggestion;
    onSelect: (suggestion: MentionSuggestion) => void;
  }>;
  isLoading?: boolean;
}

export const AjoraMentionSuggestions: FC<AjoraMentionSuggestionsProps> = ({
  keyword,
  onSelect,
  suggestions = [],
  theme: customTheme,
  SuggestionItem,
  isLoading,
}) => {
  const globalTheme = useAjoraTheme();

  const colors = {
    background: customTheme?.colors?.background ?? globalTheme.colors.surface,
    text: customTheme?.colors?.text ?? globalTheme.colors.text,
    subtitle: customTheme?.colors?.subtitle ?? globalTheme.colors.textSecondary,
    border: customTheme?.colors?.border ?? globalTheme.colors.border,
    highlight:
      customTheme?.colors?.highlight ?? globalTheme.colors.itemSelected,
  };

  if (keyword == null) {
    return null;
  }

  const filteredSuggestions = suggestions.filter((one) =>
    one.name.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()),
  );

  const shouldShow =
    isLoading ||
    filteredSuggestions.length > 0 ||
    (keyword && keyword.length > 0);

  if (!shouldShow) {
    return null;
  }

  const hasSuggestions = filteredSuggestions.length > 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          minHeight: hasSuggestions || isLoading ? undefined : 150,
        },
        customTheme?.container,
      ]}
    >
      {isLoading && !hasSuggestions ? (
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: colors.background, minHeight: 150 },
          ]}
        >
          <ActivityIndicator size="small" color={globalTheme.colors.primary} />
        </View>
      ) : hasSuggestions ? (
        filteredSuggestions.map((one) =>
          SuggestionItem ? (
            <SuggestionItem
              key={one.id}
              item={one}
              onSelect={() => onSelect(one)}
            />
          ) : (
            <Pressable
              key={one.id}
              onPress={() => onSelect(one)}
              style={({ pressed }) => [
                styles.item,
                pressed && { backgroundColor: colors.highlight },
                customTheme?.item,
              ]}
            >
              <View style={styles.contentContainer}>
                {one.icon && (
                  <Ionicons
                    name={one.icon}
                    size={20}
                    color={colors.text}
                    style={styles.icon}
                  />
                )}
                <View>
                  <Text
                    style={[
                      styles.name,
                      { color: colors.text },
                      customTheme?.itemText,
                    ]}
                  >
                    {one.name}
                  </Text>
                  {one.subtitle && (
                    <Text
                      style={[
                        styles.subtitle,
                        { color: colors.subtitle },
                        customTheme?.itemSubtitle,
                      ]}
                    >
                      {one.subtitle}
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          ),
        )
      ) : (
        <View style={styles.emptyStateContainer}>
          <View
            style={[
              styles.emptyStateIcon,
              { backgroundColor: globalTheme.colors.surface },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={24}
              color={globalTheme.colors.placeholder}
            />
          </View>
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
            No Results Found
          </Text>
          <Text style={[styles.emptyStateSubtitle, { color: colors.subtitle }]}>
            Try adjusting your search terms
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: "100%",
    left: -16,
    right: -16,
    marginBottom: 8,
    transform: [{ translateY: -10 }],
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  item: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
  },
  emptyStateIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.8,
  },
});
