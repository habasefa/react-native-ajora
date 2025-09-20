import { StyleSheet } from "react-native";
import Color from "../Color";

export default StyleSheet.create({
  contentContainer: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: Color.background,
  },
  // Modern shadcn-inspired container styles
  container: {
    backgroundColor: Color.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Color.border,
    shadowColor: Color.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  surface: {
    backgroundColor: Color.muted,
    borderRadius: 6,
  },
  border: {
    borderWidth: 1,
    borderColor: Color.border,
  },
  rounded: {
    borderRadius: 6,
  },
  roundedLg: {
    borderRadius: 8,
  },
  roundedXl: {
    borderRadius: 12,
  },
});
