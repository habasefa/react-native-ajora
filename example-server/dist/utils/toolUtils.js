"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = exports.getPendingToolCall = exports.getFunctionResponse = exports.getFunctionCall = exports.isText = exports.isValidToolCall = void 0;
const toolsDeclaration_1 = require("../src/tools/toolsDeclaration");
const uuid_1 = require("uuid");
const isValidToolCall = (toolCall) => {
    const { name, args } = toolCall;
    //   Check if the tool is valid
    const tool = toolsDeclaration_1.nativeTools.find((tool) => tool.name === name);
    if (!tool) {
        return {
            error: `Tool ${name} not found`,
        };
    }
    //   Check if the required arguments are provided
    if (tool.parameters.required.some((required) => !(args === null || args === void 0 ? void 0 : args[required]))) {
        return {
            error: `Tool ${name} requires the following arguments: ${tool.parameters.required.join(", ")}`,
        };
    }
    //   Check if the arguments are valid (only check required properties)
    const requiredProps = tool.parameters.required || [];
    if (requiredProps.some((property) => !(args === null || args === void 0 ? void 0 : args[property]))) {
        return {
            error: `Tool ${name} requires the following arguments: ${requiredProps.join(", ")}`,
        };
    }
    return true;
};
exports.isValidToolCall = isValidToolCall;
const getFunctionCall = (message) => {
    var _a;
    if (!message || !Array.isArray(message.parts))
        return undefined;
    return (_a = message.parts.find((part) => part === null || part === void 0 ? void 0 : part.functionCall)) === null || _a === void 0 ? void 0 : _a.functionCall;
};
exports.getFunctionCall = getFunctionCall;
const getFunctionResponse = (message) => {
    if (!message || !Array.isArray(message.parts))
        return undefined;
    return message.parts.find((part) => part === null || part === void 0 ? void 0 : part.functionResponse);
};
exports.getFunctionResponse = getFunctionResponse;
const getPendingToolCall = (history) => {
    if (!Array.isArray(history) || history.length === 0)
        return undefined;
    // Get the last message in the history and check if it has functionCall but no functionResponse else return undefined
    const originalMessage = history[history.length - 1];
    const functionCall = getFunctionCall(originalMessage);
    const functionResponse = getFunctionResponse(originalMessage);
    if (functionCall && !functionResponse) {
        return {
            functionCall,
            originalMessage,
        };
    }
    return undefined;
};
exports.getPendingToolCall = getPendingToolCall;
const generateId = () => {
    return (0, uuid_1.v4)();
};
exports.generateId = generateId;
const isText = (response) => {
    var _a, _b, _c, _d, _e;
    return (_e = (_d = (_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text;
};
exports.isText = isText;
