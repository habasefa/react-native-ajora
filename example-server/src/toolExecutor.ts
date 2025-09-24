import { FunctionCall } from "@google/genai";
import { isValidToolCall } from "../utils/toolUtils";
import { docSearchTool } from "./tools/docSearchTool";
import { todolistTool } from "./tools/todolistTool";
import { websearchTool } from "./tools/websearchTool";

const executeTool = (tool: FunctionCall) => {
  try {
    let result = null;
    switch (tool.name) {
      case "search_web":
        return websearchTool(tool.args);
      case "search_document":
        return docSearchTool(tool.args);
      case "todo_list":
        return todolistTool(tool.args);
    }
    return result;
  } catch (error) {
    console.error("Error executing tool:", error);
    throw error;
    return {};
  }
};

export { executeTool };
