import * as React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Linking,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Lightbox from "react-native-lightbox-v2";
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";

/**
 * A `binary` content part as it appears in an ag-ui message's `content` array.
 * Kept local (not imported from @ag-ui/core) so we can render defensively when
 * the upstream type definitions drift.
 */
interface BinaryContentPart {
  type: "binary";
  url?: string;
  data?: string;
  mimeType: string;
  filename?: string;
  id?: string;
}

function isBinaryPart(part: unknown): part is BinaryContentPart {
  return (
    !!part &&
    typeof part === "object" &&
    (part as { type?: unknown }).type === "binary" &&
    typeof (part as { mimeType?: unknown }).mimeType === "string"
  );
}

function extractBinaryParts(content: unknown): BinaryContentPart[] {
  if (!Array.isArray(content)) return [];
  const out: BinaryContentPart[] = [];
  for (const part of content) {
    if (isBinaryPart(part)) out.push(part);
  }
  return out;
}

function resolveSourceUri(part: BinaryContentPart): string | undefined {
  if (part.url) return part.url;
  if (part.data) {
    return part.data.startsWith("data:")
      ? part.data
      : `data:${part.mimeType};base64,${part.data}`;
  }
  return undefined;
}

export interface MessageAttachmentsProps {
  content: unknown;
  align?: "flex-start" | "flex-end";
  style?: StyleProp<ViewStyle>;
}

const THUMBNAIL_SIZE = 120;

/**
 * Renders `binary` content parts attached to a message — images as
 * lightbox-capable thumbnails, non-images as tappable file chips. Returns
 * `null` when the content has no binary parts so callers can drop it in
 * unconditionally.
 */
export const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
  content,
  align = "flex-end",
  style,
}) => {
  const parts = React.useMemo(() => extractBinaryParts(content), [content]);
  const theme = useAjoraTheme();

  if (parts.length === 0) return null;

  return (
    <View style={[styles.container, { alignItems: align }, style]}>
      {parts.map((part, index) => {
        const key = part.id ?? part.url ?? `${part.mimeType}-${index}`;
        const uri = resolveSourceUri(part);
        const isImage = part.mimeType.startsWith("image/") && !!uri;

        if (isImage) {
          return (
            <View key={key} style={styles.thumbWrapper}>
              {/* @ts-expect-error - Lightbox types are incomplete */}
              <Lightbox
                renderContent={() => (
                  <Image
                    source={{ uri }}
                    style={styles.lightboxImage}
                    resizeMode="contain"
                    accessibilityLabel={part.filename ?? "Attached image"}
                  />
                )}
                activeProps={{
                  style: { flex: 1, width: "100%", height: "100%" },
                }}
                underlayColor="transparent"
              >
                <Image
                  source={{ uri }}
                  style={[
                    styles.thumb,
                    { backgroundColor: theme.colors.surface },
                  ]}
                  resizeMode="cover"
                  accessibilityLabel={part.filename ?? "Attached image"}
                />
              </Lightbox>
            </View>
          );
        }

        return (
          <FileChip
            key={key}
            filename={part.filename ?? "File"}
            mimeType={part.mimeType}
            uri={uri}
          />
        );
      })}
    </View>
  );
};

MessageAttachments.displayName = "MessageAttachments";

interface FileChipProps {
  filename: string;
  mimeType: string;
  uri?: string;
}

const FileChip: React.FC<FileChipProps> = ({ filename, mimeType, uri }) => {
  const theme = useAjoraTheme();

  const iconName: React.ComponentProps<typeof Ionicons>["name"] =
    mimeType === "application/pdf"
      ? "document-text-outline"
      : mimeType.startsWith("text/")
        ? "document-outline"
        : mimeType.startsWith("audio/")
          ? "musical-notes-outline"
          : mimeType.startsWith("video/")
            ? "videocam-outline"
            : "document-outline";

  const handlePress = React.useCallback(() => {
    if (!uri) return;
    Linking.openURL(uri).catch(() => {
      // Swallow — RN throws if no handler can open the URL. The tap simply
      // becomes a no-op rather than crashing the message list.
    });
  }, [uri]);

  return (
    <Pressable
      onPress={uri ? handlePress : undefined}
      disabled={!uri}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        pressed && uri ? { opacity: 0.7 } : null,
      ]}
      accessibilityRole={uri ? "link" : "text"}
      accessibilityLabel={filename}
    >
      <Ionicons
        name={iconName}
        size={18}
        color={theme.colors.iconDefault}
        style={styles.chipIcon}
      />
      <Text
        style={[styles.chipText, { color: theme.colors.text }]}
        numberOfLines={1}
      >
        {filename}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    maxWidth: "85%",
    marginBottom: 4,
    justifyContent: "flex-end",
  },
  thumbWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },
  thumb: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 12,
  },
  lightboxImage: {
    width: "100%",
    height: "100%",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 240,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
    flexShrink: 1,
  },
});

export default MessageAttachments;
