import { StyleSheet } from "react-native";
import Color from "../Color";

export default StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingHorizontal: 10,
    backgroundColor: Color.white,
    borderBottomWidth: 1,
    borderBottomColor: Color.gray200,
    shadowColor: Color.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Color.backgroundTransparent,
  },
  plusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Color.backgroundTransparent,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Color.black,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  icon: {
    fontSize: 18,
    fontWeight: "600",
    color: Color.gray700,
  },
  plusIcon: {
    fontSize: 18,
    fontWeight: "600",
    color: Color.gray700,
  },
});
