import {
  useAgentContext,
  useConfigureSuggestions,
  AjoraChat,
  type ModelOption,
  type AgentOption,
  type MentionSuggestion,
  // New theming imports
  AjoraThemeProvider,
  useAgent,
} from "@ajora-ai/native";
import { useJokeTool } from "@/components/tools/frontendTools/JokeTool";
import { useQuoteTool } from "@/components/tools/frontendTools/QuoteTool";
import { useHistoryTool } from "@/components/tools/frontendTools/HistoryTool";
import { useResolutionTool } from "@/components/tools/frontendTools/ResolutionTool";
import { AjoraThreadDrawer } from "@/components/thread/AjoraThreadDrawer";
import {
  AjoraThreadProvider,
  useAjoraThreads,
  type Thread,
} from "@/providers/AjoraThreadProvider";
import { ThreadMenuSheet } from "@/components/sheets/ThreadMenuSheet";
import { useState, useRef, useCallback } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { DEMO_AGENTS, DEMO_MODELS, STARTER_SUGGESTIONS } from "@/constants";
import AjoraChatHeader from "@/components/header/AjoraChatHeader";

const MENTION_SUGGESTIONS: MentionSuggestion[] = [
  { id: "1", name: "David", subtitle: "User", icon: "person-outline" },
  { id: "2", name: "Mary", subtitle: "User", icon: "person-outline" },
  {
    id: "3",
    name: "Agent Smith",
    subtitle: "AI Agent",
    icon: "hardware-chip-outline",
  },
];

// Inner Chat component that uses thread context
function ChatContent() {
  const {
    currentThreadId,
    currentThread,
    renameThread,
    deleteThread,
    toggleDrawer,
    createThread,
  } = useAjoraThreads();
  const threadMenuSheetRef = useRef<BottomSheetModal>(null);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const { agent } = useAgent();

  // Model and Agent selection state
  const [selectedModelId, setSelectedModelId] = useState<string>(
    DEMO_MODELS[0].id,
  );
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    DEMO_AGENTS[0].id,
  );

  const handleModelSelect = useCallback((model: ModelOption) => {
    setSelectedModelId(model.id);
    console.log("Model selected:", model.name, model.extraData);
  }, []);

  const handleAgentSelect = useCallback((agent: AgentOption) => {
    setSelectedAgentId(agent.id);
    console.log("Agent selected:", agent.name, agent.extraData);
  }, []);

  const handleAttachmentPreview = useCallback((file: any, callbacks: any) => {
    console.log("Attachment selected:", file.displayName);
    // Simulate upload for demo purposes
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      callbacks.onProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        callbacks.onComplete(); // Mark as uploaded
      }
    }, 500);
  }, []);

  useConfigureSuggestions({
    instructions: "Suggest follow-up tasks based on the current page content",
  });

  useAgentContext({
    description: "The current Thread ID is:",
    value: currentThreadId ?? "none",
  });

  // Backend Tools

  // Frontend Tools
  useJokeTool();
  useQuoteTool();
  useHistoryTool();
  useResolutionTool();

  console.log("agent messages: ", JSON.stringify(agent.messages, null, 2));

  return (
    <View style={styles.container}>
      <AjoraChatHeader
        title={currentThread?.name ?? "Chat"}
        subtitle="AI Assistant"
        onMenuPress={() => {
          toggleDrawer();
        }}
        onNewThreadPress={() => {
          createThread();
        }}
        onTitlePress={() => {
          Alert.alert("Thread", currentThread?.name ?? "Unknown thread");
        }}
      />

      <AjoraThreadDrawer
        showSearchBar={true}
        showSectionHeader={true}
        showFooter={true}
        userName="Habtamu Asefa"
        searchPlaceholder="Search conversations"
        editingThreadId={editingThreadId}
        onSettingsPress={() => {
          Alert.alert("Settings", "Settings would open here");
        }}
        onMenuPressThread={(thread) => {
          setSelectedThread(thread);
          threadMenuSheetRef.current?.present();
        }}
        onLongPressThread={(thread) => {
          setSelectedThread(thread);
          threadMenuSheetRef.current?.present();
        }}
        onRenameThread={(threadId, newName) => {
          renameThread(threadId, newName);
          setEditingThreadId(null);
        }}
      />

      <ThreadMenuSheet
        ref={threadMenuSheetRef}
        threadName={selectedThread?.name}
        onRename={() => {
          if (selectedThread) {
            setEditingThreadId(selectedThread.id);
            setSelectedThread(null);
          }
        }}
        onDelete={() => {
          if (selectedThread) {
            Alert.alert(
              "Delete Thread",
              "Are you sure you want to delete this conversation?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    deleteThread(selectedThread.id);
                    setSelectedThread(null);
                  },
                },
              ],
            );
          }
        }}
      />

      {/* Main Chat Area */}
      <View style={styles.chatContainer}>
        {currentThreadId && (
          <AjoraChat
            threadId={currentThreadId}
            labels={{
              chatEmptyStateTitle: "How can I help you today?",
              chatEmptyStateSubtitle:
                "I can tell jokes, quiz you, or just chat!",
            }}
            starterSuggestions={STARTER_SUGGESTIONS}
            inputProps={{
              models: DEMO_MODELS,
              selectedModelId,
              onModelSelect: handleModelSelect,
              agents: DEMO_AGENTS,
              selectedAgentId,
              onAgentSelect: handleAgentSelect,
              onAttachmentPreview: handleAttachmentPreview,
              mentionSuggestions: MENTION_SUGGESTIONS,
              onMentionSelect: (suggestion) =>
                console.log("Mention selected:", suggestion),
            }}
          />
        )}
      </View>
    </View>
  );
}

// Main Chat component wrapped with Thread Provider and Theme Provider
export default function Chat() {
  return (
    // Custom dark theme with Ajora branding
    <AjoraThemeProvider>
      <AjoraThreadProvider
        autoCreateThread={true}
        generateThreadName={(index) => `Conversation ${index}`}
        onThreadChange={(thread) => {
          console.log("Thread changed:", thread?.name);
        }}
        onThreadCreate={(thread) => {
          console.log("Thread created:", thread.name);
        }}
        onThreadDelete={(threadId) => {
          console.log("Thread deleted:", threadId);
        }}
      >
        <ChatContent />
      </AjoraThreadProvider>
    </AjoraThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
  },
  chatContainer: {
    flex: 1,
    minHeight: 0,
  },
});
