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
exports.executeTool = void 0;
const docSearchTool_1 = require("./tools/docSearchTool");
const todolistTool_1 = require("./tools/todolistTool");
const websearchTool_1 = require("./tools/websearchTool");
const executeTool = (tool, thread_id, todoListService) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        switch (tool.name) {
            case "search_web":
                return (0, websearchTool_1.websearchTool)(tool.args);
            case "search_document":
                return (0, docSearchTool_1.docSearchTool)(tool.args);
            case "todo_list":
                return yield (0, todolistTool_1.todolistTool)(tool.args, todoListService, thread_id);
            default:
                throw new Error("Invalid tool name");
        }
    }
    catch (error) {
        console.error("Error executing tool:", error);
        return { output: null, error: error };
    }
});
exports.executeTool = executeTool;
