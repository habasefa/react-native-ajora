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

export type ThreadMenuAction = "rename" | "delete";

export interface ThreadMenuOption {
  id: ThreadMenuAction;
  label: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
}

export interface ThreadMenuSheetTheme {
  container?: StyleProp<ViewStyle>;
  handleIndicator?: string;
  background?: string;
  colors?: {
    text?: string;
    textSecondary?: string;
    border?: string;
    optionBackground?: string;
    optionBackgroundPressed?: string;
    destructiveText?: string;
  };
}

export interface ThreadMenuSheetProps {
  /** Thread name to display */
  threadName?: string;
  /** Callback when rename action is selected */
  onRename?: (newName: string) => void;
  /** Callback when delete action is selected */
  onDelete?: () => void;
  /** Callback when the sheet is closed */
  onClose?: () => void;
  /** Custom theme overrides */
  theme?: ThreadMenuSheetTheme;
  /** Whether to use dark mode */
  darkMode?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Constants
// ============================================================================

const LIGHT_COLORS = {
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E8E8E8",
  optionBackground: "#F5F5F5",
  optionBackgroundPressed: "#E8E8E8",
  iconColor: "#6B7280",
  iconBackground: "#E8E8E8",
  handleIndicator: "#D1D5DB",
  background: "#FFFFFF",
  destructiveText: "#EF4444",
};

const DARK_COLORS = {
  text: "#F9FAFB",
  textSecondary: "#8E8E93",
  border: "#2C2C2E",
  optionBackground: "#2C2C2E",
  optionBackgroundPressed: "#3A3A3C",
  iconColor: "#9CA3AF",
  iconBackground: "#3A3A3C",
  handleIndicator: "#48484A",
  background: "#1C1C1E",
  destructiveText: "#FF6B6B",
};

// ============================================================================
// Component
// ============================================================================

export const ThreadMenuSheet = forwardRef<
  BottomSheetModal,
  ThreadMenuSheetProps
>(function ThreadMenuSheet(
  {
    threadName = "",
    onRename,
    onDelete,
    onClose,
    theme,
    darkMode = false,
    testID = "thread-menu-sheet",
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

  const snapPoints = useMemo(() => ["35%"], []);

  // ========================================================================
  // Callbacks
  // ========================================================================

  const handleRename = useCallback(() => {
    // Trigger inline editing in the thread list
    // @ts-expect-error - ref type issue
    ref?.current?.dismiss();
    // Call onRename with empty string to signal edit mode
    // The actual editing will happen inline in the thread list
    onRename?.("");
  }, [onRename, ref]);

  const handleDelete = useCallback(() => {
    onDelete?.();
    // @ts-expect-error - ref type issue
    ref?.current?.dismiss();
  }, [onDelete, ref]);

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
      index={0}
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
          {threadName || "Thread Options"}
        </Text>

        <View style={styles.optionsContainer}>
          <Pressable
            onPress={handleRename}
            style={({ pressed }) => [
              styles.optionItem,
              {
                backgroundColor: pressed
                  ? colors.optionBackgroundPressed
                  : colors.optionBackground,
              },
            ]}
            testID={`${testID}-option-rename`}
            accessibilityRole="button"
            accessibilityLabel="Rename conversation"
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.iconBackground },
              ]}
            >
              <Ionicons
                name="create-outline"
                size={24}
                color={colors.iconColor}
              />
            </View>
            <Text
              style={[styles.optionLabel, { color: colors.text }]}
              numberOfLines={1}
            >
              Rename
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.optionItem,
              {
                backgroundColor: pressed
                  ? colors.optionBackgroundPressed
                  : colors.optionBackground,
              },
            ]}
            testID={`${testID}-option-delete`}
            accessibilityRole="button"
            accessibilityLabel="Delete conversation"
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.iconBackground },
              ]}
            >
              <Ionicons
                name="trash-outline"
                size={24}
                color={colors.destructiveText}
              />
            </View>
            <Text
              style={[styles.optionLabel, { color: colors.destructiveText }]}
              numberOfLines={1}
            >
              Delete
            </Text>
          </Pressable>
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

export default ThreadMenuSheet;
