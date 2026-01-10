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
  /** Custom agent options */
  agents?: AgentOption[];
  /** Sheet title */
  title?: string;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_AGENTS: AgentOption[] = [
  {
    id: "agent-1",
    name: "Research Agent",
    description: "Deep research and analysis capabilities",
    icon: "search-outline",
  },
  {
    id: "agent-2",
    name: "Creative Agent",
    description: "Writing, brainstorming, and content creation",
    icon: "bulb-outline",
  },
  {
    id: "agent-3",
    name: "Code Agent",
    description: "Programming assistance and debugging",
    icon: "code-slash-outline",
  },
];

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
    agents = DEFAULT_AGENTS,
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

            return (
              <Pressable
                key={agent.id}
                onPress={() => handleSelect(agent)}
                style={({ pressed }) => [
                  styles.optionItem,
                  {
                    backgroundColor: isSelected
                      ? colors.selectedBackground
                      : pressed
                        ? colors.optionBackgroundPressed
                        : colors.optionBackground,
                    borderColor: isSelected
                      ? colors.selectedBorder
                      : colors.border,
                  },
                ]}
                testID={`${testID}-option-${agent.id}`}
                accessibilityRole="button"
                accessibilityLabel={agent.name}
                accessibilityHint={agent.description}
                accessibilityState={{ selected: isSelected }}
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
                    color={colors.iconColor}
                  />
                </View>

                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: colors.text },
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {agent.name}
                  </Text>
                  {agent.description && (
                    <Text
                      style={[
                        styles.optionDescription,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {agent.description}
                    </Text>
                  )}
                </View>

                {isSelected && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.text}
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
});

export default AgentPickerSheet;
