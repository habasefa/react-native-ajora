import React, { ReactNode, useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import Color from "./Color";

import { useActionSheet } from "@expo/react-native-action-sheet";
import {
  pickImageAsync,
  takePictureAsync,
  filePickerAsync,
  audioPickerAsync,
} from "./utils/mediaUtils";
import { MaterialIcons } from "@expo/vector-icons";
import { IMessage } from "./types";
import { useChatContext } from "./AjoraContext";

export interface ActionsProps {
  options?: { [key: string]: () => void };
  optionTintColor?: string;
  icon?: () => ReactNode;
  wrapperStyle?: StyleProp<ViewStyle>;
  iconTextStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  onPressActionButton?(): void;
}

export function Actions({
  options = {
    Photo: () => {},
    Camera: () => {},
    File: () => {},
    Audio: () => {},
    Cancel: () => {},
  },
  optionTintColor = Color.optionTintColor,
  icon,
  wrapperStyle,
  iconTextStyle,
  onPressActionButton,
  containerStyle,
}: ActionsProps) {
  const { showActionSheetWithOptions } = useActionSheet();
  const { ajora } = useChatContext();
  const { submitQuery, activeThreadId, setMode } = ajora;

  const onActionsPress = useCallback(() => {
    const options = ["Photo", "Camera", "File", "Audio", "Cancel"];
    const cancelButtonIndex = options.length - 1;

    const onSend = (messages: IMessage) => {
      submitQuery(messages, activeThreadId || "");
    };

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async (buttonIndex) => {
        switch (buttonIndex) {
          case 0:
            pickImageAsync(onSend);
            return;
          case 1:
            takePictureAsync(onSend);
            return;
          case 2:
            filePickerAsync(onSend);
            return;
          case 3:
            audioPickerAsync(onSend);
            return;
        }
      }
    );
  }, [showActionSheetWithOptions, submitQuery]);

  const onAutoPress = useCallback(() => {
    const options = ["Auto", "Thinking", "Image", "Search", "Cancel"];
    const cancelButtonIndex = options.length - 1;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async (buttonIndex) => {
        switch (buttonIndex) {
          case 0:
            setMode("auto");
            return;
          case 1:
            setMode("thinking");
            return;
          case 2:
            setMode("image");
            return;
          case 3:
            setMode("search");
            return;
        }
      }
    );
  }, [showActionSheetWithOptions, setMode]);

  const renderIcon = useCallback(() => {
    return (
      <View>
        <MaterialIcons name="attach-file" size={24} color="black" />
      </View>
    );
  }, []);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <TouchableOpacity
        style={[styles.container, containerStyle]}
        onPress={onActionsPress}
      >
        {renderIcon()}
      </TouchableOpacity>
      <TouchableOpacity style={{ width: 100 }} onPress={onAutoPress}>
        <Text style={[styles.iconText, iconTextStyle]}>
          {ajora.mode.charAt(0).toUpperCase() + ajora.mode.slice(1)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    width: 26,
    height: 26,
    marginLeft: 10,
    marginBottom: 10,
  },
  wrapper: {
    borderRadius: 13,
    borderColor: "#b2b2b2",
    borderWidth: 2,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    color: "#b2b2b2",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 16,
    backgroundColor: "transparent",
    textAlign: "center",
  },
});
