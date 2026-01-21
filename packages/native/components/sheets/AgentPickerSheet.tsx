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

export interface AgentOption {
  id: string;
  name: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Whether this agent is disabled (not selectable) */
  isDisabled?: boolean;
  /** Badge (e.g. "New" badge) */
  badge?: string;
  /** Any additional data for the agent */
  extraData?: any;
}

export interface AgentPickerSheetIcons {
  back?: React.ReactNode;
  close?: React.ReactNode;
  check?: React.ReactNode;
  lock?: React.ReactNode;
  empty?: React.ReactNode;
}

export interface AgentPickerSheetProps {
  /** Currently selected agent ID */
  selectedAgentId?: string;
  /** Callback when an agent is selected */
  onSelect?: (agent: AgentOption) => void;
  /** Callback when the sheet is closed */
  onClose?: () => void;
  /** Agent options - if not provided, nothing is shown */
  agents?: AgentOption[];
  /** Sheet title */
  title?: string;
  /** Sheet description */
  description?: string;
  /** Test ID for testing */
  testID?: string;

  /** Custom icons */
  icons?: AgentPickerSheetIcons;

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
  /** Custom render function for each agent item */
  renderItem?: (props: {
    item: AgentOption;
    isSelected: boolean;
    isDisabled: boolean;
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
    selectedBackground?: string;
    selectedBorder?: string;
    selectedText?: string;
    iconColor?: string;
    iconBackground?: string;
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

export const AgentPickerSheet = forwardRef<
  BottomSheetModal,
  AgentPickerSheetProps
>(function AgentPickerSheet(
  {
    selectedAgentId,
    onSelect,
    onClose,
    agents,
    title = "Select Agent",
    testID = "agent-picker-sheet",
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
        colorOverrides?.optionBackgroundPressed ?? theme.colors.itemSelected,
      selectedBackground:
        colorOverrides?.selectedBackground ?? theme.colors.itemSelected,
      selectedBorder: colorOverrides?.selectedBorder ?? theme.colors.border,
      selectedText: colorOverrides?.selectedText ?? theme.colors.text,
      iconColor: colorOverrides?.iconColor ?? theme.colors.iconDefault,
      iconBackground: colorOverrides?.iconBackground ?? theme.colors.border,
      handleIndicator: colorOverrides?.handleIndicator ?? theme.colors.border,
      background: colorOverrides?.background ?? theme.colors.surface,
      disabledBackground:
        colorOverrides?.disabledBackground ?? theme.colors.surface,
      disabledText: colorOverrides?.disabledText ?? theme.colors.textSecondary,
      badgeBackground: colorOverrides?.badgeBackground ?? theme.colors.primary,
      badgeText:
        colorOverrides?.badgeText ??
        (theme.name === "dark"
          ? theme.colors.background
          : theme.colors.background),
    }),
    [theme, colorOverrides],
  );

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

  const defaultRenderItem = (agent: AgentOption) => {
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
            borderColor: isSelected ? colors.selectedBorder : "transparent",
            opacity: isDisabled ? 0.6 : 1,
          },
          itemStyle,
          isSelected && activeItemStyle,
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
                itemTextStyle,
                isSelected && activeItemTextStyle,
              ]}
            >
              {agent.name}
            </Text>

            {/* Badge */}
            {agent.badge && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.badgeBackground },
                ]}
              >
                <Text style={[styles.badgeText, { color: colors.badgeText }]}>
                  {agent.badge}
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

        {isSelected &&
          !isDisabled &&
          (customIcons?.check ?? (
            <Ionicons name="checkmark" size={20} color={colors.text} />
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
          sheetContentStyle,
        ]}
      >
        <View style={styles.emptyContainer}>
          {customIcons?.empty ?? (
            <Ionicons
              name="people-outline"
              size={48}
              color={colors.textSecondary}
            />
          )}
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
        {agents.map((agent) => {
          if (renderItem) {
            return renderItem({
              item: agent,
              isSelected: agent.id === selectedAgentId,
              isDisabled: !!agent.isDisabled,
              onPress: () => handleSelect(agent),
              theme: { colors },
            });
          }
          return defaultRenderItem(agent);
        })}
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
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
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
  optionsContainer: {
    gap: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
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

export default AgentPickerSheet;
