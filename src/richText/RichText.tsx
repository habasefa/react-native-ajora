import katexPlugin from "@vscode/markdown-it-katex";
import React from "react";
import Markdown, { MarkdownIt } from "react-native-markdown-display";
// import MathJax from "react-native-mathjax-svg";
import { createMarkdownStyles } from "./markdownStyle";

interface Props {
  text: string;
  isThinking?: boolean;
  textColor?: string;
  fontSize?: number;
  lineHeight?: number;
}

const RichText = ({
  text,
  isThinking = false,
  textColor: propTextColor,
  fontSize: propFontSize,
  lineHeight: propLineHeight,
}: Props) => {
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

  return (
    <Markdown
      style={markdownStyle}
      markdownit={markdownItInstance}
      // rules={{
      //   math_display: (node, children, parent, ruleStyles) => {
      //     const fontSize = getFontSize(node.content);
      //     return (
      //       <ScrollView
      //         key={node.content}
      //         horizontal
      //         contentContainerStyle={localStyles.scrollContainer}
      //         contentInsetAdjustmentBehavior="automatic"
      //       >
      //         <MathJax fontSize={fontSize} color={textColor}>
      //           {node.content}
      //         </MathJax>
      //       </ScrollView>
      //     );
      //   },
      //   math_inline: (node, children, parent, ruleStyles) => {
      //     const fontSize = getFontSize(node.content);
      //     return (
      //       <ScrollView
      //         key={node.content}
      //         horizontal
      //         contentContainerStyle={localStyles.scrollContainer}
      //         contentInsetAdjustmentBehavior="automatic"
      //       >
      //         <MathJax fontSize={fontSize} color={textColor}>
      //           {node.content}
      //         </MathJax>
      //       </ScrollView>
      //     );
      //   },
      //   math_block: (node, children, parent, ruleStyles) => {
      //     const fontSize = getFontSize(node.content);
      //     return (
      //       <ScrollView
      //         key={node.content}
      //         horizontal
      //         contentContainerStyle={localStyles.scrollContainer}
      //         contentInsetAdjustmentBehavior="automatic"
      //       >
      //         <MathJax
      //           fontSize={fontSize}
      //           color={textColor}
      //           key={node.content + Math.random()}
      //         >
      //           {node.content}
      //         </MathJax>
      //       </ScrollView>
      //     );
      //   },
      // }}
    >
      {text}
    </Markdown>
  );
};

export default RichText;
