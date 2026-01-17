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
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ModelProvider = string;
export type ModelTier = "fast" | "balanced" | "quality";

export interface ModelOption {
  id: string;
  name: string;
  provider?: ModelProvider;
  description?: string;
  tier?: ModelTier;
  contextWindow?: string;
  /** Whether this model is disabled (not selectable) */
  isDisabled?: boolean;
  /** Whether this model is new (shows "New" badge) */
  isNew?: boolean;
  /** Any additional data for the model */
  extraData?: any;
}

export interface ModelsSheetTheme {
  container?: StyleProp<ViewStyle>;
  handleIndicator?: string;
  background?: string;
  colors?: {
    text?: string;
    textSecondary?: string;
    border?: string;
    optionBackground?: string;
    optionBackgroundPressed?: string;
    selectedBackground?: string;
    selectedBorder?: string;
    primary?: string;
    tabActive?: string;
    tabInactive?: string;
    disabledBackground?: string;
    disabledText?: string;
    newBadgeBackground?: string;
    newBadgeText?: string;
  };
}

export interface ModelsSheetProps {
  /** Currently selected model ID */
  selectedModelId?: string;
  /** Callback when a model is selected */
  onSelect?: (model: ModelOption) => void;
  /** Callback when the sheet is closed */
  onClose?: () => void;
  /** Custom theme overrides */
  theme?: ModelsSheetTheme;
  /** Whether to use dark mode */
  darkMode?: boolean;
  /** Model options - if not provided, nothing is shown */
  models?: ModelOption[];
  /** Sheet title */
  title?: string;
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
  optionBackground: "#FFFFFF",
  optionBackgroundPressed: "#F5F5F5",
  selectedBackground: "#F5F5F5",
  selectedBorder: "#1F2937",
  selectedText: "#1F2937",
  primary: "#1F2937",
  handleIndicator: "#D1D5DB",
  background: "#FFFFFF",
  disabledBackground: "#F3F4F6",
  disabledText: "#9CA3AF",
  newBadgeBackground: "#10B981",
  newBadgeText: "#FFFFFF",
};

const DARK_COLORS = {
  text: "#F9FAFB",
  textSecondary: "#8E8E93",
  border: "#2C2C2E",
  optionBackground: "#1C1C1E",
  optionBackgroundPressed: "#2C2C2E",
  selectedBackground: "#2C2C2E",
  selectedBorder: "#F9FAFB",
  selectedText: "#F9FAFB",
  primary: "#F9FAFB",
  handleIndicator: "#48484A",
  background: "#1C1C1E",
  disabledBackground: "#2C2C2E",
  disabledText: "#6B7280",
  newBadgeBackground: "#10B981",
  newBadgeText: "#FFFFFF",
};

// ============================================================================
// Component
// ============================================================================

export const ModelsSheet = forwardRef<BottomSheetModal, ModelsSheetProps>(
  function ModelsSheet(
    {
      selectedModelId,
      onSelect,
      onClose,
      theme,
      darkMode = false,
      models,
      title = "Select Model",
      testID = "models-sheet",
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

    const snapPoints = useMemo(() => ["65%", "90%"], []);

    // ========================================================================
    // Callbacks
    // ========================================================================

    const handleSelect = useCallback(
      (model: ModelOption) => {
        if (model.isDisabled) return;
        onSelect?.(model);
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

    // If no models provided, render empty sheet
    if (!models || models.length === 0) {
      return (
        <BottomSheetModal
          ref={ref}
          snapPoints={["30%"]}
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
          <View style={styles.emptyContainer}>
            <Ionicons
              name="cloud-offline-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No models available
            </Text>
          </View>
        </BottomSheetModal>
      );
    }

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
        <View
          style={[styles.headerContainer, theme?.container]}
          testID={testID}
        >
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>

        <BottomSheetScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {models.map((model) => {
            const isSelected = model.id === selectedModelId;
            const isDisabled = model.isDisabled === true;

            return (
              <Pressable
                key={model.id}
                onPress={() => handleSelect(model)}
                disabled={isDisabled}
                style={({ pressed }) => [
                  styles.modelItem,
                  {
                    backgroundColor: isDisabled
                      ? colors.disabledBackground
                      : isSelected
                        ? colors.selectedBackground
                        : pressed
                          ? colors.optionBackgroundPressed
                          : colors.optionBackground,
                    borderColor: isSelected
                      ? colors.selectedBorder
                      : colors.border,
                    opacity: isDisabled ? 0.6 : 1,
                  },
                ]}
                testID={`${testID}-model-${model.id}`}
                accessibilityRole="button"
                accessibilityLabel={model.name}
                accessibilityHint={model.description}
                accessibilityState={{
                  selected: isSelected,
                  disabled: isDisabled,
                }}
              >
                <View style={styles.modelInfo}>
                  <View style={styles.modelNameRow}>
                    <Text
                      style={[
                        styles.modelName,
                        {
                          color: isDisabled
                            ? colors.disabledText
                            : isSelected
                              ? colors.selectedText
                              : colors.text,
                        },
                        isSelected && styles.modelNameSelected,
                      ]}
                    >
                      {model.name}
                    </Text>

                    {/* New Badge */}
                    {model.isNew && (
                      <View
                        style={[
                          styles.newBadge,
                          { backgroundColor: colors.newBadgeBackground },
                        ]}
                      >
                        <Text
                          style={[
                            styles.newBadgeText,
                            { color: colors.newBadgeText },
                          ]}
                        >
                          New
                        </Text>
                      </View>
                    )}
                  </View>

                  {model.description && (
                    <Text
                      style={[
                        styles.modelDescription,
                        {
                          color: isDisabled
                            ? colors.disabledText
                            : colors.textSecondary,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {model.description}
                    </Text>
                  )}

                  {model.provider && (
                    <View style={styles.modelMeta}>
                      <Text
                        style={[
                          styles.providerName,
                          {
                            color: isDisabled
                              ? colors.disabledText
                              : colors.textSecondary,
                          },
                        ]}
                      >
                        {model.provider}
                      </Text>
                      {model.contextWindow && (
                        <>
                          <Text
                            style={[
                              styles.metaDot,
                              { color: colors.textSecondary },
                            ]}
                          >
                            •
                          </Text>
                          <Text
                            style={[
                              styles.contextWindow,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {model.contextWindow}
                          </Text>
                        </>
                      )}
                    </View>
                  )}
                </View>

                {isSelected && !isDisabled && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.selectedText}
                  />
                )}

                {isDisabled && (
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={colors.disabledText}
                  />
                )}
              </Pressable>
            );
          })}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

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
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 8,
  },
  modelItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  modelInfo: {
    flex: 1,
  },
  modelNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modelName: {
    fontSize: 16,
    fontWeight: "500",
  },
  modelNameSelected: {
    fontWeight: "600",
  },
  modelDescription: {
    fontSize: 14,
    marginTop: 3,
  },
  modelMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  providerName: {
    fontSize: 13,
  },
  metaDot: {
    fontSize: 13,
  },
  contextWindow: {
    fontSize: 13,
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});

export default ModelsSheet;
