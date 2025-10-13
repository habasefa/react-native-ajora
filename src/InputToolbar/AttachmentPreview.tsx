import React from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from "react-native";
// TODO: support web
import Lightbox from "react-native-lightbox-v2";
import { MaterialIcons } from "@expo/vector-icons";
import { useChatContext } from "../AjoraContext";
import Color from "../Color";

interface AttachmentPreviewProps {
  renderAttachment?: () => React.ReactNode;
}

export function AttachmentPreview({
  renderAttachment,
}: AttachmentPreviewProps) {
  const { ajora } = useChatContext();
  const { clearAttachement, attachement } = ajora;
  console.log("attachement in AttachmentPreview.tsx", attachement);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper function to get file type from MIME type
  const getFileType = (mimeType?: string): string => {
    if (!mimeType) return "file";

    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType === "application/pdf") return "pdf";

    return "file";
  };

  // Helper function to get file icon based on type
  const getFileIcon = (fileType: string): string => {
    const iconMap: Record<string, string> = {
      image: "image",
      video: "videocam",
      audio: "audiotrack",
      pdf: "picture-as-pdf",
      file: "insert-drive-file",
    };

    return iconMap[fileType] || "insert-drive-file";
  };

  const handleRemove = () => {
    clearAttachement();
  };

  // Early return if no attachment
  if (!attachement) return null;

  // If custom render function is provided, use it
  if (renderAttachment) return renderAttachment();

  const fileType = getFileType(attachement.mimeType);
  const fileIcon = getFileIcon(fileType);
  const isImage = fileType === "image";

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.previewCard}>
        {/* File Preview Container */}
        <View style={styles.previewContainer}>
          {isImage ? (
            // Image Preview with Lightbox
            // @ts-expect-error: Lightbox types are not fully compatible
            <Lightbox
              renderContent={() => (
                <Image
                  source={{ uri: (attachement as any)?.fileUri }}
                  style={styles.fullscreenImage}
                />
              )}
              activeProps={{ style: styles.fullscreenImage }}
              underlayColor="transparent"
            >
              <Image
                source={{ uri: (attachement as any)?.fileUri }}
                style={styles.image}
              />
            </Lightbox>
          ) : (
            // Non-image file preview
            <View style={styles.filePreview}>
              <MaterialIcons
                name={fileIcon as any}
                size={32}
                color={Color.gray600}
              />
            </View>
          )}

          {/* Upload Progress Overlay (if uploading) */}
          {attachement?.progress !== undefined &&
            attachement?.progress < 100 && (
              <View style={styles.progressOverlay}>
                <ActivityIndicator size="small" color={Color.white} />
              </View>
            )}

          {/* Remove Button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemove}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={12} color={Color.white} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: "flex-start",
  },
  previewCard: {
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
    shadowRadius: 6,
    // elevation: 3,
    overflow: "hidden",
    maxWidth: 120,
    width: "40%",
  },
  previewContainer: {
    position: "relative",
    height: 80,
    backgroundColor: Color.gray50,
  },
  filePreview: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Color.gray100,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  fullscreenImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    backgroundColor: "black",
  },
  progressOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressTextContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    color: Color.white,
    fontSize: 14,
    fontWeight: "600",
  },
  removeButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Color.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
