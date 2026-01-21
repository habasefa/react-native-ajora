import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { Platform, ShadowStyleIOS } from "react-native";

// ============================================================================
// Theme Types
// ============================================================================

/**
 * Shadow style compatible with React Native
 */
export interface AjoraShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

/**
 * Complete color palette for Ajora components
 */
export interface AjoraColors {
  /** Primary brand color */
  primary: string;
  /** Primary color variant (darker/lighter) */
  primaryVariant: string;
  /** Background color for screens */
  background: string;
  /** Surface color for cards/containers */
  surface: string;
  /** Primary text color */
  text: string;
  /** Secondary/muted text color */
  textSecondary: string;
  /** Border color */
  border: string;
  /** Error color */
  error: string;
  /** Success color */
  success: string;
  /** Warning color */
  warning: string;
  /** User message bubble background */
  userBubble: string;
  /** User message bubble text */
  userBubbleText: string;
  /** Assistant message bubble background */
  assistantBubble: string;
  /** Assistant message bubble text */
  assistantBubbleText: string;
  /** Input background */
  inputBackground: string;
  /** Placeholder text */
  placeholder: string;
  /** Icon default color */
  iconDefault: string;
  /** Icon active/highlighted color */
  iconActive: string;
  /** Selected item background (menus, lists) */
  itemSelected: string;
  /** Selected item text */
  itemSelectedText: string;
}

/**
 * Typography configuration
 */
export interface AjoraTypography {
  /** Font family for regular weight */
  regular: string;
  /** Font family for medium weight */
  medium: string;
  /** Font family for bold weight */
  bold: string;
  /** Font sizes */
  sizes: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  /** Line heights */
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

/**
 * Spacing scale
 */
export interface AjoraSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

/**
 * Border radius scale
 */
export interface AjoraBorderRadius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

/**
 * Shadow presets
 */
export interface AjoraShadows {
  none: AjoraShadow;
  sm: AjoraShadow;
  md: AjoraShadow;
  lg: AjoraShadow;
}

/**
 * Complete Ajora theme configuration
 */
export interface AjoraTheme {
  /** Color scheme name */
  name: "light" | "dark" | "custom";
  /** Color palette */
  colors: AjoraColors;
  /** Typography settings */
  typography: AjoraTypography;
  /** Spacing scale */
  spacing: AjoraSpacing;
  /** Border radius scale */
  borderRadius: AjoraBorderRadius;
  /** Shadow presets */
  shadows: AjoraShadows;
}

/**
 * Deep partial type utility for nested partial objects
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Partial theme type for customization
 */
export type AjoraThemeCustomization = DeepPartial<Omit<AjoraTheme, "name">> & {
  name?: AjoraTheme["name"];
};

// ============================================================================
// Default Themes
// ============================================================================

const defaultSpacing: AjoraSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const defaultBorderRadius: AjoraBorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

const defaultTypography: AjoraTypography = {
  regular: Platform.select({ ios: "System", android: "Roboto" }) ?? "System",
  medium:
    Platform.select({ ios: "System", android: "Roboto-Medium" }) ?? "System",
  bold: Platform.select({ ios: "System", android: "Roboto-Bold" }) ?? "System",
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

const defaultShadows: AjoraShadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

/**
 * Default light theme
 */
export const lightTheme: AjoraTheme = {
  name: "light",
  colors: {
    primary: "#18181B", // zinc-950
    primaryVariant: "#27272A", // zinc-800
    background: "#FFFFFF",
    surface: "#FFFFFF",
    text: "#09090B", // zinc-950
    textSecondary: "#71717A", // zinc-500
    border: "#E4E4E7", // zinc-200
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
    userBubble: "#3F3F46", // zinc-700 (Distinct dark gray, not black)
    userBubbleText: "#FAFAFA", // zinc-50
    assistantBubble: "#F4F4F5", // zinc-100
    assistantBubbleText: "#09090B", // zinc-950
    inputBackground: "#FFFFFF",
    placeholder: "#A1A1AA", // zinc-400
    iconDefault: "#71717A", // zinc-500
    iconActive: "#18181B", // zinc-950
    itemSelected: "#F4F4F5", // zinc-100
    itemSelectedText: "#18181B", // zinc-950
  },
  typography: defaultTypography,
  spacing: defaultSpacing,
  borderRadius: defaultBorderRadius,
  shadows: defaultShadows,
};

/**
 * Default dark theme
 */
export const darkTheme: AjoraTheme = {
  name: "dark",
  colors: {
    primary: "#FAFAFA", // zinc-50
    primaryVariant: "#F4F4F5", // zinc-100
    background: "#09090B", // zinc-950
    surface: "#09090B", // zinc-950
    text: "#FAFAFA", // zinc-50
    textSecondary: "#A1A1AA", // zinc-400
    border: "#27272A", // zinc-800
    error: "#F87171",
    success: "#34D399",
    warning: "#FBBF24",
    userBubble: "#3F3F46", // zinc-700 (Distinct lighter gray)
    userBubbleText: "#FAFAFA", // zinc-50
    assistantBubble: "#27272A", // zinc-800 (Darker gray)
    assistantBubbleText: "#FAFAFA", // zinc-50
    inputBackground: "#09090B",
    placeholder: "#71717A", // zinc-500
    iconDefault: "#A1A1AA", // zinc-400
    iconActive: "#FAFAFA", // zinc-50
    itemSelected: "#27272A", // zinc-800
    itemSelectedText: "#FAFAFA", // zinc-50
  },
  typography: defaultTypography,
  spacing: defaultSpacing,
  borderRadius: defaultBorderRadius,
  shadows: defaultShadows,
};

// ============================================================================
// Theme Context
// ============================================================================

const AjoraThemeContext = createContext<AjoraTheme | null>(null);

export interface AjoraThemeProviderProps {
  children: ReactNode;
  /** Custom theme to use */
  theme?: AjoraThemeCustomization;
  /** Use dark mode (default: false) */
  darkMode?: boolean;
}

/**
 * Deep merge utility for theme objects
 */
function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === "object" &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === "object" &&
        target[key] !== null
      ) {
        result[key] = deepMerge(target[key], source[key] as any);
      } else {
        result[key] = source[key] as any;
      }
    }
  }

  return result;
}

/**
 * Theme provider component
 * Wraps your app to provide theming to all Ajora components
 *
 * @example
 * ```tsx
 * <AjoraThemeProvider darkMode>
 *   <AjoraChat ... />
 * </AjoraThemeProvider>
 *
 * // With custom theme
 * <AjoraThemeProvider theme={{ colors: { primary: '#FF5722' } }}>
 *   <AjoraChat ... />
 * </AjoraThemeProvider>
 * ```
 */
export function AjoraThemeProvider({
  children,
  theme,
  darkMode = false,
}: AjoraThemeProviderProps) {
  const baseTheme = darkMode ? darkTheme : lightTheme;

  const mergedTheme = useMemo(() => {
    if (!theme) return baseTheme;
    return deepMerge(baseTheme, theme as Partial<AjoraTheme>);
  }, [baseTheme, theme]);

  return (
    <AjoraThemeContext.Provider value={mergedTheme}>
      {children}
    </AjoraThemeContext.Provider>
  );
}

/**
 * Hook to access the current theme
 * Returns the default light theme if no provider is found
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const theme = useAjoraTheme();
 *   return <View style={{ backgroundColor: theme.colors.background }} />;
 * }
 * ```
 */
export function useAjoraTheme(): AjoraTheme {
  const theme = useContext(AjoraThemeContext);
  return theme ?? lightTheme;
}

/**
 * Hook to access theme colors only
 * Convenience hook for simpler color access
 */
export function useAjoraColors(): AjoraColors {
  const theme = useAjoraTheme();
  return theme.colors;
}

/**
 * Hook to access theme spacing only
 */
export function useAjoraSpacing(): AjoraSpacing {
  const theme = useAjoraTheme();
  return theme.spacing;
}

/**
 * Utility to create a custom theme by extending the base themes
 */
export function createAjoraTheme(
  customizations: AjoraThemeCustomization,
  baseTheme: "light" | "dark" = "light",
): AjoraTheme {
  const base = baseTheme === "dark" ? darkTheme : lightTheme;
  return deepMerge(base, customizations as Partial<AjoraTheme>);
}
