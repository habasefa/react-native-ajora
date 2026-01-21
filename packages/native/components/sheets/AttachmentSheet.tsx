import React, { useCallback, useMemo, forwardRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";
import { type AttachmentSource } from "../../lib/fileSystem";

// ============================================================================
// Types & Interfaces
// ============================================================================

export type AttachmentType = AttachmentSource;

export interface AttachmentOption {
  id: AttachmentType;
  label: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface AttachmentSheetIcons {
  close?: React.ReactNode;
}

export interface AttachmentSheetProps {
  /** Callback when an attachment option is selected */
  onSelect?: (type: AttachmentType) => void;
  /** Callback when the sheet is closed */
  onClose?: () => void;
  /** Custom attachment options */
  options?: AttachmentOption[];
  /** Test ID for testing */
  testID?: string;

  /** Custom icons */
  icons?: AttachmentSheetIcons;

  // --- Style Overrides ---
  /** Style for the sheet container (top-level) */
  containerStyle?: StyleProp<ViewStyle>;
  /** Style for the sheet content background */
  sheetContentStyle?: StyleProp<ViewStyle>;
  /** Style for the sheet header */
  sheetHeaderStyle?: StyleProp<ViewStyle>;
  /** Style for the sheet title text */
  sheetTitleStyle?: StyleProp<TextStyle>;
  /** Style for the options container */
  optionsContainerStyle?: StyleProp<ViewStyle>;

  /** Style for each option item container */
  optionItemStyle?: StyleProp<ViewStyle>;
  /** Style for option label text */
  optionLabelStyle?: StyleProp<TextStyle>;

  // --- Component Overrides ---
  /** Custom render function for each attachment option */
  renderItem?: (props: {
    item: AttachmentOption;
    onPress: () => void;
    theme: any;
  }) => React.ReactNode;

  /** Custom render function for header */
  renderHeader?: (props: {
    title: string;
    onClose?: () => void;
  }) => React.ReactNode;

  /** Custom colors override (highest priority) */
  colors?: {
    text?: string;
    textSecondary?: string;
    border?: string;
    optionBackground?: string;
    optionBackgroundPressed?: string;
    iconColor?: string;
    iconBackground?: string;
    handleIndicator?: string;
    background?: string;
  };
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ATTACHMENT_OPTIONS: AttachmentOption[] = [
  {
    id: "camera",
    label: "Camera",
    description: "Take a photo or video",
    icon: "camera-outline",
  },
  {
    id: "gallery",
    label: "Gallery",
    description: "Choose from your photos",
    icon: "images-outline",
  },
  {
    id: "files",
    label: "Files",
    description: "Select documents or files",
    icon: "document-outline",
  },
];

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
    options = DEFAULT_ATTACHMENT_OPTIONS,
    testID = "attachment-sheet",
    icons: customIcons,
    containerStyle,
    sheetContentStyle,
    sheetHeaderStyle,
    sheetTitleStyle,
    optionsContainerStyle,
    optionItemStyle,
    optionLabelStyle,
    renderItem,
    renderHeader,
    colors: colorOverrides,
  },
  ref,
) {
  // ========================================================================
  // Theme - Priority: colorOverrides > global theme (user custom > default)
  // ========================================================================

  const theme = useAjoraTheme();

  const colors = useMemo(
    () => ({
      text: colorOverrides?.text ?? theme.colors.text,
      textSecondary:
        colorOverrides?.textSecondary ?? theme.colors.textSecondary,
      border: colorOverrides?.border ?? theme.colors.border,
      optionBackground:
        colorOverrides?.optionBackground ?? theme.colors.surface,
      optionBackgroundPressed:
        colorOverrides?.optionBackgroundPressed ?? theme.colors.border,
      iconColor: colorOverrides?.iconColor ?? theme.colors.iconDefault,
      iconBackground: colorOverrides?.iconBackground ?? theme.colors.border,
      handleIndicator: colorOverrides?.handleIndicator ?? theme.colors.border,
      background: colorOverrides?.background ?? theme.colors.surface,
    }),
    [theme, colorOverrides],
  );

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
    [onSelect, ref],
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
    [],
  );

  // ========================================================================
  // Default Renders
  // ========================================================================

  const defaultRenderHeader = () => (
    <Text
      style={[styles.title, { color: colors.text }, sheetTitleStyle]}
      testID={testID}
    >
      Add Attachment
    </Text>
  );

  const defaultRenderItem = (option: AttachmentOption) => (
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
        optionItemStyle,
      ]}
      testID={`${testID}-option-${option.id}`}
      accessibilityRole="button"
      accessibilityLabel={option.label}
      accessibilityHint={option.description}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.iconBackground },
        ]}
      >
        <Ionicons name={option.icon} size={26} color={colors.iconColor} />
      </View>
      <Text
        style={[styles.optionLabel, { color: colors.text }, optionLabelStyle]}
        numberOfLines={1}
      >
        {option.label}
      </Text>
    </Pressable>
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
        sheetContentStyle,
      ]}
      style={containerStyle}
    >
      <BottomSheetView style={[styles.container, sheetHeaderStyle]}>
        {renderHeader
          ? renderHeader({ title: "Add Attachment", onClose: handleDismiss })
          : defaultRenderHeader()}

        <View style={[styles.optionsContainer, optionsContainerStyle]}>
          {options.map((option) => {
            if (renderItem) {
              return renderItem({
                item: option,
                onPress: () => handleSelect(option.id),
                theme: { colors },
              });
            }
            return defaultRenderItem(option);
          })}
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  handleIndicator: {
    width: 36,
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
    marginBottom: 24,
    textAlign: "center",
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  optionItem: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 88,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default AttachmentSheet;
