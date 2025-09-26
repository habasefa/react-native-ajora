import { StyleSheet } from "react-native";
import Color from "../Color";

const styles = {
  left: StyleSheet.create({
    container: {
      alignItems: "flex-start",
    },
    wrapper: {
      borderRadius: 18,
      backgroundColor: Color.leftBubble,
      marginRight: 0,
      minHeight: 20,
      justifyContent: "flex-end",
      paddingHorizontal: 16,
      paddingVertical: 6,
      shadowColor: Color.shadow,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    containerToNext: {
      borderBottomLeftRadius: 4,
    },
    containerToPrevious: {
      borderTopLeftRadius: 4,
    },
    bottom: {
      flexDirection: "row",
      justifyContent: "flex-start",
    },
  }),
  right: StyleSheet.create({
    container: {
      alignItems: "flex-end",
    },
    wrapper: {
      borderRadius: 18,
      backgroundColor: Color.rightBubble,
      borderWidth: 1,
      borderColor: Color.rightBubble,
      marginLeft: 60,
      minHeight: 20,
      justifyContent: "flex-end",
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: Color.shadowMd,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    containerToNext: {
      borderBottomRightRadius: 4,
    },
    containerToPrevious: {
      borderTopRightRadius: 4,
    },
    bottom: {
      flexDirection: "row",
      justifyContent: "flex-end",
    },
  }),
  content: StyleSheet.create({
    tick: {
      fontSize: 10,
      backgroundColor: Color.backgroundTransparent,
      color: Color.rightBubbleText,
      fontWeight: "500",
    },
    tickView: {
      flexDirection: "row",
      marginRight: 10,
      alignItems: "center",
    },
  }),
};

export default styles;
