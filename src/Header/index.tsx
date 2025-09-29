import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "./styles";
import { MaterialIcons } from "@expo/vector-icons";
import { useChatContext } from "../AjoraContext";

export interface HeaderProps {
  title?: string;
  onMenuPress?: () => void;
  onPlusPress?: () => void;
  containerStyle?: any;
}

export function Header({
  title,
  onMenuPress,
  onPlusPress,
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
        onPress={onMenuPress}
        activeOpacity={0.7}
      >
        <MaterialIcons name="menu" size={24} color="black" />
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
        onPress={onPlusPress}
        activeOpacity={0.7}
      >
        <MaterialIcons name="add" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
}
