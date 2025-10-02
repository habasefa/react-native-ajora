// Colors
export const colors = {
  // Primary colors
  appPrimary: "#4095E5",
  appSecondary: "#F3F4F6",

  // Text colors
  text: "#1F2937",
  primaryText: "#111827",
  secondaryText: "#6B7280",

  // Background colors
  background: "#F9FAFB",
  white: "#FFFFFF",

  // Status colors
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",

  // UI colors
  border: "#E5E7EB",
  shadow: "#000000",
  darkGrey: "#4B5563",
} as const;

// Typography
export const typography = {
  getScaledFontSize: (size: number): number => {
    return size;
  },

  // Font sizes
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
  },

  // Font weights
  weights: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
  "3xl": 48,
} as const;

// Border radius
export const borderRadius = {
  sm: 8,
  base: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// Shadows
export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;
