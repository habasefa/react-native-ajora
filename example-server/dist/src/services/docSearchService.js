"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocSearchService = void 0;
const pdf_1 = require("@langchain/community/document_loaders/fs/pdf");
const ollama_1 = require("@langchain/ollama");
const faiss_1 = require("@langchain/community/vectorstores/faiss");
const textsplitters_1 = require("@langchain/textsplitters");
const fs_1 = __importDefault(require("fs"));
const embeddings = new ollama_1.OllamaEmbeddings({
    model: "nomic-embed-text:latest",
    baseUrl: "http://localhost:11434",
});
const introToHumanNutritionPdfPath = "/home/habtamu-asefa/development/react-native-ajora/example-server/books/intro_to_human_nutrition.pdf";
const INDEX_DIR = "/home/habtamu-asefa/development/react-native-ajora/example-server/books/faiss_index";
class DocSearchService {
    constructor() {
        this.vectorStore = null;
        this.initPromise = null;
    }
    ensureIndexDir() {
        if (!fs_1.default.existsSync(INDEX_DIR)) {
            fs_1.default.mkdirSync(INDEX_DIR, { recursive: true });
        }
    }
    buildAndPersistIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            console.info("Partitioning PDF...");
            const docs = yield new pdf_1.PDFLoader(introToHumanNutritionPdfPath).load();
            console.info("PDF partitioned successfully");
            console.info("Chunking PDF...");
            const splitter = new textsplitters_1.RecursiveCharacterTextSplitter({
                chunkSize: 800,
                chunkOverlap: 100,
            });
            const chunkedDocs = yield splitter.splitDocuments(docs);
            console.info(`Vectorizing PDF... (chunks: ${chunkedDocs.length})`);
            // Process in smaller batches to avoid overwhelming Ollama
            const BATCH_SIZE = 50;
            const store = new faiss_1.FaissStore(embeddings, {});
            for (let i = 0; i < chunkedDocs.length; i += BATCH_SIZE) {
                const batch = chunkedDocs.slice(i, i + BATCH_SIZE);
                console.info(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunkedDocs.length / BATCH_SIZE)} (${batch.length} chunks)`);
                try {
                    yield store.addDocuments(batch, {
                        ids: batch.map((_, idx) => `chunk_${i + idx}`),
                    });
                    // Add small delay between batches to avoid overwhelming the server
                    yield new Promise((resolve) => setTimeout(resolve, 100));
                }
                catch (error) {
                    console.error(`Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
                    // Retry the batch once
                    try {
                        yield new Promise((resolve) => setTimeout(resolve, 1000));
                        yield store.addDocuments(batch, {
                            ids: batch.map((_, idx) => `chunk_${i + idx}`),
                        });
                    }
                    catch (retryError) {
                        console.error(`Retry failed for batch ${Math.floor(i / BATCH_SIZE) + 1}:`, retryError);
                        throw retryError;
                    }
                }
            }
            this.ensureIndexDir();
            yield store.save(INDEX_DIR);
            console.info(`PDF vectorized and index saved successfully at ${INDEX_DIR}`);
            return store;
        });
    }
    loadOrCreateIndex() {
        return __awaiter(this, void 0, void 0, function* () {
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
                const store = yield faiss_1.FaissStore.load(INDEX_DIR, embeddings);
                console.info("FAISS index loaded successfully");
                return store;
            }
            catch (e) {
                console.warn(`Failed to load FAISS index from ${INDEX_DIR}. Will rebuild. Reason:`, e);
                return this.buildAndPersistIndex();
            }
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.initPromise) {
                this.initPromise = this.loadOrCreateIndex().then((store) => {
                    this.vectorStore = store;
                    return store;
                });
            }
            return this.initPromise;
        });
    }
    searchPdf(query) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Coerce to string and validate
                const queryString = Array.isArray(query)
                    ? query.filter(Boolean).join(" ")
                    : String(query !== null && query !== void 0 ? query : "");
                if (queryString.trim() === "") {
                    throw new Error("Query is required");
                }
                const store = (_a = this.vectorStore) !== null && _a !== void 0 ? _a : (yield this.init());
                console.info("Searching PDF...");
                const results = yield store.similaritySearch(queryString);
                console.info("PDF searched successfully " + results.length);
                return { output: results, error: null };
            }
            catch (error) {
                console.error("Error searching PDF:", error);
                return { output: null, error: error };
            }
        });
    }
}
exports.DocSearchService = DocSearchService;
