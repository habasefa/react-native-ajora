import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "./styles";
import { MaterialIcons } from "@expo/vector-icons";
import { useChatContext } from "../AjoraContext";
import { colors } from "../Theme";

export interface HeaderProps {
  title?: string;
  onRightPress?: () => void;
  onLeftPress?: () => void;
  containerStyle?: any;
}

export function Header({
  title,
  onRightPress,
  onLeftPress,
  containerStyle,
}: HeaderProps) {
  const { ajora } = useChatContext();

  const { threads, activeThreadId } = ajora;
  const activeThread = threads.find((thread) => thread.id === activeThreadId);
  return (
    <View style={[styles.container, containerStyle]}>
      {/* Left: Menu Icon */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={onLeftPress}
        activeOpacity={0.7}
      >
        <MaterialIcons name="menu" size={24} color={colors.appPrimary} />
      </TouchableOpacity>

      {/* Center: Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {activeThread?.title ?? title ?? "New Chat"}
        </Text>
      </View>

      {/* Right: Plus Icon */}
      <TouchableOpacity
        style={styles.plusButton}
        onPress={onRightPress}
        activeOpacity={0.7}
      >
        <MaterialIcons name="chevron-right" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}
