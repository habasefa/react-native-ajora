import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { ToolRequest, ToolResponse } from "../Tool/types";
import Color from "../Color";
import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";

// Get responsive card width (80% of screen width, max 400px, min 280px)
const getCardWidth = () => {
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth * 0.8;
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
      // Simulate API call - in real implementation, this would be handled by the server
      await new Promise((resolve) => setTimeout(resolve, 500));

      // For now, we'll use mock data that matches the expected schema
      // In production, this would come from the actual API response
      const mockTodoData = {
        action: action,
        todos: [
          {
            id: "1",
            text: "Plan weekly meal prep",
            completed: false,
            priority: "high",
            category: "meal planning",
          },
          {
            id: "2",
            text: "Research nutrition guidelines",
            completed: true,
            priority: "medium",
            category: "research",
          },
          {
            id: "3",
            text: "Create shopping list",
            completed: false,
            priority: "high",
            category: "shopping",
          },
          {
            id: "4",
            text: "Review dietary restrictions",
            completed: false,
            priority: "low",
            category: "planning",
          },
        ],
        totalTodos: 4,
        completedTodos: 1,
        pendingTodos: 3,
        listName: "My Todo List",
        listDescription: "Default todo list for managing tasks",
      };

      setTodoData(mockTodoData);

      // Send response back
      if (onResponse && request) {
        onResponse({
          callId: request.callId,
          response: mockTodoData,
        });
      }
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
        setTodoData(request.tool.response);
        setLoading(false);
      } else {
        setLoading(true);
        setError(null);
      }
    }
  }, [request]);

  if (!request) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No request provided</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.todoCard}>
          <View style={styles.header}>
            <ActivityIndicator size="small" color={Color.primary} />
            <Text style={styles.todoTitle}>Processing...</Text>
          </View>
          <Text style={styles.messageText}>
            Please wait while we process your todo list action.
          </Text>
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#dc2626";
      case "medium":
        return "#d97706";
      case "low":
        return "#059669";
      default:
        return "#6b7280";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return "keyboard-arrow-up";
      case "medium":
        return "remove";
      case "low":
        return "keyboard-arrow-down";
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

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{todoData.totalTodos}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#059669" }]}>
              {todoData.completedTodos}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#d97706" }]}>
              {todoData.pendingTodos}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <ScrollView
          style={styles.todosContainer}
          showsVerticalScrollIndicator={false}
        >
          {todoData.todos.map((todo: any) => (
            <View key={todo.id} style={styles.todoItem}>
              <View style={styles.todoHeader}>
                <View style={styles.todoInfo}>
                  <MaterialIcons
                    name={getPriorityIcon(todo.priority)}
                    size={16}
                    color={getPriorityColor(todo.priority)}
                    style={styles.priorityIcon}
                  />
                  <Text
                    style={[
                      styles.todoText,
                      todo.completed && styles.completedTodo,
                    ]}
                    numberOfLines={2}
                  >
                    {todo.text}
                  </Text>
                </View>
                <View style={styles.todoStatus}>
                  {todo.completed ? (
                    <MaterialIcons
                      name="check-circle"
                      size={20}
                      color={Color.primary}
                    />
                  ) : (
                    <MaterialIcons
                      name="radio-button-unchecked"
                      size={20}
                      color={Color.mutedForeground}
                    />
                  )}
                </View>
              </View>
              <View style={styles.todoMeta}>
                <Text
                  style={[
                    styles.priorityText,
                    { color: getPriorityColor(todo.priority) },
                  ]}
                >
                  {todo.priority.toUpperCase()}
                </Text>
                <Text style={styles.categoryText}>{todo.category}</Text>
              </View>
            </View>
          ))}
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
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 16,
      paddingVertical: 12,
      backgroundColor: Color.secondary,
      borderRadius: 8,
    },
    statItem: {
      alignItems: "center",
    },
    statNumber: {
      fontSize: 20,
      fontWeight: "700",
      color: Color.cardForeground,
    },
    statLabel: {
      fontSize: 12,
      color: Color.mutedForeground,
      marginTop: 2,
    },
    todosContainer: {
      maxHeight: 200,
    },
    todoItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Color.border,
    },
    todoHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 6,
    },
    todoInfo: {
      flexDirection: "row",
      alignItems: "flex-start",
      flex: 1,
    },
    priorityIcon: {
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
    todoStatus: {
      marginLeft: 8,
    },
    todoMeta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    priorityText: {
      fontSize: 11,
      fontWeight: "600",
    },
    categoryText: {
      fontSize: 11,
      color: Color.mutedForeground,
      textTransform: "capitalize",
    },
  });
};
