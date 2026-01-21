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
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ModelOption {
  id: string;
  name: string;
  provider?: string;
  description?: string;
  tier?: string;
  contextWindow?: string;
  /** Whether this model is disabled (not selectable) */
  isDisabled?: boolean;
  /** Badge (e.g. "New" badge) */
  badge?: string;
  /** Any additional data for the model */
  extraData?: any;
}

export interface ModelsSheetIcons {
  back?: React.ReactNode;
  close?: React.ReactNode;
  check?: React.ReactNode;
  lock?: React.ReactNode;
  empty?: React.ReactNode;
}

export interface ModelsSheetProps {
  /** Currently selected model ID */
  selectedModelId?: string;
  /** Callback when a model is selected */
  onSelect?: (model: ModelOption) => void;
  /** Callback when the sheet is closed */
  onClose?: () => void;
  /** Model options - if not provided, nothing is shown */
  models?: ModelOption[];
  /** Sheet title */
  title?: string;

  /** Sheet description */
  description?: string;

  /** Test ID for testing */
  testID?: string;

  /** Custom icons */
  icons?: ModelsSheetIcons;

  // --- Style Overrides ---
  /** Style for the sheet container (top-level) */
  containerStyle?: StyleProp<ViewStyle>;
  /** Style for the sheet content background */
  sheetContentStyle?: StyleProp<ViewStyle>;
  /** Style for the sheet header */
  sheetHeaderStyle?: StyleProp<ViewStyle>;
  /** Style for the sheet title text */
  sheetTitleStyle?: StyleProp<TextStyle>;
  /** Style for the scroll view content container */
  listContentStyle?: StyleProp<ViewStyle>;

  /** Style for each item container */
  itemStyle?: StyleProp<ViewStyle>;
  /** Style for item text (name) */
  itemTextStyle?: StyleProp<TextStyle>;
  /** Style for active/selected item container */
  activeItemStyle?: StyleProp<ViewStyle>;
  /** Style for active/selected item text */
  activeItemTextStyle?: StyleProp<TextStyle>;

  // --- Component Overrides ---
  /** Custom render function for each model item */
  renderItem?: (props: {
    item: ModelOption;
    isSelected: boolean;
    isDisabled: boolean;
    onPress: () => void;
    theme: any; // Using explicit theme typing if preferred
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
    selectedBackground?: string;
    selectedBorder?: string;
    selectedText?: string;
    iconColor?: string;
    handleIndicator?: string;
    background?: string;
    disabledBackground?: string;
    disabledText?: string;
    badgeBackground?: string;
    badgeText?: string;
  };
}

// ============================================================================
// Component
// ============================================================================

export const ModelsSheet = forwardRef<BottomSheetModal, ModelsSheetProps>(
  function ModelsSheet(
    {
      selectedModelId,
      onSelect,
      onClose,
      models,
      title = "Select Model",
      testID = "models-sheet",
      icons: customIcons,
      containerStyle,
      sheetContentStyle,
      sheetHeaderStyle,
      sheetTitleStyle,
      listContentStyle,
      itemStyle,
      itemTextStyle,
      activeItemStyle,
      activeItemTextStyle,
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
          colorOverrides?.optionBackgroundPressed ??
          theme.colors.assistantBubble,
        selectedBackground:
          colorOverrides?.selectedBackground ?? theme.colors.assistantBubble,
        selectedBorder: colorOverrides?.selectedBorder ?? theme.colors.border,
        selectedText: colorOverrides?.selectedText ?? theme.colors.text,
        handleIndicator: colorOverrides?.handleIndicator ?? theme.colors.border,
        background: colorOverrides?.background ?? theme.colors.surface,
        disabledBackground:
          colorOverrides?.disabledBackground ?? theme.colors.surface,
        disabledText:
          colorOverrides?.disabledText ?? theme.colors.textSecondary,
        badgeBackground:
          colorOverrides?.badgeBackground ?? theme.colors.primary,
        badgeText:
          colorOverrides?.badgeText ??
          (theme.name === "dark"
            ? theme.colors.background
            : theme.colors.background),
      }),
      [theme, colorOverrides],
    );

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
      <View style={[styles.headerContainer, sheetHeaderStyle]} testID={testID}>
        <Text style={[styles.title, { color: colors.text }, sheetTitleStyle]}>
          {title}
        </Text>
      </View>
    );

    const defaultRenderItem = (model: ModelOption) => {
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
              borderColor: isSelected ? colors.selectedBorder : "transparent", // Cleaner look for default state
              opacity: isDisabled ? 0.6 : 1,
            },
            itemStyle,
            isSelected && activeItemStyle,
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
                  itemTextStyle,
                  isSelected && activeItemTextStyle,
                ]}
              >
                {model.name}
              </Text>

              {/* Badge */}
              {model.badge && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.badgeBackground },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: colors.badgeText }]}>
                    {model.badge}
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
                      style={[styles.metaDot, { color: colors.textSecondary }]}
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

          {isSelected &&
            !isDisabled &&
            (customIcons?.check ?? (
              <Ionicons
                name="checkmark"
                size={20}
                color={colors.selectedText}
              />
            ))}

          {isDisabled &&
            (customIcons?.lock ?? (
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={colors.disabledText}
              />
            ))}
        </Pressable>
      );
    };

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
            sheetContentStyle,
          ]}
        >
          <View style={styles.emptyContainer}>
            {customIcons?.empty ?? (
              <Ionicons
                name="cloud-offline-outline"
                size={48}
                color={colors.textSecondary}
              />
            )}
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
          sheetContentStyle,
        ]}
        style={containerStyle}
      >
        {renderHeader
          ? renderHeader({ title, onClose: handleDismiss })
          : defaultRenderHeader()}

        <BottomSheetScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, listContentStyle]}
        >
          {models.map((model) => {
            if (renderItem) {
              return renderItem({
                item: model,
                isSelected: model.id === selectedModelId,
                isDisabled: !!model.isDisabled,
                onPress: () => handleSelect(model),
                theme: { colors },
              });
            }
            return defaultRenderItem(model);
          })}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
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
    borderColor: "transparent",
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
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
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
