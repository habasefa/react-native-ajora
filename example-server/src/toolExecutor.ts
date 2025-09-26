import { FunctionCall } from "@google/genai";
import { docSearchTool } from "./tools/docSearchTool";
import { todolistTool } from "./tools/todolistTool";
import { websearchTool } from "./tools/websearchTool";
import { TodoListService } from "./services/todoService";

const executeTool = async (
  tool: FunctionCall,
  thread_id: string,
  todoListService?: TodoListService
) => {
  try {
    let result = null;
    switch (tool.name) {
      case "search_web":
        return websearchTool(tool.args);
      case "search_document":
        return docSearchTool(tool.args);
      case "todo_list":
        if (!todoListService) {
          throw new Error(
            "TodoListService is not initialized. Please provide a TodoListService instance."
          );
        }
        if (!thread_id) {
          throw new Error(
            "Thread ID is not provided. Please provide a thread ID."
          );
        }
        return await todolistTool(tool.args, todoListService, thread_id);
    }
    return result;
  } catch (error) {
    console.error("Error executing tool:", error);
    throw error;
  }
};

export { executeTool };
