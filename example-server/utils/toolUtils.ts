import { FunctionCall, FunctionResponse, Part } from "@google/genai";
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

  //   Check if the arguments are valid (only check required properties)
  const requiredProps = tool.parameters.required || [];
  if (requiredProps.some((property: string) => !args?.[property])) {
    return {
      error: `Tool ${name} requires the following arguments: ${requiredProps.join(", ")}`,
    };
  }

  return true;
};

const getFunctionCall = (message?: Message): FunctionCall | undefined => {
  if (!message || !Array.isArray(message.parts)) return undefined;
  return message.parts.find((part: Part) => part?.functionCall)
    ?.functionCall as FunctionCall | undefined;
};

const getFunctionResponse = (
  message?: Message
): FunctionResponse | undefined => {
  if (!message || !Array.isArray(message.parts)) return undefined;
  return message.parts.find((part: Part) => part?.functionResponse) as
    | FunctionResponse
    | undefined;
};

const getPendingToolCall = (
  history: Message[]
): { functionCall: FunctionCall; originalMessage: Message } | undefined => {
  if (!Array.isArray(history) || history.length === 0) return undefined;

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
  getFunctionResponse,
  getPendingToolCall,
  generateId,
};
