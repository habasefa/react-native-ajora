import { StyleSheet } from "react-native";
import { colors, borderRadius, shadows } from "./Theme";

export default StyleSheet.create({
  fill: {
    flex: 1,
  },
  centerItems: {
    justifyContent: "center",
    alignItems: "center",
  },
  // Modern shadcn-inspired utility styles
  card: {
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
  shadow: {
    ...shadows.sm,
  },
  shadowMd: {
    ...shadows.base,
  },
});
