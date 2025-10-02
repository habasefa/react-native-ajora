import { StyleSheet } from "react-native";
import { colors, borderRadius, shadows } from "../Theme";

export default StyleSheet.create({
  contentContainer: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: colors.background,
  },
  // Modern shadcn-inspired container styles
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  surface: {
    backgroundColor: colors.appSecondary,
    borderRadius: borderRadius.sm,
  },
  border: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  rounded: {
    borderRadius: borderRadius.sm,
  },
  roundedLg: {
    borderRadius: borderRadius.sm,
  },
  roundedXl: {
    borderRadius: borderRadius.base,
  },
});
