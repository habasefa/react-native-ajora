import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AjoraProvider } from "../../src";
import useAjora from "../../src/hooks/useAjora";
import { createAxiosInstance } from "@/api";
import "react-native-get-random-values";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const ajora = useAjora({
    baseUrl: "http://localhost:3000",
    debug: true, // Enable debug mode for EventSource logging
  });

  console.log("ajora.baseUrl", ajora.baseUrl);
  // Initialize axios instance with baseUrl from ajora
  useEffect(() => {
    if (ajora?.baseUrl) {
      createAxiosInstance({
        baseUrl: ajora.baseUrl,
        bearerToken: undefined, // Add bearerToken if needed
      });
    }
  }, [ajora?.baseUrl]);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AjoraProvider ajora={ajora}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen
                name="threadList"
                options={{ headerShown: false, presentation: "modal" }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="light" />
          </AjoraProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
