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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const agent_1 = require("./agent");
const gemini_1 = require("./gemini");
const dbService_1 = __importDefault(require("../db/dbService"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Initialize database
const dbService = new dbService_1.default();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Bearer token middleware - log the token passed to the server
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        console.log(`[Ajora:Server]: Bearer token received: ${token}`);
        req.bearerToken = token;
    }
    else {
        console.log("[Ajora:Server]: No bearer token provided");
    }
    next();
});
// Initialize database on startup
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield dbService.initialize();
        }
        catch (error) {
            console.error("[Ajora:Server]: Failed to initialize database:", error);
            process.exit(1);
        }
    });
}
// Streaming endpoint
app.get("/api/stream", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    console.log("[Ajora:Server]: Streaming request received", req.query);
    try {
        const { type, message, mode } = req.query;
        if (!message) {
            return res
                .status(400)
                .json({ error: "Message is required in user query" });
        }
        else if (!type) {
            return res.status(400).json({ error: "Type is required in user query" });
        }
        // Parse the message from JSON string
        let parsedMessage;
        try {
            parsedMessage = JSON.parse(message);
        }
        catch (parseError) {
            return res.status(400).json({ error: "Invalid message format" });
        }
        const query = {
            type: type,
            message: parsedMessage,
            mode: mode,
        };
        // Set headers for Server-Sent Events
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Cache-Control");
        // Set up cooperative abort. When client disconnects, abort downstream work.
        const abortController = new AbortController();
        const { signal } = abortController;
        // Flush headers to establish SSE before we begin streaming
        try {
            // @ts-ignore - not all types expose flushHeaders
            if (typeof res.flushHeaders === "function") {
                res.flushHeaders();
            }
        }
        catch (_d) { }
        // Use response close to detect actual stream closure
        res.on("close", () => {
            if (!signal.aborted)
                abortController.abort();
            try {
                res.end();
            }
            catch (_a) { }
        });
        const response = (0, agent_1.agent)(query, dbService, mode, signal);
        // Inform client that a new stream has started (isComplete=false)
        res.write(`data: ${JSON.stringify({ type: "complete", is_complete: false })}\n\n`);
        try {
            for (var _e = true, response_1 = __asyncValues(response), response_1_1; response_1_1 = yield response_1.next(), _a = response_1_1.done, !_a; _e = true) {
                _c = response_1_1.value;
                _e = false;
                const chunk = _c;
                if (signal.aborted)
                    break;
                // Stream chunk to client
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_e && !_a && (_b = response_1.return)) yield _b.call(response_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (signal.aborted) {
            try {
                res.end();
            }
            catch (_f) { }
            return;
        }
        // After streaming completes, compute and send updated thread title
        try {
            const historyForTitle = yield dbService.getMessages(parsedMessage.thread_id);
            // Count only user messages for more robust title updates
            const userMessages = historyForTitle.filter((msg) => msg.role === "user");
            const userMessageCount = userMessages.length;
            // Only update the title on the first user message or every 5 user messages
            if (userMessageCount === 1 || userMessageCount % 5 === 0) {
                // Only use the last 10 messages for the title
                const lastTenMessages = historyForTitle.slice(-10);
                if (signal.aborted) {
                    try {
                        res.end();
                    }
                    catch (_g) { }
                    return;
                }
                const title = yield (0, gemini_1.threadTitleUpdate)(lastTenMessages);
                if (title) {
                    yield dbService.updateThread(parsedMessage.thread_id, { title });
                    res.write(`data: ${JSON.stringify({ type: "thread_title", threadTitle: title })}\n\n`);
                }
            }
        }
        catch (e) {
            console.warn("[Ajora:Server]: Failed to update thread title:", e);
        }
        // Inform client that the stream completed normally (isComplete=true)
        res.write(`data: ${JSON.stringify({ type: "complete", is_complete: true })}\n\n`);
        res.end();
    }
    catch (error) {
        console.error("[Ajora:Server]: Error in streaming:", error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: "complete", is_complete: true })}\n\n`);
        res.end();
    }
}));
// Get conversation history
app.get("/api/threads", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const threads = yield dbService.getThreads();
        console.log("[Ajora:Server]: threads:", threads.length);
        res.json(threads);
    }
    catch (error) {
        console.error("[Ajora:Server]: Error getting threads:", error);
        res.status(500).json({ error: error.message });
    }
}));
// Get messages for a specific thread with pagination support
app.get("/api/threads/:threadId/messages", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { threadId } = req.params;
        const { limit, offset } = req.query;
        // Parse pagination parameters
        const limitNum = limit ? parseInt(limit, 10) : undefined;
        const offsetNum = offset ? parseInt(offset, 10) : undefined;
        // Get messages with pagination
        const messages = yield dbService.getMessages(threadId, limitNum, offsetNum);
        // Get total count for pagination metadata
        const totalCount = yield dbService.getMessagesCount(threadId);
        const response = {
            messages,
            pagination: {
                total: totalCount,
                limit: limitNum,
                offset: offsetNum || 0,
                hasMore: offsetNum !== undefined && limitNum !== undefined
                    ? offsetNum + limitNum < totalCount
                    : messages.length > 0,
            },
        };
        console.log(`[Ajora:Server]: Retrieved ${messages.length} messages for thread ${threadId} (${offsetNum || 0}-${(offsetNum || 0) + messages.length}/${totalCount})`);
        res.json(response);
    }
    catch (error) {
        console.error("[Ajora:Server]: Error getting messages:", error);
        res.status(500).json({ error: error.message });
    }
}));
// Create new thread
app.post("/api/threads", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const title = (_c = (_a = (req.body && req.body.title)) !== null && _a !== void 0 ? _a : (_b = req.query) === null || _b === void 0 ? void 0 : _b.title) !== null && _c !== void 0 ? _c : "New Conversation";
        const thread = yield dbService.addThread({
            title,
        });
        res.json(thread);
    }
    catch (error) {
        console.error("[Ajora:Server]: Error creating thread:", error);
        res.status(500).json({ error: error.message });
    }
}));
// Update thread title
app.put("/api/threads/:threadId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { threadId } = req.params;
        const { title } = req.body;
        const thread = yield dbService.updateThread(threadId, { title });
        if (!thread) {
            return res.status(404).json({ error: "Thread not found" });
        }
        res.json(thread);
    }
    catch (error) {
        console.error("[Ajora:Server]: Error updating thread:", error);
        res.status(500).json({ error: error.message });
    }
}));
// Delete thread
app.delete("/api/threads/:threadId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { threadId } = req.params;
        const deleted = yield dbService.deleteThread(threadId);
        if (!deleted) {
            return res.status(404).json({ error: "Thread not found" });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error("[Ajora:Server]: Error deleting thread:", error);
        res.status(500).json({ error: error.message });
    }
}));
// Delete message
app.delete("/api/messages/:messageId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { messageId } = req.params;
        const deleted = yield dbService.deleteMessage(messageId);
        if (!deleted) {
            return res.status(404).json({ error: "Message not found" });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error("[Ajora:Server]: Error deleting message:", error);
        res.status(500).json({ error: error.message });
    }
}));
// Start server
app.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    yield initializeDatabase();
    console.log(`[Ajora:Server]: AI Backend Server listening on port ${port}`);
    console.log(`Available endpoints:`);
    console.log(`  GET /api/stream - Streaming AI responses`);
    console.log(`  GET /api/threads - Get all conversation threads`);
    console.log(`  GET /api/threads/:threadId/messages - Get messages for a thread`);
    console.log(`  POST /api/threads - Create new conversation thread`);
    console.log(`  PUT /api/threads/:threadId - Update thread title`);
    console.log(`  DELETE /api/threads/:threadId - Delete thread`);
    console.log(`  DELETE /api/messages/:messageId - Delete message`);
}));
// Graceful shutdown
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("[Ajora:Server]: Shutting down gracefully...");
    yield dbService.close();
    process.exit(0);
}));
process.on("SIGTERM", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("[Ajora:Server]: Shutting down gracefully...");
    yield dbService.close();
    process.exit(0);
}));
exports.default = app;
