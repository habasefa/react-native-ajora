import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { IMessage } from "./types";
import stylesCommon from "./styles";
import Color from "./Color";

// Optional expo-audio import for audio playback functionality
let useAudioPlayer: any = null;
try {
  const expoAudio = require("expo-audio");
  useAudioPlayer = expoAudio.useAudioPlayer;
} catch (error) {
  // expo-audio not available, audio playback will be disabled
  console.warn("expo-audio not available, audio playback disabled");
}

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
    maxWidth: 280,
    minWidth: 200,
    minHeight: 80,
    overflow: "hidden",
  },
  audioCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    minHeight: 80,
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Color.foreground,
    marginBottom: 4,
  },
  audioSubtitle: {
    fontSize: 14,
    color: Color.mutedForeground,
  },
  audioDuration: {
    fontSize: 12,
    color: Color.mutedForeground,
    marginTop: 2,
  },
  playButton: {
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
  playIcon: {
    color: Color.primaryForeground,
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
  const supportedAudioMimeTypes = [
    "audio/wav",
    "audio/mp3",
    "audio/aiff",
    "audio/aac",
    "audio/ogg",
    "audio/flac",
  ];

  const audioPart = currentMessage.parts?.find(
    (part) =>
      part.fileData?.mimeType &&
      supportedAudioMimeTypes.includes(part.fileData.mimeType)
  );
  const audioData = audioPart?.fileData;

  // Initialize audio player with the audio URI (if expo-audio is available)
  const player = useAudioPlayer ? useAudioPlayer(audioData?.fileUri) : null;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (player) {
      // Toggle play/pause
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    }
  };

  // Get audio file name from the structured data or fallback to URI parsing
  const getAudioFileName = (): string => {
    if (audioData?.displayName) {
      return audioData.displayName;
    }
    if (audioData?.fileUri) {
      const pathParts = audioData.fileUri.split("/");
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

  // Get the appropriate icon based on playing state
  const getPlayIcon = (): string => {
    if (!player) return "play-arrow";
    return player.playing ? "pause" : "play-arrow";
  };

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
            <MaterialIcons
              name={getPlayIcon() as any}
              size={20}
              style={styles.playIcon}
            />
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
        </View>

        <View style={styles.playButton}>
          <MaterialIcons
            name={getPlayIcon() as any}
            size={20}
            style={styles.playIcon}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}
