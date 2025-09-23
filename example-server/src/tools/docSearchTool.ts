import { DocSearchService } from "../services/docSearchService";

async function docSearchTool(args: any) {
  const docSearchService = new DocSearchService();
  //   vectorize the pdf
  return await docSearchService.searchPdf(args);
}

export { docSearchTool };
