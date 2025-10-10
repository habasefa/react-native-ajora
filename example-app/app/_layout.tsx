import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AjoraProvider } from "../../src";
import useAjora from "../../src/hooks/useAjora";
import "react-native-get-random-values";

export default function RootLayout() {
  const ajora = useAjora({
    baseUrl: "http://localhost:3000",
    debug: true, // Enable debug mode for EventSource logging
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AjoraProvider ajora={ajora}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="light" />
        </AjoraProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
