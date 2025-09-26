import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
} from "react-native-reanimated";
import { ToolRequest, ToolResponse } from "../Tool/types";
import Color from "../Color";
import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";

// Get responsive card width (90% of screen width, max 400px, min 280px)
const getCardWidth = () => {
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth * 0.9;
  return Math.min(Math.max(cardWidth, 280), 400);
};

interface TodoListToolProps {
  request: ToolRequest;
  onResponse?: (response: ToolResponse) => void;
}

const TodoListTool: React.FC<TodoListToolProps> = ({ request, onResponse }) => {
  const [todoData, setTodoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styles = createStyles();

  const { tool } = request;
  const { action = "get" } = tool.args || {};

  const processTodoAction = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // The actual API call is handled by the server
      // This function is called when there's no response data yet
      // The response will be handled in the useEffect when it arrives
    } catch {
      setError("Failed to process todo action");
      if (onResponse && request) {
        onResponse({
          callId: request.callId,
          response: { error: "Failed to process todo action" },
        });
      }
    } finally {
      setLoading(false);
    }
  }, [action, request, onResponse]);

  useEffect(() => {
    if (request?.tool.name === "todo_list") {
      // Use response data from the merged functionCall
      if (request.tool.response) {
        const responseData = request.tool.response;

        // Handle the new response format with output array
        let todoData;
        if (responseData.output && Array.isArray(responseData.output)) {
          // If response has output array with todo lists, use the first one
          const todoList = responseData.output[0];
          if (todoList) {
            todoData = {
              action: action,
              todos: todoList.todos || [],
              totalTodos: todoList.todos?.length || 0,
              queueTodos:
                todoList.todos?.filter((todo: any) => todo.status === "queue")
                  .length || 0,
              executingTodos:
                todoList.todos?.filter(
                  (todo: any) => todo.status === "executing"
                ).length || 0,
              completedTodos:
                todoList.todos?.filter(
                  (todo: any) => todo.status === "completed"
                ).length || 0,
              errorTodos:
                todoList.todos?.filter((todo: any) => todo.status === "error")
                  .length || 0,
              listName: todoList.name || "Todo List",
              listDescription: todoList.description || "",
            };
          }
        } else if (Array.isArray(responseData)) {
          // Fallback: If response is directly an array of todo lists, use the first one
          const todoList = responseData[0];
          if (todoList) {
            todoData = {
              action: action,
              todos: todoList.todos || [],
              totalTodos: todoList.todos?.length || 0,
              queueTodos:
                todoList.todos?.filter((todo: any) => todo.status === "queue")
                  .length || 0,
              executingTodos:
                todoList.todos?.filter(
                  (todo: any) => todo.status === "executing"
                ).length || 0,
              completedTodos:
                todoList.todos?.filter(
                  (todo: any) => todo.status === "completed"
                ).length || 0,
              errorTodos:
                todoList.todos?.filter((todo: any) => todo.status === "error")
                  .length || 0,
              listName: todoList.name || "Todo List",
              listDescription: todoList.description || "",
            };
          }
        } else if (responseData && responseData.todos) {
          // Fallback: If response is a single todo list object
          todoData = {
            action: action,
            todos: responseData.todos || [],
            totalTodos: responseData.todos?.length || 0,
            queueTodos:
              responseData.todos?.filter((todo: any) => todo.status === "queue")
                .length || 0,
            executingTodos:
              responseData.todos?.filter(
                (todo: any) => todo.status === "executing"
              ).length || 0,
            completedTodos:
              responseData.todos?.filter(
                (todo: any) => todo.status === "completed"
              ).length || 0,
            errorTodos:
              responseData.todos?.filter((todo: any) => todo.status === "error")
                .length || 0,
            listName: responseData.name || "Todo List",
            listDescription: responseData.description || "",
          };
        } else {
          // Handle error or empty response
          todoData = {
            action: action,
            todos: [],
            totalTodos: 0,
            queueTodos: 0,
            executingTodos: 0,
            completedTodos: 0,
            errorTodos: 0,
            listName: "Todo List",
            listDescription: "No todos found",
          };
        }

        setTodoData(todoData);
        setLoading(false);
      } else {
        setLoading(true);
        setError(null);
      }
    }
  }, [request, action]);

  if (!request) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No request provided</Text>
      </View>
    );
  }

  const LoadingAnimation = () => {
    return (
      <View style={styles.loadingAnimation}>
        <LoadingDots />
      </View>
    );
  };

  const LoadingDots = () => {
    const dot1 = useSharedValue(0);
    const dot2 = useSharedValue(0);
    const dot3 = useSharedValue(0);

    useEffect(() => {
      const animateDots = () => {
        dot1.value = withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 200 })
        );
        dot2.value = withSequence(
          withTiming(0, { duration: 200 }),
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 200 })
        );
        dot3.value = withSequence(
          withTiming(0, { duration: 400 }),
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 200 })
        );
      };

      const interval = setInterval(animateDots, 600);
      return () => clearInterval(interval);
    }, []);

    const dot1Style = useAnimatedStyle(() => ({
      opacity: interpolate(dot1.value, [0, 1], [0.3, 1]),
      transform: [{ scale: interpolate(dot1.value, [0, 1], [0.8, 1.2]) }],
    }));

    const dot2Style = useAnimatedStyle(() => ({
      opacity: interpolate(dot2.value, [0, 1], [0.3, 1]),
      transform: [{ scale: interpolate(dot2.value, [0, 1], [0.8, 1.2]) }],
    }));

    const dot3Style = useAnimatedStyle(() => ({
      opacity: interpolate(dot3.value, [0, 1], [0.3, 1]),
      transform: [{ scale: interpolate(dot3.value, [0, 1], [0.8, 1.2]) }],
    }));

    return (
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, dot1Style]} />
        <Animated.View style={[styles.dot, dot2Style]} />
        <Animated.View style={[styles.dot, dot3Style]} />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            <Text style={{ fontWeight: "bold" }}>Updating todo list</Text>...
          </Text>
          <LoadingAnimation />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.header}>
            <MaterialIcons
              name="error-outline"
              size={20}
              color={Color.destructive}
            />
            <Text style={styles.todoTitle}>Error</Text>
          </View>
          <Text style={styles.messageText}>{error}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.retryButton]}
              onPress={processTodoAction}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!todoData) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "queue":
        return "schedule";
      case "executing":
        return "play-circle";
      case "completed":
        return "check-circle";
      case "error":
        return "error";
      default:
        return "help-outline";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.todoCard}>
        <View style={styles.header}>
          <MaterialIcons
            name="assignment"
            size={20}
            color={Color.cardForeground}
          />
          <Text style={styles.todoTitle}>
            {todoData.listName || "Todo List"}
          </Text>
        </View>

        <ScrollView
          style={styles.todosContainer}
          showsVerticalScrollIndicator={false}
        >
          {todoData.todos.length > 0 ? (
            todoData.todos.map((todo: any) => (
              <View key={todo.id} style={styles.todoItem}>
                <View style={styles.todoHeader}>
                  <View style={styles.todoInfo}>
                    <MaterialIcons
                      name={getStatusIcon(todo.status)}
                      size={20}
                      color={todo.status === "error" ? "#dc2626" : "#000000"}
                      style={styles.statusIcon}
                    />
                    <Text
                      style={[
                        styles.todoText,
                        todo.status === "completed" && styles.completedTodo,
                      ]}
                      numberOfLines={2}
                    >
                      {todo.name}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="assignment"
                size={32}
                color={Color.mutedForeground}
              />
              <Text style={styles.emptyText}>No todos found</Text>
              <Text style={styles.emptySubtext}>
                {todoData.listDescription ||
                  "Create your first todo to get started"}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

TodoListTool.displayName = "todo_list";
export default TodoListTool;

const createStyles = () => {
  const cardWidth = getCardWidth();

  return StyleSheet.create({
    container: {
      marginVertical: 8,
    },
    errorContainer: {
      width: cardWidth,
      padding: 16,
      backgroundColor: Color.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Color.destructive,
      alignItems: "center",
      shadowColor: Color.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    errorText: {
      fontSize: 14,
      color: Color.destructive,
      textAlign: "center",
    },
    todoCard: {
      width: cardWidth,
      backgroundColor: Color.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: Color.border,
      shadowColor: Color.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      gap: 8,
    },
    todoTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: Color.cardForeground,
    },
    messageText: {
      fontSize: 14,
      color: Color.mutedForeground,
      marginBottom: 16,
      lineHeight: 20,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: "center",
    },
    retryButton: {
      backgroundColor: Color.destructive,
    },
    retryText: {
      fontSize: 14,
      fontWeight: "600",
      color: Color.primaryForeground,
    },
    todosContainer: {
      maxHeight: 300,
    },
    todoItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Color.border,
    },
    todoHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 6,
    },
    todoInfo: {
      flexDirection: "row",
      alignItems: "flex-start",
      flex: 1,
    },
    statusIcon: {
      marginRight: 8,
      marginTop: 2,
    },
    todoText: {
      fontSize: 14,
      color: Color.cardForeground,
      flex: 1,
      lineHeight: 20,
    },
    completedTodo: {
      textDecorationLine: "line-through",
      color: Color.mutedForeground,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 32,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: "600",
      color: Color.mutedForeground,
      marginTop: 12,
      marginBottom: 4,
    },
    emptySubtext: {
      fontSize: 14,
      color: Color.mutedForeground,
      textAlign: "center",
      lineHeight: 20,
    },
    loadingContainer: {
      width: cardWidth,
      gap: 10,
      padding: 16,
      backgroundColor: "#f8f9fa",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#e2e8f0",
    },
    loadingText: {
      fontSize: 14,
      color: "#6b7280",
    },
    loadingAnimation: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    dotsContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#000000",
    },
  });
};
