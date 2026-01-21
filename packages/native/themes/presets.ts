import {
  AjoraTheme,
  lightTheme,
  darkTheme,
  createAjoraTheme,
} from "../providers/AjoraThemeProvider";

// ============================================================================
// Variant Types
// ============================================================================

/**
 * Visual style variants for chat interface
 */
export type AjoraVariant =
  | "default"
  | "minimal"
  | "bubbles"
  | "cards"
  | "compact";

/**
 * Size presets affecting spacing and typography
 */
export type AjoraSize = "sm" | "md" | "lg";

/**
 * Color scheme options
 */
export type AjoraColorScheme = "light" | "dark" | "system";

// ============================================================================
// Variant Configurations
// ============================================================================

interface VariantConfig {
  borderRadius: Partial<AjoraTheme["borderRadius"]>;
  spacing: Partial<AjoraTheme["spacing"]>;
  bubbleStyle: {
    showTail: boolean;
    maxWidth: string;
    padding: number;
  };
  inputStyle: {
    borderWidth: number;
    borderRadius: number;
  };
}

const variantConfigs: Record<AjoraVariant, VariantConfig> = {
  default: {
    borderRadius: {},
    spacing: {},
    bubbleStyle: {
      showTail: false,
      maxWidth: "85%",
      padding: 12,
    },
    inputStyle: {
      borderWidth: 1,
      borderRadius: 24,
    },
  },
  minimal: {
    borderRadius: { sm: 4, md: 6, lg: 8, xl: 10 },
    spacing: { sm: 6, md: 12, lg: 18 },
    bubbleStyle: {
      showTail: false,
      maxWidth: "90%",
      padding: 10,
    },
    inputStyle: {
      borderWidth: 0,
      borderRadius: 8,
    },
  },
  bubbles: {
    borderRadius: { sm: 12, md: 18, lg: 24, xl: 28 },
    spacing: {},
    bubbleStyle: {
      showTail: true,
      maxWidth: "80%",
      padding: 14,
    },
    inputStyle: {
      borderWidth: 1,
      borderRadius: 28,
    },
  },
  cards: {
    borderRadius: { sm: 8, md: 12, lg: 16, xl: 20 },
    spacing: { md: 20, lg: 28 },
    bubbleStyle: {
      showTail: false,
      maxWidth: "100%",
      padding: 16,
    },
    inputStyle: {
      borderWidth: 1,
      borderRadius: 12,
    },
  },
  compact: {
    borderRadius: { sm: 2, md: 4, lg: 6, xl: 8 },
    spacing: { xs: 2, sm: 4, md: 8, lg: 12 },
    bubbleStyle: {
      showTail: false,
      maxWidth: "90%",
      padding: 8,
    },
    inputStyle: {
      borderWidth: 1,
      borderRadius: 4,
    },
  },
};

// ============================================================================
// Size Configurations
// ============================================================================

interface SizeConfig {
  typography: Partial<AjoraTheme["typography"]["sizes"]>;
  spacing: Partial<AjoraTheme["spacing"]>;
  iconSize: number;
  avatarSize: number;
}

const sizeConfigs: Record<AjoraSize, SizeConfig> = {
  sm: {
    typography: { xs: 9, sm: 11, md: 13, lg: 15, xl: 18, xxl: 22 },
    spacing: { xs: 3, sm: 6, md: 12, lg: 18, xl: 24 },
    iconSize: 18,
    avatarSize: 28,
  },
  md: {
    typography: { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, xxl: 24 },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    iconSize: 22,
    avatarSize: 36,
  },
  lg: {
    typography: { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 28 },
    spacing: { xs: 6, sm: 10, md: 20, lg: 30, xl: 40 },
    iconSize: 26,
    avatarSize: 44,
  },
};

// ============================================================================
// Preset Themes
// ============================================================================

/**
 * Pre-built theme presets for common use cases
 */
export const themePresets = {
  /** Default light theme */
  light: lightTheme,

  /** Default dark theme */
  dark: darkTheme,

  /** Gemini-inspired dark theme */
  gemini: createAjoraTheme(
    {
      colors: {
        primary: "#8AB4F8",
        primaryVariant: "#4A9EFF",
        background: "#1A1A1A",
        surface: "#2D2D2D",
        text: "#E8EAED",
        textSecondary: "#9AA0A6",
        border: "#3C4043",
        userBubble: "#8AB4F8",
        userBubbleText: "#1A1A1A",
        assistantBubble: "#2D2D2D",
        assistantBubbleText: "#E8EAED",
        inputBackground: "#303134",
        placeholder: "#80868B",
        iconDefault: "#9AA0A6",
        iconActive: "#E8EAED",
      },
    },
    "dark",
  ),

  /** ChatGPT-inspired theme */
  chatgpt: createAjoraTheme(
    {
      colors: {
        primary: "#10A37F",
        primaryVariant: "#0D8A6F",
        background: "#343541",
        surface: "#444654",
        text: "#ECECF1",
        textSecondary: "#8E8EA0",
        border: "#565869",
        userBubble: "#343541",
        userBubbleText: "#ECECF1",
        assistantBubble: "#444654",
        assistantBubbleText: "#D1D5DB",
        inputBackground: "#40414F",
        placeholder: "#8E8EA0",
        iconDefault: "#8E8EA0",
        iconActive: "#ECECF1",
      },
    },
    "dark",
  ),

  /** Claude-inspired theme */
  claude: createAjoraTheme(
    {
      colors: {
        primary: "#DA7756",
        primaryVariant: "#C4654A",
        background: "#FCFAF7",
        surface: "#F6F3EE",
        text: "#1A1915",
        textSecondary: "#6B6257",
        border: "#E6E0D6",
        userBubble: "#1A1915",
        userBubbleText: "#FFFFFF",
        assistantBubble: "#F6F3EE",
        assistantBubbleText: "#1A1915",
        inputBackground: "#FFFFFF",
        placeholder: "#9B9385",
        iconDefault: "#6B6257",
        iconActive: "#1A1915",
      },
      borderRadius: { sm: 6, md: 10, lg: 14, xl: 18 },
    },
    "light",
  ),
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the style configuration for a variant
 */
export function getVariantConfig(variant: AjoraVariant): VariantConfig {
  return variantConfigs[variant] ?? variantConfigs.default;
}

/**
 * Get the size configuration
 */
export function getSizeConfig(size: AjoraSize): SizeConfig {
  return sizeConfigs[size] ?? sizeConfigs.md;
}

/**
 * Create a themed style based on variant and size
 */
export function createPresetTheme(
  variant: AjoraVariant = "default",
  size: AjoraSize = "md",
  colorScheme: AjoraColorScheme = "light",
): AjoraTheme {
  const baseTheme = colorScheme === "dark" ? darkTheme : lightTheme;
  const variantConfig = getVariantConfig(variant);
  const sizeConfig = getSizeConfig(size);

  return createAjoraTheme(
    {
      borderRadius: variantConfig.borderRadius as AjoraTheme["borderRadius"],
      spacing: {
        ...sizeConfig.spacing,
        ...variantConfig.spacing,
      } as AjoraTheme["spacing"],
      typography: {
        ...baseTheme.typography,
        sizes: {
          ...baseTheme.typography.sizes,
          ...sizeConfig.typography,
        },
      },
    },
    colorScheme === "dark" ? "dark" : "light",
  );
}
