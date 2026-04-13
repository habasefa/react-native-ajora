import { Platform } from "react-native";

/**
 * Style shape for EnrichedMarkdownText's `markdownStyle` prop.
 */
export interface MarkdownStyle {
  h1?: { fontSize?: number; fontWeight?: string; color?: string; marginTop?: number; marginBottom?: number };
  h2?: { fontSize?: number; fontWeight?: string; color?: string; marginTop?: number; marginBottom?: number };
  h3?: { fontSize?: number; fontWeight?: string; color?: string; marginTop?: number; marginBottom?: number };
  h4?: { fontSize?: number; fontWeight?: string; color?: string; marginTop?: number; marginBottom?: number };
  h5?: { fontSize?: number; fontWeight?: string; color?: string; marginTop?: number; marginBottom?: number };
  h6?: { fontSize?: number; fontWeight?: string; color?: string; marginTop?: number; marginBottom?: number };
  paragraph?: { fontSize?: number; color?: string; marginTop?: number; marginBottom?: number; lineHeight?: number };
  strong?: { fontWeight?: string; color?: string };
  emphasis?: { fontStyle?: string; color?: string };
  strikethrough?: { color?: string };
  blockquote?: { borderColor?: string; borderWidth?: number; backgroundColor?: string; color?: string };
  list?: { bulletColor?: string; markerColor?: string; gapWidth?: number; marginLeft?: number; color?: string };
  inlineCode?: { fontFamily?: string; fontSize?: number; color?: string; backgroundColor?: string; borderColor?: string };
  codeBlock?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderRadius?: number;
    borderWidth?: number;
    padding?: number;
  };
  link?: { color?: string; underline?: boolean };
  table?: {
    fontSize?: number;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    headerBackgroundColor?: string;
    headerFontFamily?: string;
    cellPaddingHorizontal?: number;
    cellPaddingVertical?: number;
  };
  thematicBreak?: { color?: string; height?: number; marginTop?: number; marginBottom?: number };
  image?: { height?: number; borderRadius?: number; marginTop?: number; marginBottom?: number };
  math?: { fontSize?: number; color?: string; backgroundColor?: string; padding?: number };
  inlineMath?: { color?: string };
  taskList?: { checkedColor?: string; borderColor?: string; checkmarkColor?: string };
}

const monoFont = Platform.select({
  ios: "Courier",
  android: "monospace",
  default: "monospace",
});

export const baseStyles: MarkdownStyle = {
  h1: { fontSize: 32, fontWeight: "bold" },
  h2: { fontSize: 24, fontWeight: "bold" },
  h3: { fontSize: 18, fontWeight: "bold" },
  h4: { fontSize: 16, fontWeight: "bold" },
  h5: { fontSize: 13, fontWeight: "bold" },
  h6: { fontSize: 11, fontWeight: "bold" },
  paragraph: { fontSize: 16, marginTop: 10, marginBottom: 10 },
  strong: { fontWeight: "bold" },
  emphasis: { fontStyle: "italic" },
  blockquote: { borderColor: "#CCC", borderWidth: 4 },
  list: { marginLeft: 10 },
  inlineCode: {
    fontFamily: monoFont,
    backgroundColor: "#f5f5f5",
    borderColor: "#CCCCCC",
  },
  codeBlock: {
    fontFamily: monoFont,
    backgroundColor: "#f5f5f5",
    borderColor: "#CCCCCC",
    borderRadius: 4,
    padding: 10,
  },
  link: { color: "blue", underline: true },
  table: { borderColor: "white" },
  thematicBreak: { color: "#000000", height: 1 },
};

/**
 * Keys whose `color` property should be set to the given text color.
 */
const textColorKeys: (keyof MarkdownStyle)[] = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "paragraph", "strong", "emphasis", "strikethrough",
  "blockquote", "list", "inlineCode", "codeBlock",
];

/**
 * Returns a MarkdownStyle object with the given text color applied to
 * all text-bearing keys, merged with optional overrides.
 */
export function createMarkdownStyles(
  color: string,
  overrides: Partial<MarkdownStyle> = {},
): MarkdownStyle {
  const result: Record<string, any> = {};

  for (const key of Object.keys(baseStyles) as (keyof MarkdownStyle)[]) {
    const base = baseStyles[key] ?? {};
    const override = overrides[key] ?? {};
    const colorPatch = textColorKeys.includes(key) ? { color } : {};
    result[key] = { ...base, ...colorPatch, ...override };
  }

  // Apply any override keys that aren't in baseStyles (e.g. math, inlineMath)
  for (const key of Object.keys(overrides) as (keyof MarkdownStyle)[]) {
    if (!result[key]) {
      const colorPatch = textColorKeys.includes(key) ? { color } : {};
      result[key] = { ...colorPatch, ...overrides[key] };
    }
  }

  return result as MarkdownStyle;
}
