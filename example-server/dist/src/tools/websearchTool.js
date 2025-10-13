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
Object.defineProperty(exports, "__esModule", { value: true });
exports.websearchTool = websearchTool;
const webSearchService_1 = require("../services/webSearchService");
function websearchTool(args) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const webSearchService = new webSearchService_1.WebSearchService();
            const queryArg = args.query;
            if (!queryArg) {
                throw new Error("Query is required");
            }
            return webSearchService.searchWeb(queryArg);
        }
        catch (error) {
            console.error("Error searching web:", error);
            return { output: null, error: error };
        }
    });
}
