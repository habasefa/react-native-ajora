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

export interface AgentOption {
  id: string;
  name: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Whether this agent is disabled (not selectable) */
  isDisabled?: boolean;
  /** Whether this agent is new (shows "New" badge) */
  isNew?: boolean;
  /** Any additional data for the agent */
  extraData?: any;
}

export interface AgentPickerSheetTheme {
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
    disabledBackground?: string;
    disabledText?: string;
    newBadgeBackground?: string;
    newBadgeText?: string;
  };
}

export interface AgentPickerSheetProps {
  /** Currently selected agent ID */
  selectedAgentId?: string;
  /** Callback when an agent is selected */
  onSelect?: (agent: AgentOption) => void;
  /** Callback when the sheet is closed */
  onClose?: () => void;
  /** Custom theme overrides */
  theme?: AgentPickerSheetTheme;
  /** Whether to use dark mode */
  darkMode?: boolean;
  /** Agent options - if not provided, nothing is shown */
  agents?: AgentOption[];
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
  iconColor: "#6B7280",
  iconBackground: "#F5F5F5",
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
  iconColor: "#9CA3AF",
  iconBackground: "#2C2C2E",
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

export const AgentPickerSheet = forwardRef<
  BottomSheetModal,
  AgentPickerSheetProps
>(function AgentPickerSheet(
  {
    selectedAgentId,
    onSelect,
    onClose,
    theme,
    darkMode = false,
    agents,
    title = "Select Agent",
    testID = "agent-picker-sheet",
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

  const snapPoints = useMemo(() => ["50%", "75%"], []);

  // ========================================================================
  // Callbacks
  // ========================================================================

  const handleSelect = useCallback(
    (agent: AgentOption) => {
      if (agent.isDisabled) return;
      onSelect?.(agent);
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

  // If no agents provided, render empty sheet
  if (!agents || agents.length === 0) {
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
            name="people-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No agents available
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
      <BottomSheetScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, theme?.container]}
      >
        <Text style={[styles.title, { color: colors.text }]} testID={testID}>
          {title}
        </Text>

        <View style={styles.optionsContainer}>
          {agents.map((agent) => {
            const isSelected = agent.id === selectedAgentId;
            const isDisabled = agent.isDisabled === true;

            return (
              <Pressable
                key={agent.id}
                onPress={() => handleSelect(agent)}
                disabled={isDisabled}
                style={({ pressed }) => [
                  styles.optionItem,
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
                testID={`${testID}-option-${agent.id}`}
                accessibilityRole="button"
                accessibilityLabel={agent.name}
                accessibilityHint={agent.description}
                accessibilityState={{
                  selected: isSelected,
                  disabled: isDisabled,
                }}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: colors.iconBackground },
                  ]}
                >
                  <Ionicons
                    name={agent.icon || "person-outline"}
                    size={20}
                    color={isDisabled ? colors.disabledText : colors.iconColor}
                  />
                </View>

                <View style={styles.optionTextContainer}>
                  <View style={styles.optionLabelRow}>
                    <Text
                      style={[
                        styles.optionLabel,
                        {
                          color: isDisabled ? colors.disabledText : colors.text,
                        },
                        isSelected && styles.optionLabelSelected,
                      ]}
                    >
                      {agent.name}
                    </Text>

                    {/* New Badge */}
                    {agent.isNew && (
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

                  {agent.description && (
                    <Text
                      style={[
                        styles.optionDescription,
                        {
                          color: isDisabled
                            ? colors.disabledText
                            : colors.textSecondary,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {agent.description}
                    </Text>
                  )}
                </View>

                {isSelected && !isDisabled && (
                  <Ionicons name="checkmark" size={20} color={colors.text} />
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
        </View>
      </BottomSheetScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  optionsContainer: {
    gap: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionLabelSelected: {
    fontWeight: "600",
  },
  optionDescription: {
    fontSize: 14,
    marginTop: 3,
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

export default AgentPickerSheet;
