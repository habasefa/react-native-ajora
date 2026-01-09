import { StyleSheet, Text, View } from "react-native";
import {
  AjoraProvider,
  defineToolCallRenderer,
  useAgent,
  useAjora,
} from "@ajora-ai/native";
import { useEffect } from "react";
import Chat from "@/components/v2/chat";

const LoggingComponent = () => {
  const { agent } = useAgent();
  const { ajora } = useAjora();

  useEffect(() => {
    // Log messages whenever they change
    console.log("=== Ajora Messages ===");
    console.log("Agent ID:", agent.agentId);
    console.log("Thread ID:", agent.threadId);
    console.log("Messages:", JSON.stringify(agent.messages, null, 2));
    console.log("Messages Count:", agent.messages.length);
    console.log("Is Running:", agent.isRunning);
    console.log("=====================");
  }, [agent.messages, agent.agentId, agent.threadId, agent.isRunning]);

  useEffect(() => {
    // Log state if we have threadId and runId
    if (agent.threadId && agent.agentId) {
      const runIds = ajora.getRunIdsForThread(agent.agentId, agent.threadId);
      console.log("=== Ajora State ===");
      console.log("Agent ID:", agent.agentId);
      console.log("Thread ID:", agent.threadId);
      console.log("Run IDs:", runIds);

      // Log state for each run
      runIds.forEach((runId) => {
        const state = ajora.getStateByRun(
          agent.agentId!,
          agent.threadId,
          runId
        );
        console.log(`State for Run ${runId}:`, JSON.stringify(state, null, 2));
      });

      // Also log agent's state property if available
      if (agent.state) {
        console.log("Agent State:", JSON.stringify(agent.state, null, 2));
      }
      console.log("===================");
    }
  }, [agent.threadId, agent.agentId, agent.messages, agent.state, ajora]);

  return null;
};

const Index = () => {
  // Define a wildcard renderer for any undefined tools
  const wildcardRenderer = defineToolCallRenderer({
    name: "*",
    // No args needed for wildcard - defaults to z.any()
    render: ({ name, args, status }) => (
      <View
        style={{
          padding: 12,
          marginVertical: 8,
          backgroundColor: "#f0f0f0",
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#ccc",
        }}
      >
        <Text style={{ fontWeight: "bold" }}>Unknown Tool: {name}</Text>
        <Text style={{ marginTop: 8, fontSize: 12, fontFamily: "monospace" }}>
          Status: {status}
          {args && "\nArguments: " + JSON.stringify(args, null, 2)}
        </Text>
      </View>
    ),
  });

  return (
    <AjoraProvider
      runtimeUrl="http://localhost:4000/api/copilotkit"
      useSingleEndpoint={true}
      renderToolCalls={[wildcardRenderer]}
    >
      <LoggingComponent />
      <View style={styles.container}>
        <Chat />
      </View>
    </AjoraProvider>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
