import { nativeTools } from "../src/tools/toolsDeclaration";
import { Tool } from "../src/toolExecutor";

const isValidToolCall = (toolCall: Tool) => {
  const { name, args } = toolCall;

  //   Check if the tool is valid
  const tool = nativeTools.find((tool) => tool.name === name);
  if (!tool) {
    return {
      error: `Tool ${name} not found`,
    };
  }

  //   Check if the required arguments are provided
  if (tool.parameters.required.some((required: string) => !args[required])) {
    return {
      error: `Tool ${name} requires the following arguments: ${tool.parameters.required.join(", ")}`,
    };
  }

  //   Check if the arguments are valid
  if (
    tool.parameters.properties.some((property: any) => !args[property.name])
  ) {
    return {
      error: `Tool ${name} requires the following arguments: ${tool.parameters.properties.join(", ")}`,
    };
  }

  return true;
};

const isFunctionCall = (response: any) => {
  return response.functionCalls && response.functionCalls.length > 0;
};

export { isValidToolCall, isFunctionCall };
