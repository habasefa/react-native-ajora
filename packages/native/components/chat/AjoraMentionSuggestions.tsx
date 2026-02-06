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
  loading?: boolean;
  SuggestionItem?: React.ComponentType<any>;
  maxSuggestions?: number;
}

export const AjoraMentionSuggestions: FC<AjoraMentionSuggestionsProps> = ({
  keyword,
  onSelect,
  suggestions = [],
  theme: customTheme,
  loading,
  SuggestionItem,
  maxSuggestions = 6,
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

  const filteredSuggestions = suggestions
    .filter((one) =>
      one.name.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()),
    )
    .slice(0, maxSuggestions);

  if (filteredSuggestions.length === 0 && !loading) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
        customTheme?.container,
      ]}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        filteredSuggestions.map((one) => {
          if (SuggestionItem) {
            return (
              <Pressable key={one.id} onPress={() => onSelect(one)}>
                <SuggestionItem item={one} onSelect={onSelect} />
              </Pressable>
            );
          }
          return (
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
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    marginBottom: 16,
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
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
