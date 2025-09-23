import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { ToolRequest, ToolResponse } from "../Tool/types";

interface TodoListToolProps {
  request: ToolRequest;
  onResponse?: (response: ToolResponse) => void;
}

const TodoListTool: React.FC<TodoListToolProps> = ({ request, onResponse }) => {
  const [todoData, setTodoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { tool } = request;
  const { todo = [] } = tool.args || {};

  const processTodoAction = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call - in real implementation, you'd call an actual todo API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock todo list data
      const mockTodoData = {
        action: todo[0] || "get",
        todos: [
          {
            id: 1,
            text: "Plan weekly meal prep",
            completed: false,
            priority: "high",
            category: "meal planning",
          },
          {
            id: 2,
            text: "Research nutrition guidelines",
            completed: true,
            priority: "medium",
            category: "research",
          },
          {
            id: 3,
            text: "Create shopping list",
            completed: false,
            priority: "high",
            category: "shopping",
          },
          {
            id: 4,
            text: "Review dietary restrictions",
            completed: false,
            priority: "low",
            category: "planning",
          },
        ],
        totalTodos: 4,
        completedTodos: 1,
        pendingTodos: 3,
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
  }, [todo, request, onResponse]);

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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Processing todo list action...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={processTodoAction}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
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
        return "🔴";
      case "medium":
        return "🟡";
      case "low":
        return "🟢";
      default:
        return "⚪";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.todoCard}>
        <View style={styles.header}>
          <Text style={styles.todoIcon}>📝</Text>
          <Text style={styles.todoTitle}>Todo List</Text>
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
          {todoData.todos.map((todo: any, index: number) => (
            <View key={todo.id} style={styles.todoItem}>
              <View style={styles.todoHeader}>
                <View style={styles.todoInfo}>
                  <Text style={styles.priorityIcon}>
                    {getPriorityIcon(todo.priority)}
                  </Text>
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
                    <Text style={styles.completedIcon}>✅</Text>
                  ) : (
                    <Text style={styles.pendingIcon}>⏳</Text>
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

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  errorContainer: {
    padding: 16,
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    alignItems: "center",
  },
  errorIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#dc2626",
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#dc2626",
    borderRadius: 6,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  todoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
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
    marginBottom: 16,
  },
  todoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  todosContainer: {
    maxHeight: 200,
  },
  todoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
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
    fontSize: 12,
    marginRight: 8,
    marginTop: 2,
  },
  todoText: {
    fontSize: 14,
    color: "#1f2937",
    flex: 1,
    lineHeight: 20,
  },
  completedTodo: {
    textDecorationLine: "line-through",
    color: "#6b7280",
  },
  todoStatus: {
    marginLeft: 8,
  },
  completedIcon: {
    fontSize: 16,
  },
  pendingIcon: {
    fontSize: 16,
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
    color: "#6b7280",
    textTransform: "capitalize",
  },
});
