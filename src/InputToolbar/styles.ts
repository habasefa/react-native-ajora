import { StyleSheet } from "react-native";
import Color from "../Color";

export default StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Color.gray200,
    backgroundColor: Color.white,
  },
  primary: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  accessory: {
    height: 44,
  },
  composer: {
    borderWidth: 1,
    borderColor: "grey",
    minHeight: 100,
    margin: 4,
    borderRadius: 15,
    justifyContent: "center",
  },

  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
