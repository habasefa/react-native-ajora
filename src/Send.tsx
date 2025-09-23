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
    color: Color.defaultBlue,
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
  const { submitQuery, activeThreadId } = ajora;

  const handleOnPress = useCallback(() => {
    if (text) {
      const message = {
        _id: Math.round(Math.random() * 1000000),
        role: "user",
        parts: [{ text: text.trim() }],
        createdAt: new Date(),
      } as IMessage;

      // Call onSend to trigger input clearing and other side effects
      if (onSend) {
        onSend(message as Partial<TMessage>, true);
      } else {
        // Fallback to direct submitQuery if onSend is not provided
        submitQuery(message, activeThreadId || "");
      }
    }
  }, [text, submitQuery, activeThreadId, onSend]);

  const showSend = useMemo(
    () => alwaysShowSend || (text && text.trim().length > 0),
    [alwaysShowSend, text]
  );

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
        <MaterialIcons size={28} color={"#000000"} name={"arrow-upward"} />
      </View>
    </TouchableOpacity>
  );
};
