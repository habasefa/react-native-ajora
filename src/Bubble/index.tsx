import React, { JSX, useCallback } from "react";
import { Share, TouchableWithoutFeedback, View } from "react-native";

import { useChatContext } from "../AjoraContext";
import { MessageText } from "../MessageText";
import { MessageImage } from "../MessageImage";
import { MessageAudio } from "../MessageAudio";
import { MessageToolCall } from "../Tool";

import { isSameUser, isSameDay } from "../utils";
import { IMessage } from "../types";
import { BubbleProps } from "./types";

import stylesCommon from "../styles";
import styles from "./styles";
import { MessageFile } from "../MessageFile";
import * as Clipboard from "expo-clipboard";

export * from "./types";

const Bubble = <TMessage extends IMessage = IMessage>(
  props: BubbleProps<TMessage>
): JSX.Element => {
  const {
    currentMessage,
    nextMessage,
    position,
    containerToNextStyle,
    previousMessage,
    containerToPreviousStyle,
    containerStyle,
    wrapperStyle,
  } = props;

  const context = useChatContext();

  const onPress = useCallback(() => {
    if (props.onPress) props.onPress(context, currentMessage);
  }, [context, props, currentMessage]);

  const handleLongPress = useCallback(
    (context: unknown, currentMessage: IMessage) => {
      if (!currentMessage.parts[0].text) return;

      const options = ["Copy text", "Share", "Cancel"];

      const cancelButtonIndex = options.length - 1;

      (context as any).actionSheet().showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        (buttonIndex: number) => {
          switch (buttonIndex) {
            case 0:
              if (currentMessage.parts[0].text) {
                Clipboard.setStringAsync(currentMessage.parts[0].text);
              }
              break;
            case 1:
              if (currentMessage.parts[0].text) {
                Share.share({
                  message: currentMessage.parts[0].text,
                });
              }
              break;
            default:
              break;
          }
        }
      );
    },
    []
  );

  const onLongPress = useCallback(() => {
    const { onLongPress } = props;

    if (onLongPress) {
      onLongPress(context, currentMessage);
      return;
    }

    handleLongPress(context, currentMessage);
  }, [currentMessage, context, props]);

  const styledBubbleToNext = useCallback(() => {
    if (
      currentMessage &&
      nextMessage &&
      position &&
      isSameUser(currentMessage, nextMessage) &&
      isSameDay(currentMessage, nextMessage)
    )
      return [
        styles[position].containerToNext,
        containerToNextStyle?.[position],
      ];

    return null;
  }, [currentMessage, nextMessage, position, containerToNextStyle]);

  const styledBubbleToPrevious = useCallback(() => {
    if (
      currentMessage &&
      previousMessage &&
      position &&
      isSameUser(currentMessage, previousMessage) &&
      isSameDay(currentMessage, previousMessage)
    )
      return [
        styles[position].containerToPrevious,
        containerToPreviousStyle && containerToPreviousStyle[position],
      ];

    return null;
  }, [currentMessage, previousMessage, position, containerToPreviousStyle]);

  const renderMessageText = useCallback(() => {
    // Check if there are any text parts in the message
    const hasTextParts = currentMessage?.parts?.some((part) => part.text);

    if (hasTextParts) {
      const {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        containerStyle,
        wrapperStyle,
        optionTitles,
        /* eslint-enable @typescript-eslint/no-unused-vars */
        ...messageTextProps
      } = props;

      if (props.renderMessageText)
        return props.renderMessageText(messageTextProps);

      return <MessageText {...messageTextProps} />;
    }
    return null;
  }, [props, currentMessage]);

  const renderMessageImage = useCallback(() => {
    // Check if there are any image parts in the message
    const hasImageParts = currentMessage?.parts?.some((part) => {
      const mimeType = part.fileData?.mimeType;
      return (
        mimeType &&
        (mimeType === "image/jpeg" ||
          mimeType === "image/png" ||
          mimeType === "image/jpg" ||
          mimeType === "image/webp" ||
          mimeType === "image/heic" ||
          mimeType === "image/heif")
      );
    });

    if (hasImageParts) {
      const {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        containerStyle,
        wrapperStyle,
        /* eslint-enable @typescript-eslint/no-unused-vars */
        ...messageImageProps
      } = props;

      if (props.renderMessageImage)
        return props.renderMessageImage(messageImageProps);

      return <MessageImage {...messageImageProps} />;
    }
    return null;
  }, [props, currentMessage]);

  const renderMessageAudio = useCallback(() => {
    // Check if there are any audio parts in the message
    const hasAudioParts = currentMessage?.parts?.some((part) => {
      const mimeType = part.fileData?.mimeType;
      return mimeType && mimeType.startsWith("audio/");
    });

    if (!hasAudioParts) return null;

    const {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      containerStyle,
      wrapperStyle,
      /* eslint-enable @typescript-eslint/no-unused-vars */
      ...messageAudioProps
    } = props;

    if (props.renderMessageAudio)
      return props.renderMessageAudio(messageAudioProps);

    return <MessageAudio {...messageAudioProps} />;
  }, [props, currentMessage]);

  const renderMessageFile = useCallback(() => {
    // Check if there are any file parts in the message
    const hasFileParts = currentMessage?.parts?.some((part) => {
      const mimeType = part.fileData?.mimeType;
      return mimeType && mimeType === "application/pdf";
    });
    if (!hasFileParts) return null;

    const {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      containerStyle,
      wrapperStyle,
      /* eslint-enable @typescript-eslint/no-unused-vars */
      ...messageFileProps
    } = props;

    return <MessageFile {...messageFileProps} />;
  }, [props, currentMessage]);

  const renderMessageToolCall = useCallback(() => {
    // Check if there are any tool call parts in the message
    const hasToolCallParts = currentMessage?.parts?.some(
      (part) => part.functionCall
    );

    if (!hasToolCallParts) return null;

    const {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      containerStyle,
      wrapperStyle,
      /* eslint-enable @typescript-eslint/no-unused-vars */
      ...messageToolCallProps
    } = props;

    if (props.renderMessageToolCall)
      return props.renderMessageToolCall(messageToolCallProps);

    return <MessageToolCall {...messageToolCallProps} />;
  }, [props, currentMessage]);

  const renderBubbleContent = useCallback(() => {
    return (
      <View>
        {renderMessageImage()}
        {/* {renderMessageAudio()} */}
        {renderMessageText()}
        {renderMessageToolCall()}
        {renderMessageFile()}
      </View>
    );
  }, [
    renderMessageImage,
    // renderMessageAudio,
    renderMessageText,
    renderMessageFile,
    renderMessageToolCall,
  ]);

  const getBubbleWrapperStyle = useCallback(() => {
    // Check if message has text parts
    const hasTextParts = currentMessage?.parts?.some((part) => part.text);

    // Base wrapper styles
    const baseWrapperStyle = styles[position].wrapper;

    // If it's not a text message, make background transparent
    if (!hasTextParts) {
      const transparentStyle = {
        ...baseWrapperStyle,
        backgroundColor: "transparent",
        borderWidth: 0,
        borderColor: "transparent",
        paddingHorizontal: 0,
        paddingVertical: 0,
        shadowOpacity: 0,
        elevation: 0,
      };

      return [
        transparentStyle,
        styledBubbleToNext(),
        styledBubbleToPrevious(),
        wrapperStyle && wrapperStyle[position],
      ];
    }

    // For text messages, use normal bubble styles
    return [
      baseWrapperStyle,
      styledBubbleToNext(),
      styledBubbleToPrevious(),
      wrapperStyle && wrapperStyle[position],
    ];
  }, [
    position,
    styledBubbleToNext,
    styledBubbleToPrevious,
    wrapperStyle,
    currentMessage,
  ]);

  return (
    <View
      style={[
        stylesCommon.fill,
        styles[position].container,
        containerStyle && containerStyle[position],
      ]}
    >
      <View style={getBubbleWrapperStyle()}>
        <TouchableWithoutFeedback
          onPress={onPress}
          onLongPress={onLongPress}
          accessibilityRole="text"
          {...props.touchableProps}
        >
          <View>{renderBubbleContent()}</View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

export default Bubble;
