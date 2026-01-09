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
  color?: string;
  badge?: string;
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
    icon: "search",
    color: "#3B82F6",
    badge: "Pro",
  },
  {
    id: "agent-2",
    name: "Creative Agent",
    description: "Writing, brainstorming, and content creation",
    icon: "bulb",
    color: "#8B5CF6",
  },
  {
    id: "agent-3",
    name: "Code Agent",
    description: "Programming assistance and debugging",
    icon: "code-slash",
    color: "#10B981",
    badge: "Beta",
  },
];

const LIGHT_COLORS = {
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  optionBackground: "#FFFFFF",
  optionBackgroundPressed: "#F3F4F6",
  selectedBackground: "#EFF6FF",
  selectedBorder: "#3B82F6",
  primary: "#3B82F6",
  handleIndicator: "#D1D5DB",
  background: "#FFFFFF",
};

const DARK_COLORS = {
  text: "#F9FAFB",
  textSecondary: "#9CA3AF",
  border: "#374151",
  optionBackground: "#1F2937",
  optionBackgroundPressed: "#374151",
  selectedBackground: "#1E3A5F",
  selectedBorder: "#60A5FA",
  primary: "#60A5FA",
  handleIndicator: "#4B5563",
  background: "#111827",
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
            const agentColor = agent.color || colors.primary;

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
                    borderWidth: isSelected ? 2 : 1,
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
                    { backgroundColor: `${agentColor}20` },
                  ]}
                >
                  <Ionicons
                    name={agent.icon || "person"}
                    size={22}
                    color={agentColor}
                  />
                </View>

                <View style={styles.optionTextContainer}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                      {agent.name}
                    </Text>
                    {agent.badge && (
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: `${agentColor}20` },
                        ]}
                      >
                        <Text style={[styles.badgeText, { color: agentColor }]}>
                          {agent.badge}
                        </Text>
                      </View>
                    )}
                  </View>
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
                    name="checkmark-circle"
                    size={24}
                    color={colors.selectedBorder}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  optionsContainer: {
    gap: 12,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    gap: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  optionDescription: {
    fontSize: 13,
    marginTop: 3,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});

export default AgentPickerSheet;
