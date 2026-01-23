import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";
import "react-native-get-random-values";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { AjoraProvider } from "@ajora-ai/native";
import { WebSearchTool } from "../components/tools/backendTools/websearchTool";
import z from "zod";

export const unstable_settings = {
  anchor: "index",
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheetModalProvider>
        <SafeAreaProvider>
          <AjoraProvider
            runtimeUrl="http://localhost:3000/api/copilotkit"
            useSingleEndpoint={true}
            renderToolCalls={[
              {
                name: "webSearch",
                args: z.object({
                  query: z.string().min(1).max(50).describe("The search query"),
                }),
                render: WebSearchTool,
              },
            ]}
          >
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
          </AjoraProvider>
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
