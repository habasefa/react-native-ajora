import AjoraChatHeader from "./header/AjoraChatHeader";
import {
  useAgentContext,
  useConfigureSuggestions,
  type Suggestion,
  AjoraChat,
  type ModelOption,
  type AgentOption,
  type MentionSuggestion,
  // New theming imports
  AjoraThemeProvider,
  themePresets,
} from "@ajora-ai/native";
import { useJokeTool } from "./tools/JokeTool";
import { useQuoteTool } from "./tools/QuoteTool";
import { useHistoryTool } from "./tools/HistoryTool";
import { useResolutionTool } from "./tools/ResolutionTool";
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

// Example starter suggestions for empty state
const STARTER_SUGGESTIONS: Suggestion[] = [
  {
    id: "1",
    title: "Tell me a joke",
    message: "Tell me a well designed joke",
    icon: "happy-outline",
    iconFamily: "Ionicons",
  },
  {
    id: "2",
    title: "Quote of the day",
    message: "What is the quote of the day?",
    icon: "format-quote",
    iconFamily: "MaterialIcons",
  },
  {
    id: "3",
    title: "Men in History",
    message: "Tell me about interesting men in history",
    icon: "history-edu",
    iconFamily: "MaterialIcons",
  },
  {
    id: "4",
    title: "New Year Resolution",
    message: "Give me a new year resolution",
    icon: "calendar-outline",
    iconFamily: "Ionicons",
  },
];

// Demo models showcasing isDisabled and isNew fields
const DEMO_MODELS: ModelOption[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Most capable model",
    badge: "New",
  },
  {
    id: "claude-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Great for analysis",
  },
  {
    id: "gemini-pro",
    name: "Gemini 2.0 Flash",
    provider: "google",
    description: "Fast responses",
  },
  {
    id: "o1-preview",
    name: "o1 Preview",
    provider: "openai",
    description: "Advanced reasoning",
    isDisabled: true,
    extraData: { reason: "Coming soon" },
  },
  {
    id: "claude-opus",
    name: "Claude 3 Opus",
    provider: "anthropic",
    description: "Premium model",
    isDisabled: true,
    badge: "Pro",
    extraData: { subscriptionRequired: "pro" },
  },
];

// Demo agents showcasing isDisabled and isNew fields
const DEMO_AGENTS: AgentOption[] = [
  {
    id: "general",
    name: "General Assistant",
    description: "All-purpose AI assistant",
    icon: "chatbubble-outline",
  },
  {
    id: "researcher",
    name: "Research Agent",
    description: "Deep research and analysis",
    icon: "search-outline",
    badge: "New",
  },
  {
    id: "coder",
    name: "Code Agent",
    description: "Programming assistance",
    icon: "code-slash-outline",
  },
  {
    id: "creative",
    name: "Creative Agent",
    description: "Coming soon - Premium feature",
    icon: "bulb-outline",
    isDisabled: true,
    extraData: { tier: "premium" },
  },
];

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

  // New Tools
  useJokeTool();
  useQuoteTool();
  useHistoryTool();
  useResolutionTool();

  return (
    <View style={styles.container}>
      {/* Chat Header with menu, title, and new thread button */}
      <AjoraChatHeader
        title={currentThread?.name ?? "Chat"}
        subtitle="AI Assistant"
        onMenuPress={() => {
          // Toggle the thread drawer
          toggleDrawer();
        }}
        onNewThreadPress={() => {
          // Create a new thread
          createThread();
        }}
        onTitlePress={() => {
          // Could open a thread picker or rename dialog
          Alert.alert("Thread", currentThread?.name ?? "Unknown thread");
        }}
      />

      {/* Thread Drawer */}
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

      {/* Thread Menu Bottom Sheet */}
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
