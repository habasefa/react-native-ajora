import {
  AjoraChat,
  useAgentContext,
  useConfigureSuggestions,
  useFrontendTool,
} from "@ajora-ai/native";
import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import z from "zod";

export default function Chat() {
  const [selectedThreadId, setSelectedThreadId] = useState<
    "thread---a" | "thread---b" | "thread---c"
  >("thread---a");
  const threadOptions: Array<{ id: typeof selectedThreadId; label: string }> = [
    { id: "thread---a", label: "Thread A" },
    { id: "thread---b", label: "Thread B" },
    { id: "thread---c", label: "Thread C" },
  ];

  useConfigureSuggestions({
    instructions: "Suggest follow-up tasks based on the current page content",
  });

  useAgentContext({
    description: "The current Thread ID is:",
    value: selectedThreadId,
  });

  //useConfigureSuggestions({
  //  instructions: "Suggest helpful next actions",
  //});

  // useConfigureSuggestions({
  //   suggestions: [
  //     {
  //       title: "Action 1",
  //       message: "Do action 1",
  //     },
  //     {
  //       title: "Action 2",
  //       message: "Do action 2",
  //     },
  //   ],
  // });

  useFrontendTool({
    name: "sayHello",
    parameters: z.object({
      name: z.string(),
    }),
    handler: async ({ name }) => {
      Alert.alert("Hello", `Hello ${name}`);
      return `Hello ${name}`;
    },
  });
  const toolsMenu = useMemo<(any | "-")[]>(
    () => [
      {
        label: "Say hi to CopilotKit",
        action: () => {
          // Note: In React Native, you would need to use a ref to access the input
          // This is a placeholder - you may need to adjust based on AjoraChat's API
          const greeting =
            "Hello Copilot! 👋 Could you help me with something?";
          Alert.alert("Greeting", greeting);
        },
      },
      "-",
      {
        label: "Open CopilotKit Docs",
        action: () => {
          Linking.openURL("https://docs.copilotkit.ai").catch((err) =>
            console.error("Failed to open URL:", err)
          );
        },
      },
    ],
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        {threadOptions.map(({ id, label }, index) => {
          const isActive = id === selectedThreadId;
          return (
            <Pressable
              key={id}
              onPress={() => setSelectedThreadId(id)}
              style={[
                styles.button,
                isActive && styles.buttonActive,
                index > 0 && styles.buttonSpacing,
              ]}
            >
              <Text
                style={[styles.buttonText, isActive && styles.buttonTextActive]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.chatContainer}>
        <AjoraChat inputProps={{ toolsMenu }} threadId={selectedThreadId} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    padding: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
  },
  buttonSpacing: {
    marginLeft: 10,
  },
  buttonActive: {
    borderWidth: 2,
    borderColor: "#111827",
    backgroundColor: "#111827",
  },
  buttonText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 14,
  },
  buttonTextActive: {
    color: "#ffffff",
  },
  chatContainer: {
    flex: 1,
    minHeight: 0,
  },
});
