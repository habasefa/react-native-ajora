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
exports.threadTitleUpdate = exports.nextSpeaker = exports.gemini = void 0;
const genai_1 = require("@google/genai");
const toolsDeclaration_1 = require("./tools/toolsDeclaration");
const system_prompt_1 = require("./system_prompt");
// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Create example-backend/.env and set GEMINI_API_KEY.");
}
const genAI = new genai_1.GoogleGenAI({
    apiKey,
});
const processMessage = (message) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Check if there are file parts
    // 2. If there are file parts, check if they are uploaded to FileAPI
    // 3. If they are not uploaded, upload them to FileAPI
    // 4. Update the part to a gemini compatible part and return the processed message with role and parts
    var _a, _b;
    const fileParts = message.filter((message) => { var _a; return (_a = message.parts) === null || _a === void 0 ? void 0 : _a.some((part) => part.fileData); });
    if (fileParts.length > 0) {
        for (const filePart of fileParts) {
            const fileData = (_a = filePart.parts.find((part) => part.fileData)) === null || _a === void 0 ? void 0 : _a.fileData;
            const imageUrl = fileData === null || fileData === void 0 ? void 0 : fileData.fileUri;
            if (!imageUrl) {
                console.error("File URL is not set", filePart);
                continue;
            }
            const response = yield fetch(imageUrl);
            if (!response.ok) {
                console.error("Failed to fetch file", response);
                continue;
            }
            const blob = yield response.blob();
            const file = new File([blob], fileData === null || fileData === void 0 ? void 0 : fileData.displayName, {
                type: (_b = filePart.parts[0].fileData) === null || _b === void 0 ? void 0 : _b.mimeType,
            });
            const uploadedFile = yield genAI.files.upload({
                file: file,
                config: {
                    mimeType: fileData === null || fileData === void 0 ? void 0 : fileData.mimeType,
                },
            });
            console.log("uploadedFile", uploadedFile);
            fileData.fileUri = uploadedFile.uri;
            fileData.mimeType = uploadedFile.mimeType;
        }
    }
    return message.reverse().map((message) => ({
        role: message.role,
        parts: message.parts,
    }));
});
const gemini = function (message_1) {
    return __asyncGenerator(this, arguments, function* (message, mode = "agent", signal) {
        var _a, e_1, _b, _c;
        try {
            if (message.length === 0) {
                throw new Error("Message is empty");
            }
            const processedMessage = yield __await(processMessage(message));
            console.log("processedMessage", JSON.stringify(processedMessage, null, 2));
            const systemInstruction = mode === "agent" ? system_prompt_1.agentPrompt : system_prompt_1.assistantPrompt;
            if (signal === null || signal === void 0 ? void 0 : signal.aborted)
                return yield __await(void 0);
            const response = yield __await(genAI.models.generateContentStream({
                model: "gemini-2.5-pro",
                contents: processedMessage,
                config: {
                    tools: [
                        {
                            functionDeclarations: toolsDeclaration_1.nativeTools,
                        },
                    ],
                    systemInstruction: systemInstruction,
                },
            }));
            try {
                for (var _d = true, response_1 = __asyncValues(response), response_1_1; response_1_1 = yield __await(response_1.next()), _a = response_1_1.done, !_a; _d = true) {
                    _c = response_1_1.value;
                    _d = false;
                    const chunk = _c;
                    if (signal === null || signal === void 0 ? void 0 : signal.aborted)
                        return yield __await(void 0);
                    yield yield __await(chunk);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = response_1.return)) yield __await(_b.call(response_1));
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        catch (error) {
            console.error("Error in gemini:", error);
        }
    });
};
exports.gemini = gemini;
const CHECK_PROMPT = `
Analyze *only* the content and structure of the turn history. Based *strictly* on that response, determine who should logically speak next: the 'user' or the 'model' (you).

Your decision must respect the following rules and updated behavioral expectations based on the agent's new mandates (sequential tasking, tool articulation/reflection, and stepwise execution).

---

### 🔎 Decision Rules (Apply in Order):

1. **Model Continues (Incomplete or Next Action Pending):**  
   - If your last response explicitly indicates an *intended next step* that the model itself should take (e.g., "Next, I will…", "Now I'll call the tool…", "Proceeding to analyze…"),  
   - OR if it mentions a tool action but the tool was **not yet called**,  
   → Then the **'model'** should speak next.

2. **Question to User:**  
   - If your last response ends with a **direct question specifically addressed to the user** (e.g., clarification, confirmation, or input request),  
   → Then the **'user'** should speak next.

3. **Sequential Task Progression (Multi-step Objective):**  
   - If the user's overall request involves a **sequence of subtasks** (e.g., answering questions 1–5 one by one) and **the next subtask is still pending**,  
   - AND your last response completed the current subtask but did not explicitly request user input,  
   → Then the **'model'** should speak next (to proceed to the next step in the sequence).



---

### ⚙️ Tool Context:
- **Server Tools:** When a server tool is mentioned but not yet executed, the **model** must continue.  
- **Client Tools:** When a client tool is invoked (e.g., confirm_action), the **user** must respond next.

---

### ✅ Additional Notes:
- Always consider the **sequential nature of tasks**. If the user's multi-part question is not fully addressed yet, the default is usually **model continues**.  
- The model should not stop between subtasks unless explicitly requiring user input.  
- Reflective steps (before/after tool use) are considered part of the model’s responsibility — if they’re missing, the next speaker is the **model**.


IF THE THERE IS A TOOL CALL, AND THE TOOL CALL IS SERVER TOOL, THEN THE NEXT SPEAKER **MUST BE** THE **MODEL**.

<example>
Last response: "... I'll mark the last step as complete."

The next speaker **MUST BE** THE **MODEL**.

</example>

`;
const RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        reasoning: {
            type: "string",
            description: "Brief explanation justifying the 'next_speaker' choice based *strictly* on the applicable rule and the content/structure of the preceding turn.",
        },
        next_speaker: {
            type: "string",
            enum: ["user", "model"],
            description: "Who should speak next based *only* on the preceding turn and the decision rules",
        },
    },
    required: ["reasoning", "next_speaker"],
};
const nextSpeaker = (history) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Only take the last 10 messages
    const last10Messages = history.slice(-10);
    const singleHistory = JSON.stringify(last10Messages, null, 2);
    const response = yield genAI.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: `Here is the history: ${singleHistory}\n\n${CHECK_PROMPT}. 
            Just to remind about the last message, here it is: ${JSON.stringify(last10Messages[last10Messages.length - 1], null, 2)}. 
            You must consider this message for your decision, especially if it has any tool call or function call or anything that is relevant to the decision.`,
                    },
                ],
            },
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
        },
    });
    const nextSpeaker = JSON.parse((_a = response.text) !== null && _a !== void 0 ? _a : "");
    return nextSpeaker;
});
exports.nextSpeaker = nextSpeaker;
const threadTitleUpdate = (history) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Sanitize history: keep only text parts to avoid passing function calls/responses
    const sanitized = history
        .map((msg) => {
        const textParts = (msg.parts || [])
            .map((p) => (p && p.text ? { text: p.text } : null))
            .filter(Boolean);
        if (textParts.length === 0)
            return null;
        return {
            role: msg.role,
            parts: textParts,
        };
    })
        .filter(Boolean);
    try {
        const response = yield genAI.models.generateContent({
            model: "gemini-2.0-flash-lite",
            contents: [
                ...sanitized,
                {
                    role: "user",
                    parts: [
                        {
                            text: "Given the conversation above, respond with a title for the thread in 3-4 words.",
                        },
                    ],
                },
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        title: { type: genai_1.Type.STRING },
                    },
                    required: ["title"],
                },
            },
        });
        const title = JSON.parse((_a = response.text) !== null && _a !== void 0 ? _a : "");
        return title.title;
    }
    catch (error) {
        console.error("Error in threadTitleUpdate:", error);
        return "Untitled Thread";
    }
});
exports.threadTitleUpdate = threadTitleUpdate;
