import React, { useCallback, useMemo, forwardRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
  Platform,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";

// ============================================================================
// Types & Interfaces
// ============================================================================

export type AttachmentType = "camera" | "gallery" | "files";

export interface AttachmentOption {
  id: AttachmentType;
  label: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export interface AttachmentSheetTheme {
  container?: StyleProp<ViewStyle>;
  handleIndicator?: string;
  background?: string;
  colors?: {
    text?: string;
    textSecondary?: string;
    border?: string;
    optionBackground?: string;
    optionBackgroundPressed?: string;
  };
}

export interface AttachmentSheetProps {
  /** Callback when an attachment option is selected */
  onSelect?: (type: AttachmentType) => void;
  /** Callback when the sheet is closed */
  onClose?: () => void;
  /** Custom theme overrides */
  theme?: AttachmentSheetTheme;
  /** Whether to use dark mode */
  darkMode?: boolean;
  /** Custom attachment options */
  options?: AttachmentOption[];
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ATTACHMENT_OPTIONS: AttachmentOption[] = [
  {
    id: "camera",
    label: "Camera",
    description: "Take a photo or video",
    icon: "camera",
    color: "#3B82F6",
  },
  {
    id: "gallery",
    label: "Gallery",
    description: "Choose from your photos",
    icon: "images",
    color: "#8B5CF6",
  },
  {
    id: "files",
    label: "Files",
    description: "Select documents or files",
    icon: "document",
    color: "#F59E0B",
  },
];

const LIGHT_COLORS = {
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  optionBackground: "#F9FAFB",
  optionBackgroundPressed: "#E5E7EB",
  handleIndicator: "#D1D5DB",
  background: "#FFFFFF",
};

const DARK_COLORS = {
  text: "#F9FAFB",
  textSecondary: "#9CA3AF",
  border: "#374151",
  optionBackground: "#1F2937",
  optionBackgroundPressed: "#374151",
  handleIndicator: "#4B5563",
  background: "#111827",
};

// ============================================================================
// Component
// ============================================================================

export const AttachmentSheet = forwardRef<
  BottomSheetModal,
  AttachmentSheetProps
>(function AttachmentSheet(
  {
    onSelect,
    onClose,
    theme,
    darkMode = false,
    options = DEFAULT_ATTACHMENT_OPTIONS,
    testID = "attachment-sheet",
  },
  ref
) {
  // ========================================================================
  // Theme
  // ========================================================================

  const colors = useMemo(() => {
    const baseColors = darkMode ? DARK_COLORS : LIGHT_COLORS;
    return { ...baseColors, ...theme?.colors };
  }, [darkMode, theme?.colors]);

  const snapPoints = useMemo(() => ["28%"], []);

  // ========================================================================
  // Callbacks
  // ========================================================================

  const handleSelect = useCallback(
    (type: AttachmentType) => {
      onSelect?.(type);
      // @ts-expect-error - ref type issue
      ref?.current?.dismiss();
    },
    [onSelect, ref]
  );

  const handleDismiss = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose={true}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={[
        styles.handleIndicator,
        { backgroundColor: colors.handleIndicator },
      ]}
      backgroundStyle={[
        styles.sheetBackground,
        { backgroundColor: colors.background },
      ]}
    >
      <BottomSheetView style={[styles.container, theme?.container]}>
        <Text style={[styles.title, { color: colors.text }]} testID={testID}>
          Add Attachment
        </Text>

        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => handleSelect(option.id)}
              style={({ pressed }) => [
                styles.optionItem,
                {
                  backgroundColor: pressed
                    ? colors.optionBackgroundPressed
                    : colors.optionBackground,
                },
              ]}
              testID={`${testID}-option-${option.id}`}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityHint={option.description}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${option.color}15` },
                ]}
              >
                <Ionicons name={option.icon} size={28} color={option.color} />
              </View>
              <Text
                style={[styles.optionLabel, { color: colors.text }]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 32,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  optionItem: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    minWidth: 90,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default AttachmentSheet;
