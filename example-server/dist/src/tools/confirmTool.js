"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmActionFunctionDeclaration = void 0;
const genai_1 = require("@google/genai");
// Define the function declaration for the confirm action tool
const confirmActionFunctionDeclaration = {
    name: "confirm_action",
    description: "Request user confirmation for an action. This tool displays a confirmation dialog to the user and waits for their response.",
    parameters: {
        type: genai_1.Type.OBJECT,
        properties: {
            message: {
                type: genai_1.Type.STRING,
                description: "The confirmation message to display to the user. This should clearly explain what action they are confirming.",
            },
        },
        required: ["message"],
    },
};
exports.confirmActionFunctionDeclaration = confirmActionFunctionDeclaration;
