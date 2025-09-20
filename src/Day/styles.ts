import { StyleSheet } from "react-native";
import Color from "../Color";

export default StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 12,
    alignItems: "center",
    backgroundColor: Color.backgroundTransparent,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 20,
    shadowColor: Color.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  text: {
    color: Color.gray700,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  // Modern shadcn-inspired day styles
  separator: {
    height: 1,
    backgroundColor: Color.gray200,
    marginVertical: 16,
    marginHorizontal: 16,
  },
  today: {
    backgroundColor: Color.black,
  },
  todayText: {
    color: Color.white,
    fontWeight: "600",
  },
});
