import React, { useCallback } from "react";
import {
  StyleProp,
  ViewStyle,
  TextStyle,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from "react-native";

import { useActionSheet } from "@expo/react-native-action-sheet";
import {
  pickImageAsync,
  takePictureAsync,
  filePickerAsync,
  audioPickerAsync,
} from "./mediaUtils";
import { MaterialIcons } from "@expo/vector-icons";

interface Props {
  renderIcon?: () => React.ReactNode;
  wrapperStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  iconTextStyle?: StyleProp<TextStyle>;
  onSend: (messages: unknown) => void;
  onModeChange?: (mode: string) => void;
  currentMode?: string;
}

const CustomActions = ({
  renderIcon,
  iconTextStyle,
  containerStyle,
  wrapperStyle,
  onSend,
  onModeChange,
  currentMode = "auto",
}: Props) => {
  const { showActionSheetWithOptions } = useActionSheet();

  const onActionsPress = useCallback(() => {
    const options = ["Photo", "Camera", "File", "Audio", "Cancel"];
    const cancelButtonIndex = options.length - 1;

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
  }, [showActionSheetWithOptions, onSend]);

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
            // Auto mode
            onModeChange?.("auto");
            return;
          case 1:
            // Thinking mode
            onModeChange?.("thinking");
            return;
          case 2:
            // Image mode
            onModeChange?.("image");
            return;
          case 3:
            // Search mode
            onModeChange?.("search");
            return;
        }
      }
    );
  }, [showActionSheetWithOptions, onModeChange]);

  const renderIconComponent = useCallback(() => {
    if (renderIcon) return renderIcon();

    return (
      <View>
        <MaterialIcons name="attach-file" size={24} color="black" />
      </View>
    );
  }, [renderIcon]);

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
        {renderIconComponent()}
      </TouchableOpacity>
      <TouchableOpacity style={{ width: 100 }} onPress={onAutoPress}>
        <Text style={[styles.iconText, iconTextStyle]}>
          {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default CustomActions;

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
