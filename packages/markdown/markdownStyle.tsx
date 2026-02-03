import { Platform, StyleSheet, TextStyle, ViewStyle } from "react-native";
import { AjoraTheme } from "../native/providers/AjoraThemeProvider";

// Define the shape of the styles object compatible with react-native-markdown-display
type MarkdownStyle = {
  [key: string]: ViewStyle | TextStyle;
};

/**
 * Returns a new styles object based on the Ajora Theme.
 *
 * @param theme - the AjoraTheme object
 * @param overrides - an optional object containing style overrides for specific keys
 */
export function createMarkdownStyles(
  theme: AjoraTheme,
  overrides: MarkdownStyle = {},
): MarkdownStyle {
  const { colors, typography, borderRadius } = theme;

  const baseStyles: MarkdownStyle = {
    // The main container
    body: {
      fontSize: typography.sizes.md,
      color: colors.text,
      fontFamily: typography.regular,
    },

    // Headings
    heading1: {
      flexDirection: "row",
      fontSize: typography.sizes.xxl,
      color: colors.text,
      fontWeight: "bold",
      marginVertical: 10,
    },
    heading2: {
      flexDirection: "row",
      fontSize: typography.sizes.xl,
      color: colors.text,
      fontWeight: "bold",
      marginVertical: 8,
    },
    heading3: {
      flexDirection: "row",
      fontSize: typography.sizes.lg,
      color: colors.text,
      fontWeight: "bold",
      marginVertical: 6,
    },
    heading4: {
      flexDirection: "row",
      fontSize: typography.sizes.md,
      color: colors.text,
      fontWeight: "bold",
      marginVertical: 4,
    },
    heading5: {
      flexDirection: "row",
      fontSize: typography.sizes.sm,
      color: colors.text,
      fontWeight: "bold",
      marginVertical: 2,
    },
    heading6: {
      flexDirection: "row",
      fontSize: typography.sizes.xs,
      color: colors.textSecondary,
      fontWeight: "bold",
      marginVertical: 2,
    },

    // Horizontal Rule
    hr: {
      backgroundColor: colors.border,
      height: 1,
      marginVertical: 8,
    },

    // Emphasis
    strong: {
      fontWeight: "bold",
      color: colors.text,
    },
    em: {
      fontStyle: "italic",
      color: colors.text,
    },
    s: {
      textDecorationLine: "line-through",
      color: colors.textSecondary,
    },

    // Blockquotes
    blockquote: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderLeftWidth: 4,
      marginLeft: 5,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginVertical: 8,
      borderRadius: borderRadius.sm,
    },

    // Lists
    bullet_list: {},
    ordered_list: {},
    list_item: {
      flexDirection: "row",
      justifyContent: "flex-start",
      marginVertical: 2,
    },
    bullet_list_icon: {
      marginLeft: 10,
      marginRight: 10,
      color: colors.text,
      fontSize: typography.sizes.md,
    },
    bullet_list_content: {
      flex: 1,
    },
    ordered_list_icon: {
      marginLeft: 10,
      marginRight: 10,
      color: colors.text,
      fontSize: typography.sizes.md,
    },
    ordered_list_content: {
      flex: 1,
    },

    // Code
    code_inline: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 4,
      borderRadius: borderRadius.sm,
      color: colors.primary,
      ...Platform.select({
        ios: { fontFamily: "Courier" },
        android: { fontFamily: "monospace" },
      }),
    },
    code_block: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: borderRadius.md,
      color: colors.text,
      marginVertical: 8,
      ...Platform.select({
        ios: { fontFamily: "Courier" },
        android: { fontFamily: "monospace" },
      }),
    },
    fence: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: borderRadius.md,
      color: colors.text,
      marginVertical: 8,
      ...Platform.select({
        ios: { fontFamily: "Courier" },
        android: { fontFamily: "monospace" },
      }),
    },

    // Tables
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.sm,
      marginVertical: 8,
    },
    thead: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tbody: {},
    th: {
      flex: 1,
      padding: 8,
      color: colors.text,
      fontWeight: "bold",
    },
    tr: {
      borderBottomWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
    },
    td: {
      flex: 1,
      padding: 8,
      color: colors.text,
    },

    // Links
    link: {
      textDecorationLine: "underline",
      color: colors.primary,
    },
    blocklink: {
      flex: 1,
      borderColor: colors.border,
      borderBottomWidth: 1,
      color: colors.primary,
    },

    // Images
    image: {
      flex: 1,
    },

    // Text Output
    text: {
      color: colors.text,
    },
    textgroup: {},
    paragraph: {
      marginTop: 8,
      marginBottom: 8,
      flexWrap: "wrap",
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      width: "100%",
    },
    hardbreak: {
      width: "100%",
      height: 1,
    },
    softbreak: {},

    // Others (not used)
    pre: {},
    inline: {},
    span: {},
  };

  return StyleSheet.create({
    ...baseStyles,
    ...overrides,
  });
}
