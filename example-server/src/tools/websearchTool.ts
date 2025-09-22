import { WebSearchService } from "../services/webSearchService";

async function websearchTool(query: string) {
  const webSearchService = new WebSearchService();
  return webSearchService.searchWeb(query);
}

export { websearchTool };
