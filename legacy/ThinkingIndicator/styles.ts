import { StyleSheet } from "react-native";
import Color from "../Color";

export default StyleSheet.create({
  container: {
    marginLeft: 12,
    width: 52,
    borderRadius: 18,
    backgroundColor: Color.backgroundTransparent,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  // Modern shadcn-inspired typing indicator styles
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  text: {
    fontSize: 12,
    color: Color.mutedForeground,
    marginLeft: 8,
    fontWeight: "400",
  },
});
