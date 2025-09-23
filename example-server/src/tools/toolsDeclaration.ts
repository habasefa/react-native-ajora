import { GoogleGenAI, Type } from "@google/genai";

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
      todo: {
        type: Type.ARRAY,
        items: { type: Type.STRING, enum: ["add", "remove", "update"] },
        description: "Todo to add, remove, update.",
      },
    },
    required: ["todo"],
  },
};

export const nativeTools = [
  searchWebFunctionDeclaration,
  searchDocumentFunctionDeclaration,
  // todoListFunctionDeclaration,
];
