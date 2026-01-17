import { ReactNode, useCallback } from "react";
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
} from "./utils/mediaUtils";
import { MaterialIcons } from "@expo/vector-icons";
import { useChatContext } from "./AjoraContext";
import { Attachement } from "./hooks/useAjora";

export interface OnUploadProps {
  file: { fileUri: string; displayName: string; mimeType: string };
  onProgress?: (progress: number, isUploaded?: boolean) => void;
  onSuccess?: (uploadedUrl: string) => void;
  onError?: (error: any) => void;
}

export interface ActionsProps {
  options?: { [key: string]: () => void };
  optionTintColor?: string;
  icon?: () => ReactNode;
  wrapperStyle?: StyleProp<ViewStyle>;
  iconTextStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  onPressActionButton?(): void;
  onUpload?(props: OnUploadProps): Promise<void>;
}

export function Actions({
  options = {
    Camera: () => {},
    Photo: () => {},
    File: () => {},
    Cancel: () => {},
  },
  optionTintColor: _optionTintColor = Color.optionTintColor,
  icon: _icon,
  wrapperStyle: _wrapperStyle,
  iconTextStyle,
  onPressActionButton,
  onUpload,
}: ActionsProps) {
  const { showActionSheetWithOptions } = useActionSheet();
  const { ajora } = useChatContext();
  const { setMode, setAttachement, clearAttachement, attachement } = ajora;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onActionsPress = useCallback(async () => {
    const options = ["Camera", "Photo", "File", "Cancel"];
    const cancelButtonIndex = options.length - 1;

    const onAttachement = async (attachement: Attachement) => {
      const newAttachement: Attachement = {
        displayName: attachement.displayName,
        mimeType: attachement.mimeType,
        fileUri: attachement.fileUri,
        progress: 0,
        isUploaded: false,
      };

      clearAttachement();
      setAttachement(newAttachement);

      // Call handleUpload with the attachment data directly instead of relying on state
      if (onUpload) {
        const onProgress = async (progress: number, isUploaded?: boolean) => {
          ajora.updateAttachement({
            ...newAttachement,
            progress,
            isUploaded: isUploaded ?? false,
          });
        };

        try {
          await onUpload({
            file: {
              fileUri: newAttachement.fileUri ?? "",
              displayName: newAttachement.displayName ?? "",
              mimeType: newAttachement.mimeType ?? "",
            },
            onProgress: (progress) => {
              onProgress?.(progress, progress === 100);
            },
            onSuccess: (uploadedUrl) => {
              console.log("File uploaded successfully", uploadedUrl);
              ajora.updateAttachement({
                ...newAttachement,
                fileUri: uploadedUrl,
                isUploaded: true,
                progress: 100,
              });
            },
            onError: (error) => {
              console.error("File upload failed:", error);
              clearAttachement();
            },
          });
        } catch (error) {
          console.error("File upload failed:", error);
          ajora.updateAttachement({
            ...newAttachement,
            isUploaded: false,
            progress: 0,
          });
        }
      } else {
        console.error("[Ajora]: onUpload is not defined");
      }
    };

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async (buttonIndex) => {
        switch (buttonIndex) {
          case 0:
            takePictureAsync(onAttachement);
            return;
          case 1:
            pickImageAsync(onAttachement);
            return;
          case 2:
            filePickerAsync(onAttachement);
            return;
        }
      }
    );
  }, [showActionSheetWithOptions, clearAttachement, setAttachement]);

  if (false) {
    onActionsPress();
  }

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
        <MaterialIcons name="attach-file" size={18} color={Color.gray700} />
      </View>
    );
  }, []);

  return (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={[styles.attachButton]}
        onPress={onActionsPress}
        activeOpacity={0.7}
      >
        {renderIcon()}
      </TouchableOpacity>
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
    backgroundColor: Color.muted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Color.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modeButton: {
    backgroundColor: Color.muted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Color.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 70,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  modeText: {
    color: Color.gray700,
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
    borderColor: Color.defaultColor,
    borderWidth: 2,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    color: Color.defaultColor,
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 16,
    backgroundColor: "transparent",
    textAlign: "center",
  },
});
