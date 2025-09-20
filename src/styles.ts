import { StyleSheet } from "react-native";
import Color from "./Color";

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
  shadow: {
    shadowColor: Color.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  shadowMd: {
    shadowColor: Color.shadowMd,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
});
