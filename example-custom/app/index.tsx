import { StyleSheet, Text, View } from "react-native";
import { AjoraProvider, defineToolCallRenderer } from "@ajora-ai/native";
import Chat from "@/components/chat";

const Index = () => {
  // Define a wildcard renderer for any undefined tools
  const wildcardRenderer = defineToolCallRenderer({
    name: "*",
    // No args needed for wildcard - defaults to z.any()
    render: ({ name, args, status }) => (
      <View style={styles.toolCallContainer}>
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
      runtimeUrl="http://localhost:3000/api/copilotkit"
      useSingleEndpoint={true}
      renderToolCalls={[wildcardRenderer]}
    >
      <Chat />
    </AjoraProvider>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  toolCallContainer: {
    padding: 12,
    marginVertical: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
});
