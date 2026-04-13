import React from "react";
import { Text, Linking } from "react-native";
import { createMarkdownStyles } from "./markdownStyle";

// Optional import — graceful fallback when the peer dep is not installed.
let EnrichedMarkdownText: React.ComponentType<any> | null = null;
try {
  EnrichedMarkdownText =
    require("react-native-enriched-markdown").EnrichedMarkdownText;
} catch {
  // react-native-enriched-markdown not installed — will fall back to plain <Text>
}

interface Props {
  text: string;
  isThinking?: boolean;
  textColor?: string;
  fontSize?: number;
  lineHeight?: number;
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
  isThinking = false,
  textColor: propTextColor,
  fontSize: propFontSize,
  lineHeight: propLineHeight,
}: Props) => {
  const processedText = React.useMemo(
    () => convertLatexDelimiters(text),
    [text],
  );

  const theme = {
    colors: {
      icon: "black",
      textPrimary: "white",
    },
    typography: {
      fontSize: { md: 16 },
    },
  };

  const textColor =
    propTextColor ||
    (isThinking ? theme.colors.icon : theme.colors.textPrimary);
  const fontSize = propFontSize || theme.typography.fontSize.md;

  const markdownStyle = React.useMemo(
    () =>
      createMarkdownStyles(textColor, {
        paragraph: {
          fontSize,
          ...(propLineHeight ? { lineHeight: propLineHeight } : {}),
        },
      }),
    [textColor, fontSize, propLineHeight],
  );

  const handleLinkPress = React.useCallback(
    (event: { url: string }) => {
      Linking.openURL(event.url);
    },
    [],
  );

  // Fallback when react-native-enriched-markdown is not installed
  if (!EnrichedMarkdownText) {
    return (
      <Text
        style={{
          color: textColor,
          fontSize,
          ...(propLineHeight ? { lineHeight: propLineHeight } : {}),
        }}
      >
        {processedText}
      </Text>
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
