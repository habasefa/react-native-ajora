import { Stack } from "expo-router";
import "react-native-get-random-values";
import { AjoraProvider } from "react-native-ajora";

export default function RootLayout() {
  return (
    <AjoraProvider
      runtimeUrl="http://localhost:4000/api/copilotkit"
      useSingleEndpoint={true}
      properties={{
        model: "openai/gpt-4o",
      }}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </AjoraProvider>
  );
}
