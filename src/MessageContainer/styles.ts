import { Dimensions, StyleSheet } from "react-native";
import Color from "../Color";

export default StyleSheet.create({
  containerAlignTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  contentContainerStyle: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  // emptyChatContainer: {
  //   flex: 1,
  //   justifyContent: "center",
  //   alignItems: "center",
  //   paddingHorizontal: 16,
  //   paddingVertical: 32,
  // },
  scrollToBottomStyle: {
    opacity: 0.9,
    position: "absolute",
    right: 16,
    bottom: 24,
    zIndex: 999,
    height: 48,
    width: 48,
    borderRadius: 24,
    backgroundColor: Color.card,
    shadowColor: Color.shadow,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  scrollToBottomIcon: {
    fontSize: 18,
    fontWeight: "600",
    color: Color.gray700,
  },
  // Modern shadcn-inspired container styles
  container: {
    backgroundColor: Color.background,
    flex: 1,
  },
  scrollContainer: {
    backgroundColor: Color.muted,
  },
  messageList: {
    paddingBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: Color.mutedForeground,
    textAlign: "center",
    marginTop: 16,
  },

  emptyChatContainer: {
    flex: 1,
    height: Dimensions.get("window").height * 0.5,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 20,
  },
  emptyChatContent: {
    alignItems: "center",
    marginBottom: 40,
    flex: 1,
    justifyContent: "center",
  },
  emptyChatIcon: {
    marginBottom: 20,
  },
  emptyChatTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyChatSubtitle: {
    fontSize: 17,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  suggestedQuestionsContainer: {
    width: "100%",
    maxWidth: 400,
  },
  suggestedQuestionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  suggestedQuestionsRow: {
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  suggestedQuestionCard: {
    width: 160,
    height: 170,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestedQuestionIcon: {
    marginBottom: 6,
  },
  suggestedQuestionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  suggestedQuestionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1E293B",
    textAlign: "center",
    lineHeight: 18,
    letterSpacing: -0.1,
  },
});
