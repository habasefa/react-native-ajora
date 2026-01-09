import { StyleSheet, Text, View } from "react-native";
import { AjoraProvider, defineToolCallRenderer } from "@ajora-ai/native";
import Chat from "@/components/v2/chat";

const index = () => {
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
      <View style={styles.container}>
        <Chat />
      </View>
    </AjoraProvider>
  );
};

export default index;

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
