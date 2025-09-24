import { GoogleGenAI, Type } from "@google/genai";
import { confirmActionFunctionDeclaration } from "./confirmTool";

// Configure the client
const ai = new GoogleGenAI({});

// Define the function declaration for the model
const searchWebFunctionDeclaration = {
  name: "search_web",
  description:
    "Search the web for the given query to get the latest information.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Query to search the web.",
      },
    },
    required: ["query"],
  },
};

const searchDocumentFunctionDeclaration = {
  name: "search_document",
  description:
    "Search the document for the given query to get the latest information.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Query to search the document.",
      },
    },
    required: ["query"],
  },
};

// Get, add, remove, update the todo list
const todoListFunctionDeclaration = {
  name: "todo_list",
  description:
    "Get, add, remove, and update the todo list for the given query to get the latest information.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ["create_list", "add", "get", "remove", "update"],
        description: "Action to perform on the todo list.",
      },
      name: {
        type: Type.STRING,
        description: "Name of the todo list (for create_list action).",
      },
      description: {
        type: Type.STRING,
        description: "Description of the todo list (for create_list action).",
      },
      todoListId: {
        type: Type.STRING,
        description:
          "ID of the todo list (for add, get, remove, update actions). Optional for get action - will use default list if not provided.",
      },
      todo: {
        type: Type.OBJECT,
        description:
          "Todo object (for add, update actions). Should contain: text (string), completed (boolean), priority (high|medium|low), category (string).",
        properties: {
          text: {
            type: Type.STRING,
            description: "The todo text content.",
          },
          completed: {
            type: Type.BOOLEAN,
            description: "Whether the todo is completed.",
          },
          priority: {
            type: Type.STRING,
            enum: ["high", "medium", "low"],
            description: "Priority level of the todo.",
          },
          category: {
            type: Type.STRING,
            description: "Category of the todo.",
          },
        },
      },
      id: {
        type: Type.STRING,
        description: "ID of the todo item (for remove, update actions).",
      },
    },
    required: ["action"],
  },
};

export const nativeTools = [
  searchWebFunctionDeclaration,
  searchDocumentFunctionDeclaration,
  todoListFunctionDeclaration,
  confirmActionFunctionDeclaration,
];
