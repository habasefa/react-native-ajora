import { StyleSheet } from "react-native";
import { colors, borderRadius, shadows, spacing } from "../Theme";

const styles = {
  left: StyleSheet.create({
    container: {
      alignItems: "flex-start",
    },
    wrapper: {
      borderRadius: borderRadius.lg,
      backgroundColor: "transparent",
      marginRight: 0,
      minHeight: 20,
      justifyContent: "flex-end",
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
    },
    containerToNext: {
      borderBottomLeftRadius: borderRadius.sm,
    },
    containerToPrevious: {
      borderTopLeftRadius: borderRadius.sm,
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
      borderRadius: borderRadius.lg,
      backgroundColor: colors.appPrimary,
      borderWidth: 1,
      borderColor: colors.appPrimary,
      marginLeft: 60,
      minHeight: 20,
      justifyContent: "flex-end",
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      ...shadows.base,
    },
    containerToNext: {
      borderBottomRightRadius: borderRadius.sm,
    },
    containerToPrevious: {
      borderTopRightRadius: borderRadius.sm,
    },
    bottom: {
      flexDirection: "row",
      justifyContent: "flex-end",
    },
  }),
  content: StyleSheet.create({
    tick: {
      fontSize: 10,
      backgroundColor: "transparent",
      color: colors.white,
      fontWeight: "500",
    },
    tickView: {
      flexDirection: "row",
      marginRight: spacing.base,
      alignItems: "center",
    },
  }),
};

export default styles;
