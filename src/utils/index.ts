import { Messages } from "../hooks/useAjora";
import { ThreadItem } from "../Thread/types";
import { IMessage } from "../types";

/**
 * Search for a thread in messages and return the index of the thread
 * @param messages - The messages to search in
 * @param threadId - The id of the thread to search for
 * @returns The index of the thread or undefined if not found
 */
export const findThreadInMessages = (
  messages: Messages,
  threadId: string
): string | undefined => {
  const keys = Object.keys(messages);
  return keys.find((key) => key === threadId);
};

/**
 * Create a default thread
 * @returns The default thread
 */
export const createDefaultThread = (): ThreadItem => ({
  id: `thread_${Date.now()}`,
  title: "New Thread ",
  lastMessage: undefined,
  timestamp: new Date(),
});

/**
 * Merge functionCall and functionResponse messages
 * @param messages - The messages to merge
 * @returns The merged messages
 */
export const mergeFunctionCallsAndResponses = (
  messages: Messages
): Messages => {
  if (Array.isArray(messages)) {
    const mergedMessages = [...messages];

    // Find all functionResponse parts and merge them with matching functionCall parts
    messages.forEach((message, messageIndex) => {
      const functionResponseParts =
        message.parts?.filter((part) => part.functionResponse) || [];

      functionResponseParts.forEach((responsePart) => {
        const responseId = responsePart.functionResponse?.id;
        if (responseId && responseId !== "") {
          // Find a previous message with matching functionCall ID
          for (let i = messageIndex - 1; i >= 0; i--) {
            const existingMessage = mergedMessages[i];
            const functionCallParts =
              existingMessage.parts?.filter((part) => part.functionCall) || [];

            const matchingCallPart = functionCallParts.find(
              (callPart) => callPart.functionCall?.id === responseId
            );

            if (matchingCallPart && !matchingCallPart.functionCall?.response) {
              // Merge the functionResponse into the existing message
              mergedMessages[i] = {
                ...existingMessage,
                parts:
                  existingMessage.parts?.map((part) => {
                    if (part.functionCall?.id === responseId) {
                      return {
                        ...part,
                        functionCall: {
                          ...part.functionCall,
                          response: responsePart.functionResponse?.response,
                        },
                      };
                    }
                    return part;
                  }) || [],
              };
              break; // Found and merged, no need to continue searching
            }
          }
        }
      });
    });

    return mergedMessages;
  } else if (typeof messages === "object") {
    const result: Record<string, IMessage[]> = {};
    Object.entries(messages).forEach(([key, message]) => {
      result[key] = mergeFunctionCallsAndResponses(message) as IMessage[];
    });
    return result;
  }

  return [];
};
