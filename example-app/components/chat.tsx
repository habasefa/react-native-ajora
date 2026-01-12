import AjoraChatHeader from "./header/AjoraChatHeader";
import {
  useAgentContext,
  useConfigureSuggestions,
  useFrontendTool,
  type Suggestion,
  AjoraChat,
} from "@ajora-ai/native";
import { AjoraThreadDrawer } from "@/components/thread/AjoraThreadDrawer";
import {
  AjoraThreadProvider,
  useAjoraThreads,
  type Thread,
} from "@/providers/AjoraThreadProvider";
import { ThreadMenuSheet } from "@/components/sheets/ThreadMenuSheet";
import { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { z } from "zod";
import { ToolCallStatus } from "@ajora-ai/core";

// Multiple Choice Question Component
const MultipleChoiceQuestion = ({
  question,
  options,
  correctAnswer,
}: {
  question: string;
  options: string[];
  correctAnswer?: number;
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  return (
    <View style={toolStyles.mcContainer}>
      <View style={toolStyles.mcHeader}>
        <Text style={toolStyles.mcIcon}>❓</Text>
        <Text style={toolStyles.mcTitle}>Multiple Choice Question</Text>
      </View>
      <View style={toolStyles.mcQuestionContainer}>
        <Text style={toolStyles.mcQuestion}>{question}</Text>
      </View>
      <View style={toolStyles.mcOptionsContainer}>
        {options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isCorrect =
            correctAnswer !== undefined && correctAnswer === index;
          const showResult =
            selectedOption !== null && correctAnswer !== undefined;

          return (
            <Pressable
              key={index}
              onPress={() => setSelectedOption(index)}
              disabled={showResult}
              style={[
                toolStyles.mcOption,
                isSelected && toolStyles.mcOptionSelected,
                showResult && isCorrect && toolStyles.mcOptionCorrect,
                showResult &&
                  isSelected &&
                  !isCorrect &&
                  toolStyles.mcOptionIncorrect,
              ]}
            >
              <View style={toolStyles.mcOptionContent}>
                <View
                  style={[
                    toolStyles.mcOptionCircle,
                    isSelected && toolStyles.mcOptionCircleSelected,
                  ]}
                >
                  {isSelected && (
                    <View style={toolStyles.mcOptionCircleInner} />
                  )}
                </View>
                <Text
                  style={[
                    toolStyles.mcOptionText,
                    isSelected && toolStyles.mcOptionTextSelected,
                  ]}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </Text>
              </View>
              {showResult && isCorrect && (
                <Text style={toolStyles.mcResultIcon}>✓</Text>
              )}
              {showResult && isSelected && !isCorrect && (
                <Text style={toolStyles.mcResultIconIncorrect}>✗</Text>
              )}
            </Pressable>
          );
        })}
      </View>
      {selectedOption !== null && correctAnswer !== undefined && (
        <View style={toolStyles.mcResultContainer}>
          <Text style={toolStyles.mcResultText}>
            {selectedOption === correctAnswer
              ? "🎉 Correct! Well done!"
              : `❌ Incorrect. The correct answer is ${String.fromCharCode(65 + correctAnswer)}.`}
          </Text>
        </View>
      )}
    </View>
  );
};

// Example starter suggestions for empty state
const STARTER_SUGGESTIONS: Suggestion[] = [
  {
    id: "1",
    title: "Explore Science",
    message: "Explain how black holes form and what happens inside them",
    icon: "flask-outline",
    iconFamily: "Ionicons",
  },
  {
    id: "2",
    title: "Discover History",
    message:
      "Tell me about an interesting historical event that changed the world",
    icon: "history",
    iconFamily: "MaterialIcons",
  },
  {
    id: "3",
    title: "Role Play Adventure",
    message:
      "Let's play a text adventure game where I'm a detective solving a mystery",
    icon: "sword-cross",
    iconFamily: "MaterialCommunityIcons",
  },
  {
    id: "4",
    title: "Code Something",
    message: "Help me write a function to sort an array in JavaScript",
    icon: "code",
    iconFamily: "Feather",
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

  useConfigureSuggestions({
    instructions: "Suggest follow-up tasks based on the current page content",
  });

  useAgentContext({
    description: "The current Thread ID is:",
    value: currentThreadId ?? "none",
  });

  // Joke Tool
  useFrontendTool({
    name: "tellJoke",
    description: "Tell a joke to the user",
    parameters: z.object({
      topic: z.string().optional(),
      type: z.enum(["pun", "knock-knock", "dad-joke", "one-liner"]).optional(),
    }),
    handler: async ({ topic, type }) => {
      const jokes: Record<string, string[]> = {
        pun: [
          "Why don't scientists trust atoms? Because they make up everything!",
          "I told my wife she was drawing her eyebrows too high. She looked surprised.",
          "Why did the scarecrow win an award? He was outstanding in his field!",
        ],
        "knock-knock": [
          "Knock knock. Who's there? Boo. Boo who? Don't cry, it's just a joke!",
          "Knock knock. Who's there? Lettuce. Lettuce who? Lettuce in, it's cold out here!",
        ],
        "dad-joke": [
          "I'm reading a book about anti-gravity. It's impossible to put down!",
          "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them!",
        ],
        "one-liner": [
          "I used to be a baker, but I couldn't make enough dough.",
          "I'm on a seafood diet. I see food and I eat it.",
        ],
      };

      const selectedType = type || "one-liner";
      const typeJokes = jokes[selectedType] || jokes["one-liner"];
      const randomJoke =
        typeJokes[Math.floor(Math.random() * typeJokes.length)];

      return randomJoke;
    },
    render: ({ args, status, result }) => {
      if (status === ToolCallStatus.InProgress) {
        return (
          <View style={toolStyles.jokeContainer}>
            <View style={toolStyles.jokeHeader}>
              <Text style={toolStyles.jokeIcon}>😄</Text>
              <Text style={toolStyles.jokeTitle}>Preparing a joke...</Text>
            </View>
            <ActivityIndicator size="small" color="#6366f1" />
          </View>
        );
      }

      if (status === ToolCallStatus.Executing) {
        return (
          <View style={toolStyles.jokeContainer}>
            <View style={toolStyles.jokeHeader}>
              <Text style={toolStyles.jokeIcon}>🤔</Text>
              <Text style={toolStyles.jokeTitle}>
                Finding the perfect joke...
              </Text>
            </View>
            <ActivityIndicator size="small" color="#6366f1" />
          </View>
        );
      }

      return (
        <View style={toolStyles.jokeContainer}>
          <View style={toolStyles.jokeHeader}>
            <Text style={toolStyles.jokeIcon}>😂</Text>
            <Text style={toolStyles.jokeTitle}>
              Here&apos;s a joke for you!
            </Text>
          </View>
          {args.topic && (
            <View style={toolStyles.jokeTopic}>
              <Text style={toolStyles.jokeTopicText}>Topic: {args.topic}</Text>
            </View>
          )}
          <View style={toolStyles.jokeContent}>
            <Text style={toolStyles.jokeText}>
              {result || "No joke found!"}
            </Text>
          </View>
        </View>
      );
    },
  });

  // Multiple Choice Tool
  useFrontendTool({
    name: "askMultipleChoice",
    description: "Ask the user a multiple choice question",
    parameters: z.object({
      question: z.string(),
      options: z.array(z.string()).min(2).max(6),
      correctAnswer: z.number().optional(),
    }),
    handler: async ({ question, options, correctAnswer }) => {
      return `Question: ${question}\nOptions: ${options.join(", ")}`;
    },
    render: ({ args, status }) => {
      if (
        status === ToolCallStatus.InProgress ||
        status === ToolCallStatus.Executing
      ) {
        return (
          <View style={toolStyles.mcContainer}>
            <View style={toolStyles.mcHeader}>
              <Text style={toolStyles.mcTitle}>Preparing question...</Text>
            </View>
            <ActivityIndicator size="small" color="#6366f1" />
          </View>
        );
      }

      return (
        <MultipleChoiceQuestion
          question={args.question}
          options={args.options || []}
          correctAnswer={args.correctAnswer}
        />
      );
    },
  });

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
              ]
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
          />
        )}
      </View>
    </View>
  );
}

// Main Chat component wrapped with Thread Provider
export default function Chat() {
  return (
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

const toolStyles = StyleSheet.create({
  // Joke Tool Styles
  jokeContainer: {
    backgroundColor: "#fef3c7",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: "#fbbf24",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jokeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  jokeIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  jokeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#92400e",
  },
  jokeTopic: {
    backgroundColor: "#fde68a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  jokeTopicText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#78350f",
  },
  jokeContent: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  jokeText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#1f2937",
    fontStyle: "italic",
  },
  // Multiple Choice Tool Styles
  mcContainer: {
    backgroundColor: "#e0e7ff",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: "#6366f1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mcHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  mcIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  mcTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#312e81",
  },
  mcQuestionContainer: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#6366f1",
  },
  mcQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    lineHeight: 24,
  },
  mcOptionsContainer: {
    gap: 12,
  },
  mcOption: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#c7d2fe",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mcOptionSelected: {
    borderColor: "#6366f1",
    backgroundColor: "#eef2ff",
  },
  mcOptionCorrect: {
    borderColor: "#10b981",
    backgroundColor: "#d1fae5",
  },
  mcOptionIncorrect: {
    borderColor: "#ef4444",
    backgroundColor: "#fee2e2",
  },
  mcOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  mcOptionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#6366f1",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  mcOptionCircleSelected: {
    borderColor: "#4f46e5",
  },
  mcOptionCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#6366f1",
  },
  mcOptionText: {
    fontSize: 16,
    color: "#1f2937",
    flex: 1,
  },
  mcOptionTextSelected: {
    fontWeight: "600",
    color: "#312e81",
  },
  mcResultContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6366f1",
  },
  mcResultText: {
    fontSize: 14,
    color: "#1f2937",
  },
  mcResultIcon: {
    fontSize: 20,
    color: "#10b981",
    fontWeight: "bold",
  },
  mcResultIconIncorrect: {
    fontSize: 20,
    color: "#ef4444",
    fontWeight: "bold",
  },
});
