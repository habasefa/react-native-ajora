import { WebSearchService } from "../services/webSearchService";
import { ToolResult } from "../toolExecutor";

async function websearchTool(args: any): Promise<ToolResult> {
  try {
    const webSearchService = new WebSearchService();
    const queryArg = args.query;
    if (!queryArg) {
      throw new Error("Query is required");
    }
    return webSearchService.searchWeb(queryArg);
  } catch (error) {
    console.error("Error searching web:", error);
    return { output: null, error: error };
  }
}

export { websearchTool };
