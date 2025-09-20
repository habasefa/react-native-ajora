import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from "react-native";
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
    maxWidth: 400, // Double the width
    minWidth: 300, // Double the min width
    minHeight: 80, // Increased height
  },
  audioCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16, // Increased padding
    minHeight: 80,
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 16, // Larger text
    fontWeight: "600",
    color: "#212529", // Dark text for whitish background
    marginBottom: 4,
  },
  audioSubtitle: {
    fontSize: 14, // Larger text
    color: "#6c757d", // Medium grey text
  },
  audioDuration: {
    fontSize: 12,
    color: "#999999", // Medium grey
    marginTop: 2,
  },
  playButton: {
    width: 48, // Larger button
    height: 48, // Larger button
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
  playIcon: {
    fontSize: 20, // Larger icon
    color: "#ffffff", // White icon
  },
});

export interface MessageAudioProps<TMessage extends IMessage> {
  currentMessage: TMessage;
  containerStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function MessageAudio<TMessage extends IMessage = IMessage>({
  currentMessage,
  containerStyle,
  onPress,
}: MessageAudioProps<TMessage>) {
  if (currentMessage == null) return null;

  const audioPart = currentMessage.parts?.find((part) => part.audio);
  const audioData = audioPart?.audio;

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  // Get audio file name from the structured data or fallback to URI parsing
  const getAudioFileName = (): string => {
    if (audioData?.name) {
      return audioData.name;
    }
    if (audioData?.uri) {
      const pathParts = audioData.uri.split("/");
      const fileName = pathParts[pathParts.length - 1];
      const cleanFileName = fileName.split("?")[0];
      return cleanFileName || "Audio";
    }
    return "Audio";
  };

  // Get audio file extension from mimeType or filename
  const getAudioFileType = (): string => {
    if (audioData?.mimeType) {
      // Extract format from mimeType (e.g., "audio/mp4" -> "MP4")
      const format = audioData.mimeType.split("/")[1];
      return format?.toUpperCase() || "AUDIO";
    }

    const fileName = getAudioFileName();
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1) return "AUDIO";
    return fileName.substring(lastDotIndex + 1).toUpperCase();
  };

  // Format file size for display
  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return "";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const audioFileName = getAudioFileName();
  const audioFileType = getAudioFileType();
  const audioFileSize = formatFileSize(audioData?.size);

  // If no audio data is found, show a fallback message
  if (!audioData) {
    return (
      <TouchableOpacity
        style={[styles.container, containerStyle]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.audioCard}>
          <View style={styles.audioInfo}>
            <Text style={styles.audioTitle}>Audio Message</Text>
            <Text style={styles.audioSubtitle}>No audio data available</Text>
          </View>
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.audioCard}>
        <View style={styles.audioInfo}>
          <Text style={styles.audioTitle} numberOfLines={1}>
            {audioFileName}
          </Text>
          <Text style={styles.audioSubtitle}>
            {audioFileType}
            {audioFileSize ? ` • ${audioFileSize}` : ""}
          </Text>
        </View>

        <View style={styles.playButton}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
