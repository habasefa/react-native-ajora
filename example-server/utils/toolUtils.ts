import { FunctionCall, Part } from "@google/genai";
import { nativeTools } from "../src/tools/toolsDeclaration";
import { Message } from "../db/dbService";
import { v4 as uuidv4 } from "uuid";

const isValidToolCall = (toolCall: FunctionCall) => {
  const { name, args } = toolCall;

  //   Check if the tool is valid
  const tool = nativeTools.find((tool) => tool.name === name);
  if (!tool) {
    return {
      error: `Tool ${name} not found`,
    };
  }

  //   Check if the required arguments are provided
  if (tool.parameters.required.some((required: string) => !args?.[required])) {
    return {
      error: `Tool ${name} requires the following arguments: ${tool.parameters.required.join(", ")}`,
    };
  }

  //   Check if the arguments are valid
  if (
    Object.keys(tool.parameters.properties).some(
      (property: any) => !args?.[property]
    )
  ) {
    return {
      error: `Tool ${name} requires the following arguments: ${Object.keys(tool.parameters.properties).join(", ")}`,
    };
  }

  return true;
};

const getFunctionCall = (message: Message): Part | undefined => {
  return message.parts.find((part: Part) => part.functionCall);
};

const getFunctionResponse = (message: Message): Part | undefined => {
  return message.parts.find((part: Part) => part.functionResponse);
};

const getPendingToolCall = (
  history: Message[]
): { functionCall: Part; originalMessage: Message } | undefined => {
  // Get the last message in the history and check if it has functionCall but no functionResponse else return undefined
  const lastMessage = history[history.length - 1];
  const functionCall = getFunctionCall(lastMessage);
  const functionResponse = getFunctionResponse(lastMessage);
  if (functionCall && !functionResponse) {
    return {
      functionCall: functionCall,
      originalMessage: lastMessage,
    };
  }
  return undefined;
};

const generateId = () => {
  return uuidv4();
};

const isText = (response: any) => {
  return response.candidates?.[0]?.content?.parts?.[0]?.text;
};

export {
  isValidToolCall,
  isText,
  getFunctionCall,
  getPendingToolCall,
  generateId,
};
