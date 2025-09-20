import { StyleSheet } from "react-native";
import Color from "../../../Color";

export default StyleSheet.create({
  dayAnimated: {
    position: "absolute",
    width: "100%",
    zIndex: 10,
  },
  dayAnimatedDayContainerStyle: {
    marginTop: 0,
    marginBottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: Color.gray200,
  },
  // Modern shadcn-inspired animated day styles
  animatedContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Color.card,
    borderBottomWidth: 1,
    borderBottomColor: Color.gray200,
    shadowColor: Color.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stickyDay: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
});
