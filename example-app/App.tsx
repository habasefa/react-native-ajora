import React, { useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { AjoraProvider, AjoraChat } from "react-native-ajora";

const RUNTIME_URL =
  process.env.EXPO_PUBLIC_RUNTIME_URL ?? "http://localhost:3000/api/copilotkit";

export default function App() {
  const [threadId] = useState<string | undefined>(undefined);

  return (
    <SafeAreaView style={styles.container}>
      <AjoraProvider runtimeUrl={RUNTIME_URL} useSingleEndpoint>
        <AjoraChat agentId="default" threadId={threadId} />
      </AjoraProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
