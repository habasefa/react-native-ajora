import { StyleSheet, Dimensions } from "react-native";
import Color from "../Color";

const { width: screenWidth } = Dimensions.get("window");

export default StyleSheet.create({
  container: {
    width: screenWidth * 0.9,
  },
  leftContainer: {
    // Remove margin to allow full width
  },
  rightContainer: {
    // Remove margin to allow full width
  },
  toolCallHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  toolIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  toolName: {
    fontSize: 14,
    fontWeight: "600",
    color: Color.black,
  },
  argsContainer: {
    width: screenWidth * 0.9,
    backgroundColor: Color.backgroundTransparent,
    padding: 16,
    borderRadius: 8,
    borderColor: Color.gray200,
    marginBottom: 8,
    shadowColor: Color.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  argsText: {
    fontSize: 14,
    color: Color.gray700,
    lineHeight: 20,
    fontWeight: "600",
  },
  argsSubText: {
    fontSize: 12,
    color: Color.gray600,
    lineHeight: 16,
    marginTop: 4,
    fontFamily: "monospace",
  },
  responseContainer: {
    width: screenWidth * 0.9,
    padding: 16,
    backgroundColor: Color.backgroundTransparent,
    borderRadius: 8,
    borderColor: Color.gray200,
    shadowColor: Color.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  responseText: {
    fontSize: 14,
    color: Color.gray800,
    fontWeight: "300",
    fontStyle: "italic",
    lineHeight: 20,
  },
  // Modern minimal tool call styles
  toolCallWrapper: {
    backgroundColor: Color.backgroundTransparent,
    borderRadius: 8,
    borderColor: Color.gray200,
    shadowColor: Color.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toolCallContent: {
    padding: 12,
  },
  toolCallTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Color.black,
    marginBottom: 4,
  },
  toolCallDescription: {
    fontSize: 12,
    color: Color.gray600,
    lineHeight: 16,
  },
});
