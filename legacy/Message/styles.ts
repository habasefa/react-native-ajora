import { StyleSheet } from "react-native";
import Color from "../Color";

export default {
  left: StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "flex-start",
      marginLeft: 12,
      marginRight: 0,
      marginVertical: 2,
    },
  }),
  right: StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "flex-end",
      marginLeft: 0,
      marginRight: 12,
      marginVertical: 2,
    },
  }),
  // Modern shadcn-inspired message container styles
  messageContainer: {
    maxWidth: "100%",
    minWidth: 60,
  },
  messageWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  avatar: {
    marginHorizontal: 4,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: Color.mutedForeground,
    marginTop: 2,
    fontWeight: "400",
  },
  status: {
    fontSize: 10,
    color: Color.gray400,
    marginTop: 2,
    fontWeight: "500",
  },
};
