import React from "react";
import { Text, Linking } from "react-native";
import {
  createMarkdownStyles,
  DEFAULT_MARKDOWN_THEME,
  type MarkdownTheme,
} from "./markdownStyle";

// Optional imports — graceful fallback when peer deps are not installed.
let EnrichedMarkdownText: React.ComponentType<any> | null = null;
let StreamdownText: React.ComponentType<any> | null = null;
try {
  EnrichedMarkdownText =
    require("react-native-enriched-markdown").EnrichedMarkdownText;
} catch {
  // react-native-enriched-markdown not installed
}
try {
  StreamdownText = require("react-native-streamdown").StreamdownText;
} catch {
  // react-native-streamdown not installed — streaming falls back to static rendering
}

export interface RichTextProps {
  text: string;
  /** Semantic theme — drives all markdown colors, sizes, and borders. */
  theme?: MarkdownTheme;
  isThinking?: boolean;
  streaming?: boolean;
  onLinkPress?: (url: string) => void;
}

/**
 * Converts LaTeX delimiters to the format expected by react-native-enriched-markdown.
 * AI models commonly emit \[...\] and \(...\) but the library expects $$...$$ and $...$.
 */
function convertLatexDelimiters(text: string): string {
  if (!text) return text;

  let result = text;

  // Convert display math: \[ ... \] → $$ ... $$
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, content) => {
    return `$$${content}$$`;
  });

  // Convert inline math: \( ... \) → $ ... $
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, content) => {
    return `$${content}$`;
  });

  return result;
}

const RichText = ({
  text,
  theme: propTheme,
  isThinking = false,
  streaming = false,
  onLinkPress: propOnLinkPress,
}: RichTextProps) => {
  const processedText = React.useMemo(
    () => convertLatexDelimiters(text),
    [text],
  );

  // If thinking, dim the text by swapping textColor → mutedColor
  const theme = React.useMemo<MarkdownTheme>(() => {
    const base = propTheme ?? DEFAULT_MARKDOWN_THEME;
    if (!isThinking) return base;
    return { ...base, textColor: base.mutedColor };
  }, [propTheme, isThinking]);

  const markdownStyle = React.useMemo(
    () => createMarkdownStyles(theme),
    [theme],
  );

  const handleLinkPress = React.useCallback(
    (event: { url: string }) => {
      if (propOnLinkPress) {
        propOnLinkPress(event.url);
      } else {
        Linking.openURL(event.url);
      }
    },
    [propOnLinkPress],
  );

  // Fallback when react-native-enriched-markdown is not installed
  if (!EnrichedMarkdownText) {
    return (
      <Text style={{ color: theme.textColor, fontSize: theme.fontSize, lineHeight: theme.lineHeight }}>
        {processedText}
      </Text>
    );
  }

  // Use StreamdownText for in-progress streaming messages when available
  if (streaming && StreamdownText) {
    return (
      <StreamdownText
        markdown={processedText}
        flavor="github"
        markdownStyle={markdownStyle}
        onLinkPress={handleLinkPress}
      />
    );
  }

  return (
    <EnrichedMarkdownText
      markdown={processedText}
      flavor="github"
      markdownStyle={markdownStyle}
      onLinkPress={handleLinkPress}
    />
  );
};

export default RichText;
