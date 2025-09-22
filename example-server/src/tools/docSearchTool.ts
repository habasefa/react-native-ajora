import { DocSearchService } from "../services/docSearchService";

async function docSearchTool(query: string) {
  const docSearchService = new DocSearchService();
  //   vectorize the pdf
  return await docSearchService.searchPdf(query);
}

export { docSearchTool };
