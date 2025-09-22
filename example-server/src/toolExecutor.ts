import { isValidToolCall } from "../utils/toolUtils";
import { docSearchTool } from "./tools/docSearchTool";
import { todolistTool } from "./tools/todolistTool";
import { websearchTool } from "./tools/websearchTool";

export interface Tool {
  name: string;
  args: any;
}

const executeTool = (tool: Tool) => {
  if (isValidToolCall(tool)) {
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
  }
};

export { executeTool };
