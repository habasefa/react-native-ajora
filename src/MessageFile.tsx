import React from "react";
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Text,
  ViewProps,
  TouchableOpacity,
  Pressable,
  Alert,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { IMessage } from "./types";
import Color from "./Color";

const styles = StyleSheet.create({
  container: {
    backgroundColor: Color.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Color.border,
    shadowColor: Color.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    maxWidth: 350,
    minWidth: 250,
    overflow: "hidden",
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  fileIcon: {
    marginRight: 16,
    color: Color.mutedForeground,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "600",
    color: Color.foreground,
    marginBottom: 4,
  },
  fileMeta: {
    fontSize: 14,
    color: Color.mutedForeground,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Color.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    shadowColor: Color.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    color: Color.primaryForeground,
  },
});

export interface MessageFileProps<TMessage extends IMessage> {
  currentMessage: TMessage;
  containerStyle?: StyleProp<ViewStyle>;
  fileProps?: Partial<ViewProps>;
  onPress?: () => void;
  onDownload?: () => void;
  onOpen?: () => void;
}

export function MessageFile<TMessage extends IMessage = IMessage>({
  containerStyle,
  fileProps,
  currentMessage,
  onPress,
  onDownload,
  onOpen,
}: MessageFileProps<TMessage>) {
  if (currentMessage == null) return null;

  const supportedFileMimeTypes = ["application/pdf"];

  const filePart = currentMessage.parts?.find(
    (part) =>
      part.fileData?.mimeType &&
      supportedFileMimeTypes.includes(part.fileData.mimeType)
  );
  const fileData = filePart?.fileData;

  // Helper function to get filename
  const getFileName = (): string => {
    if (fileData?.displayName) {
      return fileData.displayName;
    }
    if (fileData?.fileUri) {
      const pathParts = fileData.fileUri.split("/");
      const fileName = pathParts[pathParts.length - 1];
      const cleanFileName = fileName.split("?")[0];
      return cleanFileName || "File";
    }
    return "File";
  };

  // Helper function to get file extension
  const getFileExtension = (): string => {
    if (fileData?.mimeType) {
      const format = fileData.mimeType.split("/")[1];
      return format?.toLowerCase() || "";
    }
    const fileName = getFileName();
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1) return "";
    return fileName.substring(lastDotIndex + 1).toLowerCase();
  };

  // Helper function to determine file type
  const getFileType = (extension: string): string => {
    const typeMap: Record<string, string> = {
      pdf: "document",
    };

    return typeMap[extension] || "document";
  };

  // Helper function to get file icon
  const getFileIcon = (fileType: string): string => {
    const iconMap: Record<string, string> = {
      document: "picture-as-pdf",
    };

    return iconMap[fileType] || "picture-as-pdf";
  };

  // Helper function to format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return "";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const fileName = getFileName();
  const fileExtension = getFileExtension();
  const fileType = getFileType(fileExtension);

  const handleOpenFile = async () => {
    if (onOpen) {
      onOpen();
      return;
    }

    if (fileData?.fileUri) {
      try {
        const canOpen = await Linking.canOpenURL(fileData.fileUri);
        if (canOpen) {
          await Linking.openURL(fileData.fileUri);
        } else {
          Alert.alert(
            "Cannot open file",
            "No app is available to open this file type.",
            [{ text: "OK" }]
          );
        }
      } catch (error) {
        Alert.alert("Error", "Failed to open file. Please try again.", [
          { text: "OK" },
        ]);
      }
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      handleOpenFile();
    }
  };

  // If no file data is found, show a fallback message
  if (!fileData) {
    return (
      <Pressable
        style={[styles.container, containerStyle]}
        onPress={handlePress}
        {...fileProps}
      >
        <View style={styles.fileCard}>
          <MaterialIcons
            name="picture-as-pdf"
            size={24}
            style={styles.fileIcon}
          />

          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>PDF Document</Text>
            <Text style={styles.fileMeta}>No file data available</Text>
          </View>

          {onDownload && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onDownload}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="download"
                size={20}
                style={styles.actionIcon}
              />
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.container, containerStyle]}
      onPress={handlePress}
      {...fileProps}
    >
      <View style={styles.fileCard}>
        <MaterialIcons
          name={getFileIcon(fileType) as any}
          size={24}
          style={styles.fileIcon}
        />

        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <Text style={styles.fileMeta}>
            {fileExtension ? `${fileExtension.toUpperCase()} file` : "File"}
          </Text>
        </View>

        {onDownload && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onDownload}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="download"
              size={20}
              style={styles.actionIcon}
            />
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
}
