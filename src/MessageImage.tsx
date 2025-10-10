import React from "react";
import {
  Image,
  StyleSheet,
  View,
  ImageProps,
  ViewStyle,
  StyleProp,
  ImageStyle,
  ImageURISource,
} from "react-native";
// TODO: support web
import Lightbox, { LightboxProps } from "react-native-lightbox-v2";
import { IMessage } from "./types";
import stylesCommon from "./styles";
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
    maxWidth: 280,
    minWidth: 200,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  imageActive: {
    resizeMode: "contain",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  expandIcon: {
    fontSize: 24,
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  imageInfo: {
    padding: 12,
    backgroundColor: Color.muted,
    borderTopWidth: 1,
    borderTopColor: Color.border,
  },
  imageTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Color.foreground,
    marginBottom: 2,
  },
  imageSubtitle: {
    fontSize: 12,
    color: Color.mutedForeground,
  },
});

export interface MessageImageProps<TMessage extends IMessage> {
  currentMessage: TMessage;
  containerStyle?: StyleProp<ViewStyle>;
  imageSourceProps?: Partial<ImageURISource>;
  imageStyle?: StyleProp<ImageStyle>;
  imageProps?: Partial<ImageProps>;
  lightboxProps?: LightboxProps;
}

export function MessageImage<TMessage extends IMessage = IMessage>({
  containerStyle,
  lightboxProps,
  imageProps,
  imageSourceProps,
  imageStyle,
  currentMessage,
}: MessageImageProps<TMessage>) {
  if (currentMessage == null) return null;

  // Supported image mime types
  //   PNG - image/png
  // JPEG - image/jpeg
  // WEBP - image/webp
  // HEIC - image/heic
  // HEIF - image/heif

  const imagePart = currentMessage.parts?.find(
    (part) =>
      part.fileData?.mimeType === "image/jpeg" ||
      part.fileData?.mimeType === "image/png" ||
      part.fileData?.mimeType === "image/jpg" ||
      part.fileData?.mimeType === "image/webp" ||
      part.fileData?.mimeType === "image/heic" ||
      part.fileData?.mimeType === "image/heif"
  );
  const imageUri = imagePart?.fileData?.fileUri;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* @ts-expect-error: Lightbox types are not fully compatible */}
      <Lightbox
        activeProps={{
          style: [stylesCommon.fill, styles.imageActive],
        }}
        {...lightboxProps}
      >
        <View style={styles.imageContainer}>
          <Image
            {...imageProps}
            style={[styles.image, imageStyle]}
            source={{ ...imageSourceProps, uri: imageUri }}
          />
        </View>
      </Lightbox>
    </View>
  );
}
