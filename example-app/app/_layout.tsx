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
    baseUrl: "http://localhost:4000/api/v3/agent",

    bearerToken:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGRjMzFhODA1ODgxYTg1ZjM2N2Q4OGIiLCJlbWFpbCI6ImFuaUBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJhbmkiLCJsYXN0TmFtZSI6ImQiLCJpYXQiOjE3NTkyNjExMjUsImV4cCI6MTc5MDc5NzEyNSwiYXVkIjoiZHltbmQtdXNlcnMiLCJpc3MiOiJkeW1uZCJ9.OdLVDScBCczGFh7Q7GPVMWS8cSAsI1AvAhJAEw06Yfk",
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
