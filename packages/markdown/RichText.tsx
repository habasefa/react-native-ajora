import React from "react";
import Markdown from "react-native-markdown-display";
import { useAjoraTheme } from "../native/providers/AjoraThemeProvider";
import { createMarkdownStyles } from "./markdownStyle";

interface Props {
  text: string;
  textColor?: string;
  fontSize?: number;
  lineHeight?: number;
}

const RichText = ({
  text,
  textColor,
  fontSize: propFontSize,
  lineHeight: propLineHeight,
}: Props) => {
  const theme = useAjoraTheme();

  const fontSize = propFontSize || theme.typography.sizes.md;

  const markdownStyle = createMarkdownStyles(theme, {
    body: {
      fontSize,
      color: textColor,
      ...(propLineHeight && { lineHeight: propLineHeight }),
    },
    text: {
      fontSize,
      color: textColor,
      ...(propLineHeight && { lineHeight: propLineHeight }),
    },
  });

  return <Markdown style={markdownStyle}>{text}</Markdown>;
};

export default RichText;
