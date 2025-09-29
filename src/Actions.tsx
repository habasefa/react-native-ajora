import React, { ReactNode, useCallback } from "react";
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
  optionTintColor: _optionTintColor = Color.optionTintColor,
  icon: _icon,
  wrapperStyle: _wrapperStyle,
  iconTextStyle,
  onPressActionButton: _onPressActionButton,
  containerStyle,
}: ActionsProps) {
  const { showActionSheetWithOptions } = useActionSheet();
  const { ajora } = useChatContext();
  const { submitQuery, setMode } = ajora;

  const onActionsPress = useCallback(() => {
    const options = ["Photo", "Camera", "File", "Audio", "Cancel"];
    const cancelButtonIndex = options.length - 1;

    const onSend = (messages: IMessage) => {
      submitQuery({
        type: "text",
        message: messages,
      });
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

  const onModePress = useCallback(() => {
    const options = ["Agent", "Assistant"];

    showActionSheetWithOptions(
      {
        options,
      },
      async (buttonIndex) => {
        switch (buttonIndex) {
          case 0:
            setMode("agent");
            return;
          case 1:
            setMode("assistant");
            return;

          default:
            return;
        }
      }
    );
  }, [showActionSheetWithOptions, setMode, options]);

  const renderIcon = useCallback(() => {
    return (
      <View>
        <MaterialIcons
          name="attach-file"
          size={18}
          color="#374151" // Match WebSearchTool text color
        />
      </View>
    );
  }, []);

  return (
    <View style={styles.actionsContainer}>
      {/* <TouchableOpacity
        style={[styles.attachButton, containerStyle]}
        onPress={onActionsPress}
        activeOpacity={0.7}
      >
        {renderIcon()}
      </TouchableOpacity> */}
      <TouchableOpacity
        style={styles.modeButton}
        onPress={onModePress}
        activeOpacity={0.7}
      >
        <Text style={[styles.modeText, iconTextStyle]}>
          {ajora.mode.charAt(0).toUpperCase() + ajora.mode.slice(1)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 4,
    height: 44, // Match the Send button height
  },
  attachButton: {
    width: 36,
    height: 36,
    backgroundColor: "#f8f9fa", // Match WebSearchTool background
    borderRadius: 12, // Match WebSearchTool border radius
    borderWidth: 1,
    borderColor: "#e2e8f0", // Match WebSearchTool border color
    alignItems: "center",
    justifyContent: "center",
  },
  modeButton: {
    backgroundColor: "#f8f9fa", // Match WebSearchTool background
    borderRadius: 12, // Match WebSearchTool border radius
    borderWidth: 1,
    borderColor: "#e2e8f0", // Match WebSearchTool border color
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 70,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  modeText: {
    color: "#374151", // Match WebSearchTool text color
    fontWeight: "600",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  // Legacy styles for backward compatibility
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
