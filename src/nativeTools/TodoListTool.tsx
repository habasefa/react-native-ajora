import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { ToolRequest, ToolResponse } from "../Tool/types";
import { UserEvent } from "../api";
import Color from "../Color";
import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";
import LoadingAnimation from "../LoadingAnimation";

// Get responsive card width (90% of screen width, max 400px, min 280px)
const getCardWidth = () => {
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth * 0.9;
  return Math.min(Math.max(cardWidth, 280), 400);
};

interface TodoListToolProps {
  request: ToolRequest;
  onResponse?: (response: ToolResponse) => void;
  submitQuery?: (query: UserEvent) => Promise<void>;
}

const TodoListTool: React.FC<TodoListToolProps> = ({
  request,
  submitQuery: _submitQuery,
}) => {
  const [todoData, setTodoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastCompletedTodo, setLastCompletedTodo] = useState<any>(null);
  const [nextPendingTodo, setNextPendingTodo] = useState<any>(null);
  const styles = createStyles();

  const { tool } = request;
  const { action = "get" } = tool.args || {};

  useEffect(() => {
    if (request?.tool.name === "todo_list") {
      // Use response data from the merged functionCall
      if (request.tool.response) {
        const responseData = request.tool.response;

        // Handle the new response format with output and error fields
        if (responseData.error) {
          setError(responseData.error);
          setLoading(false);
          return;
        }

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
        } else if (Array.isArray(responseData.output)) {
          // Fallback: If output is directly an array of todo lists, use the first one
          const todoList = responseData.output[0];
          if (todoList) {
            todoData = {
              action: action,
              todos: todoList.todos || [],
              totalTodos: todoList.todos?.length || 0,
              queueTodos:
                todoList.todos?.filter((todo: any) => todo.status === "queue")
                  .length || 0,
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
        } else if (responseData.output && responseData.output.todos) {
          // Fallback: If output is a single todo list object
          todoData = {
            action: action,
            todos: responseData.output.todos || [],
            totalTodos: responseData.output.todos?.length || 0,
            queueTodos:
              responseData.output.todos?.filter(
                (todo: any) => todo.status === "queue"
              ).length || 0,
            completedTodos:
              responseData.output.todos?.filter(
                (todo: any) => todo.status === "completed"
              ).length || 0,
            errorTodos:
              responseData.output.todos?.filter(
                (todo: any) => todo.status === "error"
              ).length || 0,
            listName: responseData.output.name || "Todo List",
            listDescription: responseData.output.description || "",
          };
        } else {
          // Handle error or empty response
          todoData = {
            action: action,
            todos: [],
            totalTodos: 0,
            queueTodos: 0,
            completedTodos: 0,
            errorTodos: 0,
            listName: "Todo List",
            listDescription: "No todos found",
          };
        }

        setTodoData(todoData);
        setLoading(false);
        setError(null);

        // Track the last completed todo and next pending todo
        if (todoData && todoData.todos) {
          const completedTodos = todoData.todos.filter(
            (todo: any) => todo.status === "completed"
          );
          const pendingTodos = todoData.todos.filter(
            (todo: any) => todo.status === "queue"
          );

          // Set the last completed todo
          if (completedTodos.length > 0) {
            const lastCompleted = completedTodos[completedTodos.length - 1];
            setLastCompletedTodo(lastCompleted);
          } else {
            setLastCompletedTodo(null);
          }

          // Set the next pending todo (first one in queue)
          if (pendingTodos.length > 0) {
            setNextPendingTodo(pendingTodos[0]);
          } else {
            setNextPendingTodo(null);
          }
        }

        // Auto-collapse if there are completed todos
        if (todoData && todoData.completedTodos > 0) {
          setIsCollapsed(true);
        }
      } else {
        setLoading(true);
        setError(null);
      }
    }
  }, [request, action]);

  if (!request) {
    return (
      <View style={styles.container}>
        <Text
          style={{
            fontSize: 14,
            color: Color.destructive,
            textAlign: "center",
          }}
        >
          No todo list data provided
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            <Text style={{ fontWeight: "bold" }}>Updating todo list</Text>...
          </Text>
          <LoadingAnimation containerStyle={styles.loadingAnimation} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.collapsedCard,
            { flexDirection: "row", alignItems: "center", gap: 8 },
          ]}
        >
          <View style={styles.collapsedHeader}>
            <MaterialIcons
              name="format-list-bulleted"
              size={20}
              color={Color.cardForeground}
            />
          </View>
          <View style={styles.collapsedProgress}>
            <Text style={styles.errorMessage}>
              The model messed up something while updating the todo list
            </Text>
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
        return "radio-button-unchecked";
      case "completed":
        return "check-circle";
      case "error":
        return "error";
      default:
        return "help-outline";
    }
  };

  // Collapsed UI component
  const CollapsedView = () => {
    return (
      <TouchableOpacity
        style={styles.collapsedCard}
        onPress={() => setIsCollapsed(false)}
        activeOpacity={0.7}
      >
        <View style={styles.collapsedHeader}>
          <MaterialIcons
            name="checklist"
            size={20}
            color={Color.cardForeground}
          />
          <Text style={styles.collapsedTitle}>
            {todoData.listName || "Todo List"}
          </Text>
          <MaterialIcons
            name="expand-more"
            size={20}
            color={Color.mutedForeground}
          />
        </View>
        <View style={styles.collapsedProgress}>
          {lastCompletedTodo && (
            <View style={styles.todoItem}>
              <View style={styles.todoHeader}>
                <View style={styles.todoInfo}>
                  <MaterialIcons
                    name={getStatusIcon(lastCompletedTodo.status)}
                    size={20}
                    color={
                      lastCompletedTodo.status === "error"
                        ? "#dc2626"
                        : "#000000"
                    }
                    style={styles.statusIcon}
                  />
                  <Text
                    style={[
                      styles.todoText,
                      lastCompletedTodo.status === "completed" &&
                        styles.completedTodo,
                    ]}
                    numberOfLines={1}
                  >
                    {lastCompletedTodo.name}
                  </Text>
                </View>
              </View>
            </View>
          )}
          {nextPendingTodo && (
            <View style={styles.todoItem}>
              <View style={styles.todoHeader}>
                <View style={styles.todoInfo}>
                  <MaterialIcons
                    name={getStatusIcon(nextPendingTodo.status)}
                    size={20}
                    color={
                      nextPendingTodo.status === "error" ? "#dc2626" : "#000000"
                    }
                    style={styles.statusIcon}
                  />
                  <Text
                    style={[
                      styles.todoText,
                      nextPendingTodo.status === "completed" &&
                        styles.completedTodo,
                    ]}
                    numberOfLines={1}
                  >
                    {nextPendingTodo.name}
                  </Text>
                </View>
              </View>
            </View>
          )}
          <Text style={styles.collapsedProgressText}>
            {todoData.completedTodos} of {todoData.totalTodos} Done
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Expanded UI component
  const ExpandedView = () => (
    <View style={styles.todoCard}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsCollapsed(true)}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name="checklist"
          size={20}
          color={Color.cardForeground}
        />
        <Text style={styles.todoTitle}>{todoData.listName || "Todo List"}</Text>
        <MaterialIcons
          name="expand-less"
          size={20}
          color={Color.mutedForeground}
        />
      </TouchableOpacity>

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
              name="checklist"
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
  );

  return (
    <View style={styles.container}>
      {isCollapsed ? <CollapsedView /> : <ExpandedView />}
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
    collapsedCard: {
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
    collapsedHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    collapsedTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: Color.cardForeground,
      flex: 1,
    },
    collapsedProgress: {
      marginTop: 8,
    },
    collapsedProgressText: {
      fontSize: 12,
      color: Color.mutedForeground,
      fontWeight: "500",
      fontStyle: "italic",
    },
    errorMessage: {
      fontSize: 14,
      color: Color.mutedForeground,
      fontStyle: "italic",
    },
    todoTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: Color.cardForeground,
    },
    todosContainer: {
      maxHeight: 300,
    },
    todoItem: {
      paddingVertical: 6,
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
      marginTop: 8,
    },
  });
};
