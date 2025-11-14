import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useChatContext } from "../../src/AjoraContext";

// Types
export interface HeaderProps {
  title?: string;
  onRightPress?: () => void;
  onLeftPress?: () => void;
  containerStyle?: any;
}

interface Thread {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

// Theme values (self-contained)
const colors = {
  appPrimary: "#4095E5",
  appSecondary: "#F3F4F6",
  text: "#1F2937",
  primaryText: "#111827",
  secondaryText: "#6B7280",
  background: "#F9FAFB",
  white: "#FFFFFF",
  border: "#E5E7EB",
  shadow: "#000000",
};

const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
  },
  weights: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
  "3xl": 48,
};

const borderRadius = {
  sm: 8,
  base: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

export function Header({
  title,
  onRightPress,
  onLeftPress,
  containerStyle,
}: HeaderProps) {
  const { ajora } = useChatContext();

  const { threads, activeThreadId } = ajora;
  const activeThread = threads.find(
    (thread: Thread) => thread.id === activeThreadId
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Left: Menu Icon */}
      {onLeftPress ? (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onLeftPress}
          activeOpacity={0.7}
        >
          <MaterialIcons name="menu" size={24} color={colors.appPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.menuButton} />
      )}

      {/* Center: Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {activeThread?.title ?? title ?? "New Chat"}
        </Text>
      </View>

      {/* Right: Plus Icon */}
      {onRightPress ? (
        <TouchableOpacity
          style={styles.plusButton}
          onPress={onRightPress}
          activeOpacity={0.7}
        >
          <MaterialIcons name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.plusButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  plusButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as any,
    color: colors.primaryText,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  icon: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
  },
  plusIcon: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
  },
});
