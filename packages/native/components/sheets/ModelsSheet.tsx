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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ModelProvider = "openai" | "google" | "anthropic" | "xai" | "meta";
export type ModelTier = "fast" | "balanced" | "quality";

export interface ModelOption {
  id: string;
  name: string;
  provider: ModelProvider;
  description?: string;
  tier: ModelTier;
  contextWindow?: string;
  badge?: string;
  isNew?: boolean;
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
  /** Custom model options */
  models?: ModelOption[];
  /** Sheet title */
  title?: string;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Constants
// ============================================================================

const PROVIDER_INFO: Record<
  ModelProvider,
  { name: string; color: string; icon: string }
> = {
  openai: { name: "OpenAI", color: "#10A37F", icon: "robot" },
  google: { name: "Google", color: "#4285F4", icon: "google" },
  anthropic: { name: "Anthropic", color: "#D4A574", icon: "brain" },
  xai: { name: "xAI", color: "#1DA1F2", icon: "twitter" },
  meta: { name: "Meta", color: "#0668E1", icon: "facebook" },
};

const TIER_INFO: Record<
  ModelTier,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  fast: { label: "Fast", icon: "flash" },
  balanced: { label: "Balanced", icon: "options" },
  quality: { label: "Quality", icon: "diamond" },
};

export const DEFAULT_MODELS: ModelOption[] = [
  // Fast tier models
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Fast and efficient for everyday tasks",
    tier: "fast",
    contextWindow: "128K",
  },
  {
    id: "gemini-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    description: "Lightning fast responses",
    tier: "fast",
    contextWindow: "1M",
    isNew: true,
  },
  {
    id: "claude-haiku",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    description: "Quick and capable",
    tier: "fast",
    contextWindow: "200K",
  },
  {
    id: "grok-fast",
    name: "Grok Fast",
    provider: "xai",
    description: "Rapid responses with wit",
    tier: "fast",
    contextWindow: "32K",
  },

  // Balanced tier models
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Balanced performance and quality",
    tier: "balanced",
    contextWindow: "128K",
    badge: "Popular",
  },
  {
    id: "gemini-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    description: "Excellent all-around performance",
    tier: "balanced",
    contextWindow: "2M",
  },
  {
    id: "claude-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Smart and reliable",
    tier: "balanced",
    contextWindow: "200K",
  },
  {
    id: "llama-3",
    name: "Llama 3.1 70B",
    provider: "meta",
    description: "Open source excellence",
    tier: "balanced",
    contextWindow: "128K",
  },

  // Quality tier models
  {
    id: "o1",
    name: "o1",
    provider: "openai",
    description: "Advanced reasoning capabilities",
    tier: "quality",
    contextWindow: "200K",
    badge: "Reasoning",
  },
  {
    id: "gemini-ultra",
    name: "Gemini Ultra",
    provider: "google",
    description: "Most capable Google model",
    tier: "quality",
    contextWindow: "2M",
  },
  {
    id: "claude-opus",
    name: "Claude 3 Opus",
    provider: "anthropic",
    description: "Highest quality responses",
    tier: "quality",
    contextWindow: "200K",
  },
  {
    id: "grok-2",
    name: "Grok 2",
    provider: "xai",
    description: "Premium capabilities",
    tier: "quality",
    contextWindow: "128K",
    isNew: true,
  },
];

const LIGHT_COLORS = {
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  optionBackground: "#FFFFFF",
  optionBackgroundPressed: "#F3F4F6",
  selectedBackground: "#DBEAFE",
  selectedBorder: "#2563EB",
  selectedText: "#1E40AF",
  primary: "#3B82F6",
  tabActive: "#3B82F6",
  tabInactive: "#9CA3AF",
  handleIndicator: "#D1D5DB",
  background: "#FFFFFF",
};

const DARK_COLORS = {
  text: "#F9FAFB",
  textSecondary: "#9CA3AF",
  border: "#374151",
  optionBackground: "#1F2937",
  optionBackgroundPressed: "#374151",
  selectedBackground: "#1E3A8A",
  selectedBorder: "#3B82F6",
  selectedText: "#93C5FD",
  primary: "#60A5FA",
  tabActive: "#60A5FA",
  tabInactive: "#6B7280",
  handleIndicator: "#4B5563",
  background: "#111827",
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
      models = DEFAULT_MODELS,
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
            const providerInfo = PROVIDER_INFO[model.provider];

            return (
              <Pressable
                key={model.id}
                onPress={() => handleSelect(model)}
                style={({ pressed }) => [
                  styles.modelItem,
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
                  isSelected && styles.modelItemSelected,
                ]}
                testID={`${testID}-model-${model.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${model.name} by ${providerInfo.name}`}
                accessibilityHint={model.description}
                accessibilityState={{ selected: isSelected }}
              >
                {/* Left accent bar for selected state */}
                {isSelected && (
                  <View
                    style={[
                      styles.selectedAccent,
                      { backgroundColor: colors.selectedBorder },
                    ]}
                  />
                )}

                <View
                  style={[
                    styles.providerIcon,
                    {
                      backgroundColor: isSelected
                        ? `${providerInfo.color}35`
                        : `${providerInfo.color}20`,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      providerInfo.icon as keyof typeof MaterialCommunityIcons.glyphMap
                    }
                    size={20}
                    color={providerInfo.color}
                  />
                </View>

                <View style={styles.modelInfo}>
                  <View style={styles.modelNameRow}>
                    <Text
                      style={[
                        styles.modelName,
                        {
                          color: isSelected ? colors.selectedText : colors.text,
                        },
                        isSelected && styles.modelNameSelected,
                      ]}
                    >
                      {model.name}
                    </Text>
                    {model.isNew && (
                      <View style={[styles.newBadge]}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                      </View>
                    )}
                    {model.badge && (
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: `${providerInfo.color}20` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: providerInfo.color },
                          ]}
                        >
                          {model.badge}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.modelDescription,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {model.description}
                  </Text>

                  <View style={styles.modelMeta}>
                    <Text
                      style={[
                        styles.providerName,
                        { color: providerInfo.color },
                      ]}
                    >
                      {providerInfo.name}
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
                          {model.contextWindow} context
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {isSelected && (
                  <View style={styles.checkmarkContainer}>
                    <Ionicons
                      name="checkmark-circle"
                      size={28}
                      color={colors.selectedBorder}
                    />
                  </View>
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
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 10,
  },
  modelItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    gap: 12,
    overflow: "hidden",
  },
  modelItemSelected: {
    ...Platform.select({
      ios: {
        shadowColor: "#3B82F6",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  selectedAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  providerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modelInfo: {
    flex: 1,
  },
  modelNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  modelName: {
    fontSize: 15,
    fontWeight: "600",
  },
  modelNameSelected: {
    fontWeight: "700",
  },
  checkmarkContainer: {
    marginLeft: 4,
  },
  modelDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  modelMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  providerName: {
    fontSize: 12,
    fontWeight: "500",
  },
  metaDot: {
    fontSize: 12,
  },
  contextWindow: {
    fontSize: 12,
  },
  newBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
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

export default ModelsSheet;
