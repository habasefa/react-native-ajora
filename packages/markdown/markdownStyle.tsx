import { Platform } from "react-native";

// ---------------------------------------------------------------------------
// MarkdownTheme — the semantic colors/sizes that markdown rendering needs.
// Defined here so packages/markdown/ stays independent of packages/native/.
// Upstream components map their app theme → MarkdownTheme at the boundary.
// ---------------------------------------------------------------------------

export interface MarkdownTheme {
  /** Primary text color for headings, paragraphs, lists, etc. */
  textColor: string;
  /** Muted text color (thinking state, secondary info) */
  mutedColor: string;
  /** Background for code blocks and inline code */
  codeBg: string;
  /** Border color shared by code blocks, blockquotes, tables, hr */
  borderColor: string;
  /** Link color */
  linkColor: string;
  /** Base font size for body text */
  fontSize: number;
  /** Base line height for body text */
  lineHeight: number;
}

/** Sensible default for when no theme is provided (visible on any background). */
export const DEFAULT_MARKDOWN_THEME: MarkdownTheme = {
  textColor: "#09090B",
  mutedColor: "#71717A",
  codeBg: "#F4F4F5",
  borderColor: "#E4E4E7",
  linkColor: "#18181B",
  fontSize: 16,
  lineHeight: 24,
};

// ---------------------------------------------------------------------------
// MarkdownStyle — maps to EnrichedMarkdownText's `markdownStyle` prop.
//
// We maintain our own interface rather than importing from
// react-native-enriched-markdown because it is an optional peer dep —
// a static `import type` would break builds for consumers who use
// their own textRenderer and don't install the library.
// ---------------------------------------------------------------------------

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

/**
 * Derives a full MarkdownStyle from a MarkdownTheme.
 * Every visual token is pulled from the theme — no hardcoded colors.
 */
export function createMarkdownStyles(
  theme: MarkdownTheme,
  overrides: Partial<MarkdownStyle> = {},
): MarkdownStyle {
  const { textColor, mutedColor, codeBg, borderColor, linkColor, fontSize, lineHeight } = theme;

  const base: MarkdownStyle = {
    h1: { fontSize: fontSize * 2, fontWeight: "bold", color: textColor },
    h2: { fontSize: fontSize * 1.5, fontWeight: "bold", color: textColor },
    h3: { fontSize: fontSize * 1.125, fontWeight: "bold", color: textColor },
    h4: { fontSize, fontWeight: "bold", color: textColor },
    h5: { fontSize: fontSize * 0.8125, fontWeight: "bold", color: textColor },
    h6: { fontSize: fontSize * 0.6875, fontWeight: "bold", color: textColor },
    paragraph: { fontSize, color: textColor, lineHeight, marginTop: 10, marginBottom: 10 },
    strong: { fontWeight: "bold", color: textColor },
    emphasis: { fontStyle: "italic", color: textColor },
    strikethrough: { color: mutedColor },
    blockquote: { borderColor, borderWidth: 4, color: mutedColor },
    list: { marginLeft: 10, bulletColor: mutedColor, markerColor: mutedColor, color: textColor },
    inlineCode: { fontFamily: monoFont, color: textColor, backgroundColor: codeBg, borderColor },
    codeBlock: { fontFamily: monoFont, color: textColor, backgroundColor: codeBg, borderColor, borderRadius: 4, padding: 10 },
    link: { color: linkColor, underline: true },
    table: { borderColor },
    thematicBreak: { color: borderColor, height: 1 },
    math: { color: textColor },
    inlineMath: { color: textColor },
    taskList: { checkedColor: linkColor, borderColor },
  };

  // Merge overrides on top of themed base
  const result: Record<string, any> = {};
  for (const key of Object.keys(base) as (keyof MarkdownStyle)[]) {
    result[key] = { ...base[key], ...(overrides[key] ?? {}) };
  }
  for (const key of Object.keys(overrides) as (keyof MarkdownStyle)[]) {
    if (!result[key]) {
      result[key] = overrides[key];
    }
  }

  return result as MarkdownStyle;
}
