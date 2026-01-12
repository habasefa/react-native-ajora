import { Platform } from "react-native";

// The base styles as defined.
export const baseStyles = {
  // The main container
  body: {
    fontSize: 16,
  },

  // Headings
  heading1: {
    flexDirection: "row",
    fontSize: 32,
  },
  heading2: {
    flexDirection: "row",
    fontSize: 24,
  },
  heading3: {
    flexDirection: "row",
    fontSize: 18,
  },
  heading4: {
    flexDirection: "row",
    fontSize: 16,
  },
  heading5: {
    flexDirection: "row",
    fontSize: 13,
  },
  heading6: {
    flexDirection: "row",
    fontSize: 11,
  },

  // Horizontal Rule
  hr: {
    backgroundColor: "#000000",
    height: 1,
  },

  // Emphasis
  strong: {
    fontWeight: "bold",
  },
  em: {
    fontStyle: "italic",
  },
  s: {
    textDecorationLine: "line-through",
  },

  // Blockquotes
  blockquote: {
    backgroundColor: "#black",
    borderColor: "#CCC",
    borderLeftWidth: 4,
    marginLeft: 5,
    paddingHorizontal: 5,
  },

  // Lists
  bullet_list: {},
  ordered_list: {},
  list_item: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  bullet_list_icon: {
    marginLeft: 10,
    marginRight: 10,
  },
  bullet_list_content: {
    flex: 1,
  },
  ordered_list_icon: {
    marginLeft: 10,
    marginRight: 10,
  },
  ordered_list_content: {
    flex: 1,
  },

  // Code
  code_inline: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 4,
    ...Platform.select({
      ios: { fontFamily: "Courier" },
      android: { fontFamily: "monospace" },
    }),
  },
  code_block: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 4,
    ...Platform.select({
      ios: { fontFamily: "Courier" },
      android: { fontFamily: "monospace" },
    }),
  },
  fence: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 4,
    ...Platform.select({
      ios: { fontFamily: "Courier" },
      android: { fontFamily: "monospace" },
    }),
  },

  // Tables
  table: {
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 3,
  },
  thead: {},
  tbody: {},
  th: {
    flex: 1,
    padding: 5,
  },
  tr: {
    borderBottomWidth: 1,
    borderColor: "white",
    flexDirection: "row",
  },
  td: {
    flex: 1,
    padding: 5,
  },

  // Links
  link: {
    textDecorationLine: "underline",
    color: "blue",
  },
  blocklink: {
    flex: 1,
    borderColor: "#000000",
    borderBottomWidth: 1,
    color: "blue",
  },

  // Images
  image: {
    flex: 1,
  },

  // Text Output
  text: {},
  textgroup: {},
  paragraph: {
    marginTop: 10,
    marginBottom: 10,
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

/**
 * Returns a new styles object.
 *
 * @param color - the color to apply to text-based styles
 * @param overrides - an optional object containing style overrides for specific keys
 */
export function createMarkdownStyles(
  color: string,
  overrides: Partial<typeof baseStyles> = {}
) {
  // Define which keys should have their text color overridden.
  const textKeys = [
    "body",
    "heading1",
    "heading2",
    "heading3",
    "heading4",
    "heading5",
    "heading6",
    "strong",
    "em",
    "s",
    "blockquote",
    "text",
    "paragraph",
    "code_inline",
    "code_block",
    "fence",
    "link",
    "blocklink",
    "span",
  ];

  // Loop through each key in baseStyles, merging the override (if any) and applying color if key is in textKeys.
  const newStyles: Record<string, any> = {};
  for (const key in baseStyles) {
    newStyles[key] = {
      ...baseStyles[key as keyof typeof baseStyles],
      ...(overrides[key as keyof typeof baseStyles] || {}),
      ...(textKeys.includes(key) ? { color } : {}), // Apply the color only if it's a text-related style.
    };
  }

  return newStyles;
}
