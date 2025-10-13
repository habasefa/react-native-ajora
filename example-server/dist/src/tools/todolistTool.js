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
exports.todolistTool = todolistTool;
function todolistTool(args, todoListService, thread_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!todoListService) {
                throw new Error("TodoListService is not initialized. Please provide a TodoListService instance.");
            }
            if (!thread_id) {
                throw new Error("Thread ID is not provided. Please provide a thread ID.");
            }
            const result = yield todoListService.execute(Object.assign({ action: args.action }, args), args, thread_id);
            // Return the result directly since TodoListService already returns ToolResult
            return result;
        }
        catch (error) {
            return { output: null, error: error };
        }
    });
}
