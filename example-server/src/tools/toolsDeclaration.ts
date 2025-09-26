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

// Get, add, create, and update the todo list
const todoListFunctionDeclaration = {
  name: "todo_list",
  description:
    "Create, get, add todos, and update todo status in the todo list. Supports creating new todo lists, adding todos, retrieving todo lists, and marking todos as queue, executing, completed, or error.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: [
          "create_list",
          "add",
          "get",
          "mark_as_queue",
          "mark_as_executing",
          "mark_as_completed",
          "mark_as_error",
        ],
        description: "Action to perform on the todo list.",
      },
      name: {
        type: Type.STRING,
        description: "Name of the todo list (required for create_list action).",
      },
      description: {
        type: Type.STRING,
        description:
          "Description of the todo list (required for create_list action).",
      },
      todo_list_id: {
        type: Type.STRING,
        description:
          "ID of the todo list (required for add, mark_as_queue, mark_as_executing, mark_as_completed, mark_as_error actions).",
      },
      todos: {
        type: Type.ARRAY,
        description:
          "Array of todos to create with the todo list (required for create_list action).",
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "Name/description of the todo item.",
            },
            status: {
              type: Type.STRING,
              enum: ["queue", "executing", "completed", "error"],
              description: "Status of the todo item. Defaults to 'queue'.",
            },
          },
          required: ["name"],
        },
      },
      todo: {
        type: Type.OBJECT,
        description:
          "Todo object (required for add, mark_as_queue, mark_as_executing, mark_as_completed, mark_as_error actions).",
        properties: {
          id: {
            type: Type.STRING,
            description:
              "ID of the todo item (required for status update actions).",
          },
          name: {
            type: Type.STRING,
            description:
              "Name/description of the todo item (required for add action).",
          },
          status: {
            type: Type.STRING,
            enum: ["queue", "executing", "completed", "error"],
            description:
              "Status of the todo item. Defaults to 'queue' for new todos.",
          },
        },
        required: ["name"],
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
