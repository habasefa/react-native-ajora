import { colors } from "./Theme";

export default {
  // Legacy colors (keeping for backward compatibility)
  defaultColor: colors.secondaryText,
  backgroundTransparent: "transparent",
  defaultBlue: colors.appPrimary,
  leftBubbleBackground: "transparent",
  black: colors.text,
  white: colors.white,
  carrot: colors.warning,
  emerald: colors.success,
  peterRiver: colors.appPrimary,
  wisteria: colors.warning,
  alizarin: colors.error,
  turquoise: colors.success,
  midnightBlue: colors.darkGrey,
  optionTintColor: colors.appPrimary,
  timeTextColor: colors.secondaryText,

  // Modern shadcn-inspired color palette
  // Primary colors
  primary: colors.appPrimary,
  primaryForeground: colors.white,
  appPrimary: colors.appPrimary,
  appSecondary: colors.appSecondary,

  // Secondary colors
  secondary: colors.appSecondary,
  secondaryForeground: colors.text,

  // Background colors
  background: colors.background,
  foreground: colors.text,
  muted: colors.appSecondary,
  mutedForeground: colors.secondaryText,

  // Border colors
  border: colors.border,
  input: colors.border,

  // Card colors
  card: colors.white,
  cardForeground: colors.text,

  // Popover colors
  popover: colors.white,
  popoverForeground: colors.text,

  // Accent colors
  accent: colors.appSecondary,
  accentForeground: colors.text,

  // Destructive colors
  destructive: colors.error,
  destructiveForeground: colors.white,

  // Success colors
  success: colors.success,
  successForeground: colors.white,

  // Warning colors
  warning: colors.warning,
  warningForeground: colors.white,

  // Info colors
  info: colors.appPrimary,
  infoForeground: colors.white,

  // Text hierarchy colors
  text: colors.text,
  primaryText: colors.primaryText,
  secondaryText: colors.secondaryText,

  // Gray scale
  gray50: colors.background,
  gray100: colors.appSecondary,
  gray200: colors.border,
  gray300: colors.border,
  gray400: colors.secondaryText,
  gray500: colors.secondaryText,
  gray600: colors.darkGrey,
  gray700: colors.text,
  gray800: colors.primaryText,
  gray900: colors.primaryText,

  // Message bubble colors
  leftBubble: "transparent",
  rightBubble: colors.appPrimary,
  leftBubbleText: colors.text,
  rightBubbleText: colors.white,

  // Tool call colors
  toolCallBackground: colors.appSecondary,
  toolCallBorder: colors.border,
  toolCallText: colors.text,
  toolResponseBackground: colors.appSecondary,
  toolResponseBorder: colors.border,
  toolResponseText: colors.text,

  // Shadow colors
  shadow: colors.shadow,
  shadowMd: colors.shadow,
  shadowLg: colors.shadow,
};
