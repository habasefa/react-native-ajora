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

export type ModelProvider = "openai" | "google" | "anthropic" | "xai" | "meta";
export type ModelTier = "fast" | "balanced" | "quality";

export interface ModelOption {
  id: string;
  name: string;
  provider: ModelProvider;
  description?: string;
  tier: ModelTier;
  contextWindow?: string;
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

const PROVIDER_INFO: Record<ModelProvider, { name: string }> = {
  openai: { name: "OpenAI" },
  google: { name: "Google" },
  anthropic: { name: "Anthropic" },
  xai: { name: "xAI" },
  meta: { name: "Meta" },
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
  selectedText: "#1F2937",
  primary: "#1F2937",
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
  selectedText: "#F9FAFB",
  primary: "#F9FAFB",
  handleIndicator: "#48484A",
  background: "#1C1C1E",
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
                  },
                ]}
                testID={`${testID}-model-${model.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${model.name} by ${providerInfo.name}`}
                accessibilityHint={model.description}
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.modelInfo}>
                  <Text
                    style={[
                      styles.modelName,
                      { color: isSelected ? colors.selectedText : colors.text },
                      isSelected && styles.modelNameSelected,
                    ]}
                  >
                    {model.name}
                  </Text>

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
                        { color: colors.textSecondary },
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
                          {model.contextWindow}
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {isSelected && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.selectedText}
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
});

export default ModelsSheet;
