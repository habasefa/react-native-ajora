import { FunctionCall } from "@google/genai";
import { docSearchTool } from "./tools/docSearchTool";
import { todolistTool } from "./tools/todolistTool";
import { websearchTool } from "./tools/websearchTool";
import { TodoListService } from "./services/todoService";

export interface ToolResult {
  output: any;
  error: any;
}

const executeTool = async (
  tool: FunctionCall,
  thread_id: string,
  todoListService: TodoListService
): Promise<ToolResult> => {
  try {
    switch (tool.name) {
      case "search_web":
        return websearchTool(tool.args);
      case "search_document":
        return docSearchTool(tool.args);
      case "todo_list":
        return await todolistTool(tool.args, todoListService, thread_id);
      default:
        throw new Error("Invalid tool name");
    }
  } catch (error) {
    console.error("Error executing tool:", error);
    return { output: null, error: error };
  }
};

export { executeTool };
