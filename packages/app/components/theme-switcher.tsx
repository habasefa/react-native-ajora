import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemePreference, useColorScheme } from "@/contexts/theme-context";
import { Colors } from "@/constants/theme";

type ThemeOption = "light" | "dark" | "auto";

interface ThemeSwitcherProps {
  style?: any;
}

const themeCycle: ThemeOption[] = ["light", "dark", "auto"];

export function ThemeSwitcher({ style }: ThemeSwitcherProps) {
  const { themePreference, setThemePreference } = useThemePreference();
  const colorScheme = useColorScheme();

  const handlePress = () => {
    const currentIndex = themeCycle.indexOf(themePreference);
    const nextIndex = (currentIndex + 1) % themeCycle.length;
    setThemePreference(themeCycle[nextIndex]);
  };

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (themePreference) {
      case "light":
        return "sunny";
      case "dark":
        return "moon";
      case "auto":
        return "phone-portrait";
      default:
        return "sunny";
    }
  };

  const currentColors = Colors[colorScheme];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor:
            colorScheme === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.05)",
        },
        style,
      ]}
      onPress={handlePress}
      accessibilityLabel={`Theme: ${themePreference}. Tap to cycle theme.`}
      accessibilityRole="button"
    >
      <Ionicons name={getIcon()} size={24} color={currentColors.icon} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
