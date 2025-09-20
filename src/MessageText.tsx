import React from "react";
import {
  Linking,
  StyleSheet,
  View,
  TextProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";

import ParsedText from "react-native-parsed-text";
import { LeftRightStyle, IMessage } from "./types";
import { useChatContext } from "./AjoraContext";
import { error } from "./logging";
import RichText from "./richText/RichText";

const WWW_URL_PATTERN = /^www\./i;

const { textStyle } = StyleSheet.create({
  textStyle: {
    fontSize: 16,
    lineHeight: 20,
    marginTop: 2,
    marginBottom: 2,
    marginLeft: 0,
    marginRight: 0,
  },
});

const styles = {
  left: StyleSheet.create({
    container: {},
    text: {
      color: "black",
      ...textStyle,
    },
    link: {
      color: "black",
      textDecorationLine: "underline",
    },
  }),
  right: StyleSheet.create({
    container: {
      paddingVertical: 0,
    },
    text: {
      color: "white",
      ...textStyle,
      marginTop: 0,
      marginBottom: 0,
      lineHeight: 16,
    },
    link: {
      color: "white",
      textDecorationLine: "underline",
    },
  }),
};

const DEFAULT_OPTION_TITLES = ["Call", "Text", "Cancel"];

export interface MessageTextProps<TMessage extends IMessage> {
  position?: "left" | "right";
  optionTitles?: string[];
  currentMessage: TMessage;
  containerStyle?: LeftRightStyle<ViewStyle>;
  textStyle?: LeftRightStyle<TextStyle>;
  linkStyle?: LeftRightStyle<TextStyle>;
  textProps?: TextProps;
  customTextStyle?: StyleProp<TextStyle>;
  parsePatterns?: (linkStyle: TextStyle) => [];
}

export function MessageText<TMessage extends IMessage = IMessage>({
  currentMessage = {} as TMessage,
  optionTitles = DEFAULT_OPTION_TITLES,
  position = "left",
  containerStyle,
  textStyle,
  linkStyle: linkStyleProp,
  customTextStyle,
  parsePatterns,
  textProps,
}: MessageTextProps<TMessage>) {
  const { actionSheet } = useChatContext();

  // TODO: React.memo
  // const shouldComponentUpdate = (nextProps: MessageTextProps<TMessage>) => {
  //   return (
  //     !!currentMessage &&
  //     !!nextProps.currentMessage &&
  //     currentMessage.text !== nextProps.currentMessage.text
  //   )
  // }

  const onUrlPress = (url: string) => {
    // When someone sends a message that includes a website address beginning with "www." (omitting the scheme),
    // react-native-parsed-text recognizes it as a valid url, but Linking fails to open due to the missing scheme.
    if (WWW_URL_PATTERN.test(url)) onUrlPress(`https://${url}`);
    else
      Linking.openURL(url).catch((e) => {
        error(e, "No handler for URL:", url);
      });
  };

  const onPhonePress = (phone: string) => {
    const options =
      optionTitles && optionTitles.length > 0
        ? optionTitles.slice(0, 3)
        : DEFAULT_OPTION_TITLES;
    const cancelButtonIndex = options.length - 1;
    actionSheet().showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      (buttonIndex?: number) => {
        switch (buttonIndex) {
          case 0:
            Linking.openURL(`tel:${phone}`).catch((e) => {
              error(e, "No handler for telephone");
            });
            break;
          case 1:
            Linking.openURL(`sms:${phone}`).catch((e) => {
              error(e, "No handler for text");
            });
            break;
        }
      }
    );
  };

  const onEmailPress = (email: string) =>
    Linking.openURL(`mailto:${email}`).catch((e) =>
      error(e, "No handler for mailto")
    );

  const linkStyle = [styles[position].link, linkStyleProp?.[position]];
  return (
    <View style={[styles[position].container, containerStyle?.[position]]}>
      <ParsedText
        style={[styles[position].text, textStyle?.[position], customTextStyle]}
        parse={[
          ...(parsePatterns
            ? parsePatterns(linkStyle as unknown as TextStyle)
            : []),
          { type: "url", style: linkStyle, onPress: onUrlPress },
          { type: "phone", style: linkStyle, onPress: onPhonePress },
          { type: "email", style: linkStyle, onPress: onEmailPress },
        ]}
        childrenProps={{ ...textProps }}
      >
        <RichText
          text={
            currentMessage.parts
              ?.filter((part) => part.text)
              .map((part) => part.text)
              .join(" ") || ""
          }
          compact={position === "right"}
          textColor={String(
            (textStyle?.[position] as TextStyle)?.color ||
              (customTextStyle as TextStyle)?.color ||
              styles[position].text.color
          )}
          fontSize={
            (textStyle?.[position] as TextStyle)?.fontSize ||
            (customTextStyle as TextStyle)?.fontSize ||
            styles[position].text.fontSize
          }
          lineHeight={
            (textStyle?.[position] as TextStyle)?.lineHeight ||
            (customTextStyle as TextStyle)?.lineHeight ||
            styles[position].text.lineHeight
          }
        />
      </ParsedText>
    </View>
  );
}
