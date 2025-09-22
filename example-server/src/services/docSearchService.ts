import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OllamaEmbeddings } from "@langchain/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import fs from "fs";

const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text:latest",
  baseUrl: "http://localhost:11434",
});

const introToHumanNutritionPdfPath =
  "/home/habtamu-asefa/development/react-native-ajora/example-server/books/intro_to_human_nutrition.pdf";

const INDEX_DIR =
  "/home/habtamu-asefa/development/react-native-ajora/example-server/books/faiss_index";

class DocSearchService {
  private vectorStore: FaissStore | null = null;
  private initPromise: Promise<FaissStore> | null = null;

  private ensureIndexDir() {
    if (!fs.existsSync(INDEX_DIR)) {
      fs.mkdirSync(INDEX_DIR, { recursive: true });
    }
  }

  private async buildAndPersistIndex(): Promise<FaissStore> {
    console.info("Partitioning PDF...");
    const docs = await new PDFLoader(introToHumanNutritionPdfPath).load();
    console.info("PDF partitioned successfully");

    console.info("Chunking PDF...");
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 100,
    });
    const chunkedDocs = await splitter.splitDocuments(docs);

    console.info(`Vectorizing PDF... (chunks: ${chunkedDocs.length})`);

    // Process in smaller batches to avoid overwhelming Ollama
    const BATCH_SIZE = 50;
    const store = new FaissStore(embeddings, {});

    for (let i = 0; i < chunkedDocs.length; i += BATCH_SIZE) {
      const batch = chunkedDocs.slice(i, i + BATCH_SIZE);
      console.info(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunkedDocs.length / BATCH_SIZE)} (${batch.length} chunks)`
      );

      try {
        await store.addDocuments(batch, {
          ids: batch.map((_, idx) => `chunk_${i + idx}`),
        });
        // Add small delay between batches to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
          error
        );
        // Retry the batch once
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await store.addDocuments(batch, {
            ids: batch.map((_, idx) => `chunk_${i + idx}`),
          });
        } catch (retryError) {
          console.error(
            `Retry failed for batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
            retryError
          );
          throw retryError;
        }
      }
    }

    this.ensureIndexDir();
    await store.save(INDEX_DIR);
    console.info(`PDF vectorized and index saved successfully at ${INDEX_DIR}`);
    return store;
  }

  private async loadOrCreateIndex(): Promise<FaissStore> {
    this.ensureIndexDir();

    // Allow forcing a rebuild via env var
    const forceRebuild = process.env.REBUILD_FAISS === "1";
    if (forceRebuild) {
      console.info("REBUILD_FAISS=1 detected → rebuilding FAISS index...");
      return this.buildAndPersistIndex();
    }

    // Prefer loading; if it fails, build
    try {
      console.info(`Attempting to load FAISS index from ${INDEX_DIR}...`);
      const store = await FaissStore.load(INDEX_DIR, embeddings);
      console.info("FAISS index loaded successfully");
      return store;
    } catch (e) {
      console.warn(
        `Failed to load FAISS index from ${INDEX_DIR}. Will rebuild. Reason:`,
        e
      );
      return this.buildAndPersistIndex();
    }
  }

  private async init(): Promise<FaissStore> {
    if (!this.initPromise) {
      this.initPromise = this.loadOrCreateIndex().then((store) => {
        this.vectorStore = store;
        return store;
      });
    }
    return this.initPromise;
  }

  async searchPdf(query: string) {
    if (query.trim() === "") {
      throw new Error("Query is required");
    }
    const store = this.vectorStore ?? (await this.init());
    console.info("Searching PDF...");
    const results = await store.similaritySearch(query);
    console.info("PDF searched successfully " + results.length);
    return results;
  }
}

export { DocSearchService };
