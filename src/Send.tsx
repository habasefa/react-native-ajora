import React, { useMemo, useCallback } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from "react-native";

import Color from "./Color";
import { IMessage } from "./types";
import { TEST_ID } from "./Constant";
import { MaterialIcons } from "@expo/vector-icons";
import { useChatContext } from "./AjoraContext";

const styles = StyleSheet.create({
  container: {
    height: 44,
    justifyContent: "flex-end",
  },
  text: {
    color: Color.primary,
    fontWeight: "600",
    fontSize: 17,
    backgroundColor: Color.backgroundTransparent,
    marginBottom: 12,
    marginLeft: 10,
    marginRight: 10,
  },
});

export interface SendProps<TMessage extends IMessage> {
  text?: string;
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
  alwaysShowSend?: boolean;
  disabled?: boolean;
  sendButtonProps?: Partial<TouchableOpacityProps>;
  onSend?(
    messages: Partial<TMessage> | Partial<TMessage>[],
    shouldResetInputToolbar: boolean
  ): void;
}

export const Send = <TMessage extends IMessage = IMessage>({
  text,
  containerStyle,
  alwaysShowSend = false,
  disabled = false,
  sendButtonProps,
  onSend,
}: SendProps<TMessage>) => {
  const { ajora } = useChatContext();
  const { submitQuery, activeThreadId, stopStreaming, isComplete } = ajora;

  const handleOnPress = useCallback(() => {
    if (!isComplete) {
      // Abort/stop current streaming
      stopStreaming();
      return;
    }

    if (text) {
      const message = {
        _id: Math.round(Math.random() * 1000000).toString(),
        role: "user",
        thread_id: activeThreadId || "",
        parts: [{ text: text.trim() }],
        createdAt: new Date(),
      } as IMessage;

      // Call onSend to trigger input clearing and other side effects
      if (onSend) {
        onSend([message as Partial<TMessage>], true);
      } else {
        // Fallback to direct submitQuery if onSend is not provided
        submitQuery({
          type: "text",
          message,
        });
      }
    }
  }, [text, submitQuery, activeThreadId, onSend, isComplete, stopStreaming]);

  const showSend = useMemo(() => {
    // Show button when there is text to send, when alwaysShowSend, or when streaming (to show abort)
    const hasText = !!(text && text.trim().length > 0);
    return alwaysShowSend || hasText || !isComplete;
  }, [alwaysShowSend, text, isComplete]);

  if (!showSend) return null;

  return (
    <TouchableOpacity
      testID={TEST_ID.SEND_TOUCHABLE}
      accessible
      accessibilityLabel="send"
      style={[styles.container, containerStyle]}
      onPress={handleOnPress}
      accessibilityRole="button"
      disabled={disabled}
      {...sendButtonProps}
    >
      <View style={{ justifyContent: "center", padding: 10 }}>
        <MaterialIcons
          size={28}
          color={Color.primary}
          name={isComplete ? "arrow-upward" : "stop"}
        />
      </View>
    </TouchableOpacity>
  );
};
