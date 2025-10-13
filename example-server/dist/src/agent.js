"use strict";
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agent = exports.serverTools = void 0;
const gemini_1 = require("./gemini");
const toolUtils_1 = require("../utils/toolUtils");
const toolExecutor_1 = require("./toolExecutor");
const todoService_1 = require("./services/todoService");
exports.serverTools = ["search_web", "search_document", "todo_list"];
const MAX_TURNS = 50;
const agent = function (query_1, dbService_1) {
    return __asyncGenerator(this, arguments, function* (query, dbService, mode = "agent", signal) {
        var _a, e_1, _b, _c;
        var _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        if (!query) {
            throw new Error("Query is required ");
        }
        // Track current thinking indicator state to avoid redundant toggles
        let isThinkingShown = false;
        if (signal === null || signal === void 0 ? void 0 : signal.aborted)
            return yield __await(void 0);
        yield yield __await({
            type: "is_thinking",
            is_thinking: true,
        });
        isThinkingShown = true;
        const { type, message } = query;
        // Initialize TodoListService with the database service
        const todoListService = new todoService_1.TodoListService(dbService);
        const thread_id = message.thread_id;
        let remainingTurns = MAX_TURNS;
        // Add the query to the history
        if (signal === null || signal === void 0 ? void 0 : signal.aborted)
            return yield __await(void 0);
        yield __await(dbService.addMessage(message));
        let history = yield __await(dbService.getMessages(thread_id));
        const turn = {
            turn_id: (0, toolUtils_1.generateId)(),
            messages: history,
        };
        try {
            // --- Handle incoming message ---
            const pendingFromHistory = (0, toolUtils_1.getPendingToolCall)(turn.messages);
            if (signal === null || signal === void 0 ? void 0 : signal.aborted)
                return yield __await(void 0);
            if (type === "function_response" && pendingFromHistory) {
                const { functionCall, originalMessage } = pendingFromHistory;
                const functionResponse = {
                    name: functionCall === null || functionCall === void 0 ? void 0 : functionCall.name,
                    response: (_f = (_e = (_d = message.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.functionResponse) === null || _f === void 0 ? void 0 : _f.response,
                };
                const updatedMessage = Object.assign(Object.assign({}, originalMessage), { parts: [...originalMessage.parts, { functionResponse }] });
                const idx = turn.messages.findIndex((m) => m._id === originalMessage._id);
                if (idx !== -1)
                    turn.messages[idx] = updatedMessage;
                if (signal === null || signal === void 0 ? void 0 : signal.aborted)
                    return yield __await(void 0);
                yield __await(dbService.updateMessage(originalMessage._id, updatedMessage));
            }
            else if (type === "text" && pendingFromHistory) {
                const { functionCall, originalMessage } = pendingFromHistory;
                const functionResponse = {
                    name: functionCall === null || functionCall === void 0 ? void 0 : functionCall.name,
                    response: {
                        result: {
                            text: "The user ignored the previous tool call. Please continue without it.",
                        },
                    },
                };
                const updatedMessage = Object.assign(Object.assign({}, originalMessage), { parts: [...originalMessage.parts, { functionResponse }] });
                const idx = turn.messages.findIndex((m) => m._id === originalMessage._id);
                if (idx !== -1)
                    turn.messages[idx] = updatedMessage;
                if (signal === null || signal === void 0 ? void 0 : signal.aborted)
                    return yield __await(void 0);
                yield __await(dbService.updateMessage(originalMessage._id, updatedMessage));
            }
            let isComingFromTheUser = true;
            // --- Main loop ---
            while (remainingTurns-- > 0) {
                if (signal === null || signal === void 0 ? void 0 : signal.aborted)
                    return yield __await(void 0);
                // If the query is coming from the user, means it is already processed above
                if (isComingFromTheUser) {
                    isComingFromTheUser = false;
                }
                else {
                    // Processing Tool Calls from the previous turn
                    const pendingToolCall = (0, toolUtils_1.getPendingToolCall)(turn.messages);
                    if (pendingToolCall) {
                        if (signal === null || signal === void 0 ? void 0 : signal.aborted)
                            return yield __await(void 0);
                        const { functionCall, originalMessage } = pendingToolCall;
                        const toolName = functionCall === null || functionCall === void 0 ? void 0 : functionCall.name;
                        if (exports.serverTools.includes(toolName || "")) {
                            // Hide thinking indicator while server tool executes (tools have their own UI)
                            if (isThinkingShown) {
                                yield yield __await({
                                    type: "is_thinking",
                                    is_thinking: false,
                                });
                                isThinkingShown = false;
                            }
                            const { output, error } = yield __await(Promise.resolve((0, toolExecutor_1.executeTool)(functionCall, thread_id, todoListService)));
                            const updatedMessage = Object.assign(Object.assign({}, originalMessage), { parts: [
                                    ...originalMessage.parts,
                                    {
                                        functionResponse: {
                                            name: toolName,
                                            response: {
                                                output: output,
                                                error: error,
                                            },
                                        },
                                    },
                                ] });
                            const idx = turn.messages.findIndex((m) => m._id === originalMessage._id);
                            if (idx !== -1)
                                turn.messages[idx] = updatedMessage;
                            if (signal === null || signal === void 0 ? void 0 : signal.aborted)
                                return yield __await(void 0);
                            yield __await(dbService.updateMessage(originalMessage._id, {
                                parts: updatedMessage.parts,
                            }));
                            yield yield __await({
                                type: "function_response",
                                message: updatedMessage,
                            });
                        }
                        else {
                            // Non-server tool call (handled client-side) - hide thinking indicator
                            if (isThinkingShown) {
                                yield yield __await({
                                    type: "is_thinking",
                                    is_thinking: false,
                                });
                                isThinkingShown = false;
                            }
                            yield yield __await({
                                type: "function_call",
                                message: {
                                    _id: originalMessage._id,
                                    thread_id,
                                    role: "model",
                                    parts: [{ functionCall }],
                                },
                            });
                            break;
                        }
                    }
                }
                // --- Streaming ---
                if (signal === null || signal === void 0 ? void 0 : signal.aborted)
                    return yield __await(void 0);
                // Show thinking indicator before starting model streaming if not already shown
                if (!isThinkingShown) {
                    yield yield __await({
                        type: "is_thinking",
                        is_thinking: true,
                    });
                    isThinkingShown = true;
                }
                const messageId = (0, toolUtils_1.generateId)();
                let pendingStreamParts = [{ text: "" }];
                const response = (0, gemini_1.gemini)(turn.messages, mode, signal);
                let hasStartedStreaming = false;
                try {
                    for (var _s = true, response_1 = (e_1 = void 0, __asyncValues(response)), response_1_1; response_1_1 = yield __await(response_1.next()), _a = response_1_1.done, !_a; _s = true) {
                        _c = response_1_1.value;
                        _s = false;
                        const chunk = _c;
                        if (signal === null || signal === void 0 ? void 0 : signal.aborted)
                            return yield __await(void 0);
                        // Hide thinking indicator when streaming starts
                        if (!hasStartedStreaming) {
                            if (isThinkingShown) {
                                yield yield __await({
                                    type: "is_thinking",
                                    is_thinking: false,
                                });
                                isThinkingShown = false;
                            }
                            hasStartedStreaming = true;
                        }
                        const text = (_l = (_k = (_j = (_h = (_g = chunk.candidates) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.content) === null || _j === void 0 ? void 0 : _j.parts) === null || _k === void 0 ? void 0 : _k[0]) === null || _l === void 0 ? void 0 : _l.text;
                        const functionCall = (_r = (_q = (_p = (_o = (_m = chunk.candidates) === null || _m === void 0 ? void 0 : _m[0]) === null || _o === void 0 ? void 0 : _o.content) === null || _p === void 0 ? void 0 : _p.parts) === null || _q === void 0 ? void 0 : _q.find((p) => p === null || p === void 0 ? void 0 : p.functionCall)) === null || _r === void 0 ? void 0 : _r.functionCall;
                        if (functionCall) {
                            if (!functionCall.id) {
                                functionCall.id = (0, toolUtils_1.generateId)();
                            }
                            pendingStreamParts.push({ functionCall });
                        }
                        if (text) {
                            const textIndex = pendingStreamParts.findIndex((p) => p === null || p === void 0 ? void 0 : p.text);
                            if (textIndex === -1)
                                pendingStreamParts.unshift({ text });
                            else
                                pendingStreamParts[textIndex].text += text;
                        }
                        const pendingMessage = {
                            _id: messageId,
                            thread_id,
                            role: "model",
                            parts: pendingStreamParts,
                        };
                        yield yield __await({
                            type: "message",
                            message: pendingMessage,
                        });
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_s && !_a && (_b = response_1.return)) yield __await(_b.call(response_1));
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                const finalMessage = {
                    _id: messageId,
                    thread_id,
                    role: "model",
                    parts: pendingStreamParts,
                    created_at: new Date().toISOString(),
                };
                turn.messages.push(finalMessage);
                if (signal === null || signal === void 0 ? void 0 : signal.aborted)
                    return yield __await(void 0);
                yield __await(dbService.addMessage(finalMessage));
                const nextSpeakerResponse = yield __await((0, gemini_1.nextSpeaker)(turn.messages));
                if ((nextSpeakerResponse === null || nextSpeakerResponse === void 0 ? void 0 : nextSpeakerResponse.next_speaker) !== "model") {
                    break;
                }
            }
        }
        catch (error) {
            console.error("[Ajora:Server][ERROR]:", error);
            yield yield __await({
                type: "error",
                thread_id,
                message_id: message._id,
                error: (error === null || error === void 0 ? void 0 : error.message) || "Unknown agent error",
            });
        }
        finally {
            if (!(signal === null || signal === void 0 ? void 0 : signal.aborted)) {
                yield yield __await({
                    type: "is_thinking",
                    is_thinking: false,
                });
            }
        }
    });
};
exports.agent = agent;
