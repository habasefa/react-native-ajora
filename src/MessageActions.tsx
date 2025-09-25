import React, { useMemo } from "react";
import { Share, TouchableOpacity, View } from "react-native";
import { IMessage } from "./types";
import * as Clipboard from "expo-clipboard";
import { MaterialIcons } from "@expo/vector-icons";
import { useChatContext } from "./AjoraContext";

export interface MessageActionsProps {
  message: IMessage;
  renderMessageActions?: (props: MessageActionsProps) => React.ReactNode;
  position: "left" | "right";
  onCopy?: (text: string) => void;
  onRegenerate?: (message: IMessage) => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  renderMessageActions = undefined,
  position,
}) => {
  const { ajora } = useChatContext();
  const { regenerateMessage } = ajora;
  const messageText = useMemo(() => {
    const texts = (message.parts || [])
      .map((p) => (p.text ? String(p.text) : ""))
      .filter(Boolean);
    return texts.join("\n");
  }, [message]);

  /* If the message is not an model message, or 
  if the message is a function call, or 
  if it is streaming, or 
  if the message is not the last message in the thread, (TODO: make it display for non last messages too, which remove all the message after it)
  return null */
  return null;
  if (position === "right" || message.parts?.[0].functionCall) return null;

  if (renderMessageActions) {
    return renderMessageActions?.({ message, position });
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
        marginLeft: 4,
        backgroundColor: "transparent",
      }}
    >
      <TouchableOpacity
        onPress={() => {
          if (messageText) {
            Clipboard.setStringAsync(messageText);
          }
        }}
        activeOpacity={0.5}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ paddingHorizontal: 4, paddingVertical: 2 }}
      >
        <MaterialIcons name="content-copy" size={20} color="#334155" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => regenerateMessage(message)}
        activeOpacity={0.5}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ paddingHorizontal: 4, paddingVertical: 2 }}
      >
        <MaterialIcons name="autorenew" size={20} color="#334155" />
      </TouchableOpacity>

      {/* Share */}
      <TouchableOpacity
        onPress={() => Share.share({ message: message.parts[0].text ?? "" })}
        activeOpacity={0.5}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ paddingHorizontal: 4, paddingVertical: 2 }}
      >
        <MaterialIcons name="share" size={20} color="#334155" />
      </TouchableOpacity>
    </View>
  );
};

export default MessageActions;
