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
// TODO: support web
import { IMessage } from "./types";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa", // Whitish background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef", // Light grey border
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    maxWidth: 400, // Match MessageAudio width
    minWidth: 300, // Match MessageAudio min width
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16, // Increased padding to match MessageAudio
  },
  fileIcon: {
    fontSize: 24, // Larger icon to match MessageAudio
    marginRight: 16, // More spacing
    color: "#6c757d", // Medium grey color
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16, // Larger text to match MessageAudio
    fontWeight: "600",
    color: "#212529", // Dark text for whitish background
    marginBottom: 4,
  },
  fileMeta: {
    fontSize: 14, // Larger text to match MessageAudio
    color: "#6c757d", // Medium grey text
  },
  actionButton: {
    width: 48, // Larger button to match MessageAudio
    height: 48,
    borderRadius: 24,
    backgroundColor: "#212529", // Dark background for whitish theme
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 20, // Larger icon to match MessageAudio
    color: "#ffffff", // White icon
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

  const filePart = currentMessage.parts[0];
  const fileData = filePart?.file;

  // Helper function to get filename
  const getFileName = (): string => {
    if (fileData?.name) {
      return fileData.name;
    }
    if (fileData?.uri) {
      const pathParts = fileData.uri.split("/");
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
      // Documents
      pdf: "document",
      doc: "document",
      docx: "document",
      txt: "document",
      rtf: "document",
      odt: "document",
      pages: "document",

      // Spreadsheets
      xls: "spreadsheet",
      xlsx: "spreadsheet",
      csv: "spreadsheet",
      ods: "spreadsheet",
      numbers: "spreadsheet",

      // Presentations
      ppt: "presentation",
      pptx: "presentation",
      odp: "presentation",
      key: "presentation",

      // Images
      jpg: "image",
      jpeg: "image",
      png: "image",
      gif: "image",
      bmp: "image",
      svg: "image",
      webp: "image",
      tiff: "image",
      ico: "image",
      heic: "image",

      // Videos
      mp4: "video",
      avi: "video",
      mov: "video",
      wmv: "video",
      flv: "video",
      webm: "video",
      mkv: "video",
      m4v: "video",
      "3gp": "video",

      // Audio
      mp3: "audio",
      wav: "audio",
      flac: "audio",
      aac: "audio",
      ogg: "audio",
      m4a: "audio",
      wma: "audio",

      // Archives
      zip: "archive",
      rar: "archive",
      "7z": "archive",
      tar: "archive",
      gz: "archive",
      bz2: "archive",
      xz: "archive",

      // Code
      js: "code",
      ts: "code",
      jsx: "code",
      tsx: "code",
      py: "code",
      java: "code",
      cpp: "code",
      c: "code",
      html: "code",
      css: "code",
      json: "code",
      xml: "code",
      yaml: "code",
      yml: "code",
      md: "code",
      sql: "code",
      php: "code",
      rb: "code",
      go: "code",
      rs: "code",
      swift: "code",
      kt: "code",

      // Fonts
      ttf: "font",
      otf: "font",
      woff: "font",
      woff2: "font",

      // Executables
      exe: "executable",
      dmg: "executable",
      pkg: "executable",
      deb: "executable",
      rpm: "executable",
      apk: "executable",
      ipa: "executable",
    };

    return typeMap[extension] || "file";
  };

  // Helper function to get file icon
  const getFileIcon = (fileType: string): string => {
    const iconMap: Record<string, string> = {
      document: "📄",
      spreadsheet: "📊",
      presentation: "📽️",
      image: "🖼️",
      video: "🎥",
      audio: "🎵",
      archive: "📦",
      code: "💻",
      font: "🔤",
      executable: "⚙️",
      file: "📁",
    };

    return iconMap[fileType] || "📁";
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
  const fileSize = formatFileSize(fileData?.size);

  const handleOpenFile = async () => {
    if (onOpen) {
      onOpen();
      return;
    }

    if (fileData?.uri) {
      try {
        const canOpen = await Linking.canOpenURL(fileData.uri);
        if (canOpen) {
          await Linking.openURL(fileData.uri);
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

  return (
    <Pressable
      style={[styles.container, containerStyle]}
      onPress={handlePress}
      {...fileProps}
    >
      <View style={styles.fileCard}>
        <Text style={styles.fileIcon}>{getFileIcon(fileType)}</Text>

        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <Text style={styles.fileMeta}>
            {fileExtension ? `${fileExtension.toUpperCase()} file` : "File"}
            {fileSize ? ` • ${fileSize}` : ""}
          </Text>
        </View>

        {onDownload && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onDownload}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>⬇</Text>
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
}
