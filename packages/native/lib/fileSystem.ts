import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";
import { Alert, Platform } from "react-native";

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Represents a file attachment with metadata
 */
export interface FileAttachment {
  /** Unique identifier for the attachment */
  id: string;
  /** File URI (local path) */
  uri: string;
  /** File name to display */
  displayName: string;
  /** MIME type of the file */
  mimeType: string;
  /** File size in bytes */
  size?: number;
  /** File type: 'image', 'video', 'document', 'audio', etc. */
  type: "image" | "video" | "document" | "audio" | "other";
  /** Whether the file is from camera */
  isFromCamera?: boolean;
}

/**
 * Options for picking images from gallery
 */
export interface ImagePickerOptions {
  /** Allow multiple selection */
  allowsMultipleSelection?: boolean;
  /** Allow editing before selection */
  allowsEditing?: boolean;
  /** Aspect ratio for editing [width, height] */
  aspect?: [number, number];
  /** Quality of the image (0-1) */
  quality?: number;
  /** Media types to pick */
  mediaTypes?: ImagePicker.MediaTypeOptions;
}

/**
 * Options for camera capture
 */
export interface CameraOptions {
  /** Allow editing before capture */
  allowsEditing?: boolean;
  /** Aspect ratio for editing [width, height] */
  aspect?: [number, number];
  /** Quality of the image/video (0-1) */
  quality?: number;
  /** Media type to capture */
  mediaTypes?: ImagePicker.MediaTypeOptions;
  /** Video quality */
  videoQuality?: number;
  /** Maximum duration for video in seconds */
  videoMaxDuration?: number;
}

/**
 * Options for document picker
 */
export interface DocumentPickerOptions {
  /** MIME types to allow */
  type?: string | string[];
  /** Whether to copy file to cache directory */
  copyToCacheDirectory?: boolean;
  /** Whether to allow multiple selection */
  multiple?: boolean;
}

/**
 * Result of a file operation
 */
export interface FileOperationResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
  /** File attachment if successful */
  attachment?: FileAttachment;
  /** Multiple file attachments if multiple selection */
  attachments?: FileAttachment[];
}

// ============================================================================
// Permission Helpers
// ============================================================================

/**
 * Request camera permission
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Permission Required",
        "Please enable camera access in your device settings to take photos or videos.",
        [
          {
            text: "Open Settings",
            onPress: () => Linking.openURL("app-settings:"),
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error requesting camera permission:", error);
    return false;
  }
}

/**
 * Request media library permission
 */
export async function requestMediaLibraryPermission(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Media Library Permission Required",
        "Please enable media library access in your device settings to select photos or videos.",
        [
          {
            text: "Open Settings",
            onPress: () => Linking.openURL("app-settings:"),
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error requesting media library permission:", error);
    return false;
  }
}

// ============================================================================
// File Type Helpers
// ============================================================================

/**
 * Determine file type from MIME type
 */
function getFileTypeFromMimeType(mimeType: string): FileAttachment["type"] {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("text") ||
    mimeType.includes("word") ||
    mimeType.includes("excel") ||
    mimeType.includes("powerpoint")
  ) {
    return "document";
  }
  return "other";
}

/**
 * Generate a unique file ID
 */
function generateFileId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Camera Operations
// ============================================================================

/**
 * Take a photo using the camera
 */
export async function takePhoto(
  options: CameraOptions = {}
): Promise<FileOperationResult> {
  try {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return {
        success: false,
        error: "Camera permission denied",
      };
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: options.allowsEditing ?? false,
      aspect: options.aspect,
      quality: options.quality ?? 1,
      mediaTypes: options.mediaTypes ?? ImagePicker.MediaTypeOptions.Images,
      videoQuality: options.videoQuality,
      videoMaxDuration: options.videoMaxDuration,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        success: false,
        error: "Camera capture canceled",
      };
    }

    const asset = result.assets[0];
    const mimeType = asset.mimeType || "image/jpeg";
    const fileName =
      asset.fileName ||
      `photo_${Date.now()}.${mimeType.includes("jpeg") ? "jpg" : "png"}`;

    const attachment: FileAttachment = {
      id: generateFileId(),
      uri: asset.uri,
      displayName: fileName,
      mimeType,
      size: asset.fileSize,
      type: getFileTypeFromMimeType(mimeType),
      isFromCamera: true,
    };

    return {
      success: true,
      attachment,
    };
  } catch (error) {
    console.error("Error taking photo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// Gallery Operations
// ============================================================================

/**
 * Pick images from the gallery
 */
export async function pickImages(
  options: ImagePickerOptions = {}
): Promise<FileOperationResult> {
  try {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      return {
        success: false,
        error: "Media library permission denied",
      };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: options.allowsMultipleSelection ?? false,
      allowsEditing: options.allowsEditing ?? false,
      aspect: options.aspect,
      quality: options.quality ?? 1,
      mediaTypes: options.mediaTypes ?? ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        success: false,
        error: "Image selection canceled",
      };
    }

    const attachments: FileAttachment[] = result.assets.map((asset) => {
      const mimeType = asset.mimeType || "image/jpeg";
      const fileName =
        asset.fileName ||
        `image_${Date.now()}.${mimeType.includes("jpeg") ? "jpg" : "png"}`;

      return {
        id: generateFileId(),
        uri: asset.uri,
        displayName: fileName,
        mimeType,
        size: asset.fileSize,
        type: getFileTypeFromMimeType(mimeType),
        isFromCamera: false,
      };
    });

    if (options.allowsMultipleSelection) {
      return {
        success: true,
        attachments,
      };
    }

    return {
      success: true,
      attachment: attachments[0],
    };
  } catch (error) {
    console.error("Error picking images:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Pick videos from the gallery
 */
export async function pickVideos(
  options: ImagePickerOptions = {}
): Promise<FileOperationResult> {
  return pickImages({
    ...options,
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
  });
}

// ============================================================================
// Document Operations
// ============================================================================

/**
 * Pick documents/files
 */
export async function pickDocuments(
  options: DocumentPickerOptions = {}
): Promise<FileOperationResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: options.type ?? "*/*",
      copyToCacheDirectory: options.copyToCacheDirectory ?? true,
      multiple: options.multiple ?? false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        success: false,
        error: "Document selection canceled",
      };
    }

    const attachments: FileAttachment[] = result.assets.map((asset) => {
      const mimeType = asset.mimeType || "application/octet-stream";
      const fileName = asset.name || `document_${Date.now()}`;

      return {
        id: generateFileId(),
        uri: asset.uri,
        displayName: fileName,
        mimeType,
        size: asset.size,
        type: getFileTypeFromMimeType(mimeType),
        isFromCamera: false,
      };
    });

    if (options.multiple) {
      return {
        success: true,
        attachments,
      };
    }

    return {
      success: true,
      attachment: attachments[0],
    };
  } catch (error) {
    console.error("Error picking documents:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// File System Operations
// ============================================================================

/**
 * Get file info from URI
 */
export async function getFileInfo(
  uri: string
): Promise<FileSystem.FileInfo | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info;
  } catch (error) {
    console.error("Error getting file info:", error);
    return null;
  }
}

/**
 * Check if file exists
 */
export async function fileExists(uri: string): Promise<boolean> {
  const info = await getFileInfo(uri);
  return info?.exists ?? false;
}

/**
 * Read file as base64 string
 */
export async function readFileAsBase64(uri: string): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });
    return base64;
  } catch (error) {
    console.error("Error reading file as base64:", error);
    return null;
  }
}

/**
 * Read file as string
 */
export async function readFileAsString(uri: string): Promise<string | null> {
  try {
    const content = await FileSystem.readAsStringAsync(uri, {
      encoding: "utf8",
    });
    return content;
  } catch (error) {
    console.error("Error reading file as string:", error);
    return null;
  }
}

/**
 * Copy file to a new location
 */
export async function copyFile(
  fromUri: string,
  toUri: string
): Promise<boolean> {
  try {
    await FileSystem.copyAsync({
      from: fromUri,
      to: toUri,
    });
    return true;
  } catch (error) {
    console.error("Error copying file:", error);
    return false;
  }
}

/**
 * Delete a file
 */
export async function deleteFile(uri: string): Promise<boolean> {
  try {
    const info = await getFileInfo(uri);
    if (!info?.exists) {
      return false;
    }
    await FileSystem.deleteAsync(uri, { idempotent: true });
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
}

/**
 * Get file size in bytes
 */
export async function getFileSize(uri: string): Promise<number | null> {
  try {
    const info = await getFileInfo(uri);
    if (info?.exists && info.size !== undefined) {
      return info.size;
    }
    return null;
  } catch (error) {
    console.error("Error getting file size:", error);
    return null;
  }
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// ============================================================================
// Convenience Functions for AttachmentSheet
// ============================================================================

/**
 * Handle attachment selection based on type
 * This is the main function to use with AttachmentSheet
 */
export async function handleAttachmentSelection(
  type: "camera" | "gallery" | "files",
  options?: {
    camera?: CameraOptions;
    gallery?: ImagePickerOptions;
    files?: DocumentPickerOptions;
  }
): Promise<FileOperationResult> {
  switch (type) {
    case "camera":
      return takePhoto(options?.camera);
    case "gallery":
      return pickImages(options?.gallery);
    case "files":
      return pickDocuments(options?.files);
    default:
      return {
        success: false,
        error: `Unknown attachment type: ${type}`,
      };
  }
}
