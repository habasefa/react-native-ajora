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
exports.WebSearchService = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class WebSearchService {
    constructor() {
        this.apiKey = process.env.BRAVE_API_KEY || "";
        if (!this.apiKey) {
            throw new Error("BRAVE_API_KEY is not set. Create .env and set BRAVE_API_KEY.");
        }
        this.apiUrl = "https://api.search.brave.com/res/v1/web/search";
    }
    searchWeb(query) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info("Searching web:", query);
            try {
                const response = yield fetch(`${this.apiUrl}?q=${encodeURIComponent(query)}&count=5`, {
                    headers: {
                        Accept: "application/json",
                        "Accept-Encoding": "gzip",
                        "X-Subscription-Token": this.apiKey,
                    },
                });
                if (!response.ok) {
                    const body = yield response.text();
                    throw new Error(`${response.status} ${response.statusText}: ${body}`);
                }
                const data = yield response.json();
                const formattedData = data.web.results.map((result) => ({
                    title: result.title,
                    url: result.url,
                    description: result.description,
                    profile: {
                        name: result.profile.name,
                        url: result.profile.url,
                        long_name: result.profile.long_name,
                        img: result.profile.img,
                    },
                }));
                return { output: formattedData, error: null };
            }
            catch (error) {
                console.error("Error searching web:", error);
                return { output: null, error: error };
            }
        });
    }
}
exports.WebSearchService = WebSearchService;
