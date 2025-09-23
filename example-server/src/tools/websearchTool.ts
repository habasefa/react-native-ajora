import { WebSearchService } from "../services/webSearchService";

async function websearchTool(args: any) {
  const webSearchService = new WebSearchService();
  // toolsDeclaration defines { query: string[] }, but service expects a single string
  const queryArg = Array.isArray(args?.query)
    ? args.query.join(" ")
    : (args?.query ?? String(args));
  return webSearchService.searchWeb(queryArg);
}

export { websearchTool };
