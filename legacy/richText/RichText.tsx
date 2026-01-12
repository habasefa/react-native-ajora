import katexPlugin from "@vscode/markdown-it-katex";
import React from "react";
import Markdown, { MarkdownIt } from "react-native-markdown-display";
import MathJax from "react-native-mathjax-svg";
import { createMarkdownStyles } from "./markdownStyle";
import { ScrollView, StyleSheet } from "react-native";

interface Props {
  text: string;
  isThinking?: boolean;
  textColor?: string;
  fontSize?: number;
  lineHeight?: number;
}

/**
 * Converts LaTeX delimiters to markdown-it-katex compatible format.
 * - \( ... \) → $ ... $ (inline math)
 * - \[ ... \] → $$ ... $$ (display math)
 */
function convertLatexDelimiters(text: string): string {
  if (!text) return text;

  let result = text;

  // Convert display math: \[ ... \] → $$ ... $$
  // Using a regex that matches \[ followed by any content (non-greedy) until \]
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, content) => {
    return `$$${content}$$`;
  });

  // Convert inline math: \( ... \) → $ ... $
  // Using a regex that matches \( followed by any content (non-greedy) until \)
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
  // Convert LaTeX delimiters before processing
  const processedText = React.useMemo(
    () => convertLatexDelimiters(text),
    [text]
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
  const markdownStyle = createMarkdownStyles(textColor, {
    body: { fontSize, ...(propLineHeight && { lineHeight: propLineHeight }) },
    text: { fontSize, ...(propLineHeight && { lineHeight: propLineHeight }) },
  });

  const markdownItInstance = MarkdownIt({ typographer: true }).use(
    katexPlugin,
    { containerClassName: "latex" }
  );

  const getFontSize = () => {
    // Prioritize baseFontSize prop, then customStyles.text?.fontSize, then theme default
    return (
      propFontSize ||
      markdownStyle.text?.fontSize ||
      markdownStyle.body?.fontSize ||
      theme.typography.fontSize.md
    );
  };

  return (
    <Markdown
      style={markdownStyle}
      markdownit={markdownItInstance}
      rules={{
        math_display: (node, children, parent, ruleStyles) => {
          const fontSize = getFontSize();
          return (
            <ScrollView
              key={node.content}
              horizontal
              contentContainerStyle={localStyles.scrollContainer}
              contentInsetAdjustmentBehavior="automatic"
            >
              <MathJax fontSize={fontSize} color={textColor}>
                {node.content}
              </MathJax>
            </ScrollView>
          );
        },
        math_inline: (node, children, parent, ruleStyles) => {
          const fontSize = getFontSize();
          return (
            <ScrollView
              key={node.content}
              horizontal
              contentContainerStyle={localStyles.scrollContainer}
              contentInsetAdjustmentBehavior="automatic"
            >
              <MathJax fontSize={fontSize} color={textColor}>
                {node.content}
              </MathJax>
            </ScrollView>
          );
        },
        math_block: (node, children, parent, ruleStyles) => {
          const fontSize = getFontSize();
          return (
            <ScrollView
              key={node.content}
              horizontal
              contentContainerStyle={localStyles.scrollContainer}
              contentInsetAdjustmentBehavior="automatic"
            >
              <MathJax
                fontSize={fontSize}
                color={textColor}
                key={node.content + Math.random()}
              >
                {node.content}
              </MathJax>
            </ScrollView>
          );
        },
      }}
    >
      {processedText}
    </Markdown>
  );
};

export default RichText;

const localStyles = StyleSheet.create({
  scrollContainer: {
    // Set minWidth or flexGrow if needed – adjust based on your layout
    flexGrow: 1,
  },
  inlineMathContainer: {
    flexShrink: 1,
    alignSelf: "flex-start",
    flexDirection: "row",
  },
  keywordContainer: {
    // Inline style for keywords
  },
  keywordText: {
    fontWeight: "bold",
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
  },
  quizButton: {
    marginVertical: 0,
    width: "100%",
    alignSelf: "stretch",
    minHeight: 48,
    paddingVertical: 12,
  },
});
