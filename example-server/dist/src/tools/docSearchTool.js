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
exports.docSearchTool = docSearchTool;
const docSearchService_1 = require("../services/docSearchService");
function docSearchTool(args) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("docSearchTool args", args);
        try {
            const docSearchService = new docSearchService_1.DocSearchService();
            const queryArg = args.query;
            if (!queryArg) {
                throw new Error("Query is required");
            }
            // Normalize to a single string in case the model passed an array
            const queryString = Array.isArray(queryArg)
                ? queryArg.filter(Boolean).join(" ")
                : String(queryArg);
            return yield docSearchService.searchPdf(queryString);
        }
        catch (error) {
            console.error("Error searching PDF:", error);
            return { output: null, error: error };
        }
    });
}
