import { DocSearchService } from "../services/docSearchService";
import { ToolResult } from "../toolExecutor";

async function docSearchTool(args: any): Promise<ToolResult> {
  console.log("docSearchTool args", args);
  try {
    const docSearchService = new DocSearchService();
    const queryArg = args.query;
    if (!queryArg) {
      throw new Error("Query is required");
    }
    // Normalize to a single string in case the model passed an array
    const queryString = Array.isArray(queryArg)
      ? queryArg.filter(Boolean).join(" ")
      : String(queryArg);
    return await docSearchService.searchPdf(queryString);
  } catch (error) {
    console.error("Error searching PDF:", error);
    return { output: null, error: error };
  }
}

export { docSearchTool };
