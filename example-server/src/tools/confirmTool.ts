import { Type } from "@google/genai";

// Define the function declaration for the confirm action tool
const confirmActionFunctionDeclaration = {
  name: "confirm_action",
  description:
    "Request user confirmation for an action. This tool displays a confirmation dialog to the user and waits for their response.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      message: {
        type: Type.STRING,
        description:
          "The confirmation message to display to the user. This should clearly explain what action they are confirming.",
      },
    },
    required: ["message"],
  },
};

export { confirmActionFunctionDeclaration };
