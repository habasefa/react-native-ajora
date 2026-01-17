import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAgent, useAjora } from "react-native-ajora";

export default function Index() {
  const { agent } = useAgent();
  const { ajora } = useAjora();
  const [inputValue, setInputValue] = useState("");

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    agent.addMessage({
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: inputValue,
    
    });
    
    setInputValue("");

    try {
      await ajora.runAgent({ agent });
    } catch (error) {
      console.error("Failed to run agent:", error);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View
      style={[
        styles.messageBubble,
        item.role === "user" ? styles.userBubble : styles.modelBubble,
      ]}
    >
      <Text style={styles.messageText}>
        {typeof item.content === 'string' ? item.content : JSON.stringify(item.content)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Headless Example</Text>
        </View>

        <FlatList
          data={agent.messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          inverted={false}
        />

        {agent.isRunning && (
          <View style={styles.thinkingContainer}>
            <Text style={styles.thinkingText}>Thinking...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Type a message..."
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#FFF",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 2,
  },
  modelBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E5EA",
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 16,
    color: "#000",
  },
  thinkingContainer: {
    padding: 8,
    marginLeft: 16,
  },
  thinkingText: {
    fontStyle: "italic",
    color: "#666",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 12,
    color: "#000",
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#007AFF",
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
});
