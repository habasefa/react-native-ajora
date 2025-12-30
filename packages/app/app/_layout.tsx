import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import {
  ThemePreferenceProvider,
  useColorScheme,
  useThemePreference,
} from "@/contexts/theme-context";

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <ThemedContent />
    </ThemePreferenceProvider>
  );
}

function ThemedContent() {
  const { isLoaded } = useThemePreference();
  const colorScheme = useColorScheme();

  // Don't render until theme preference is loaded to avoid flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
