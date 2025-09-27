import { DocSearchService } from "../services/docSearchService";
import { ToolResult } from "../toolExecutor";

async function docSearchTool(args: any): Promise<ToolResult> {
  try {
    const queryArg = args.query;
    if (!queryArg) {
      throw new Error("Query is required");
    }
    const docSearchService = new DocSearchService();
    return await docSearchService.searchPdf(queryArg);
  } catch (error) {
    console.error("Error searching PDF:", error);
    return { output: null, error: error };
  }
}

export { docSearchTool };
