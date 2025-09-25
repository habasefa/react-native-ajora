import { gemini, nextSpeaker } from "./gemini";
import {
  generateId,
  getFunctionResponse,
  getPendingToolCall,
} from "../utils/toolUtils";
import { executeTool } from "./toolExecutor";
import { Message } from "../db/dbService";
import DbService from "../db/dbService";
import { FunctionResponse, Part } from "@google/genai";

export const serverTools = ["search_web", "search_document", "todo_list"];

export type AgentEvent =
  | { type: "message"; message: Message }
  | { type: "function_response"; message: Message }
  | { type: "thread_title"; thread_id: string; title: string }
  | { type: "error"; thread_id: string; message_id: string; error: string };

export type UserEvent =
  | { type: "text"; message: Message }
  | { type: "function_response"; message: Message };

export type AgentMode = "agent" | "assistant";

export interface Turn {
  turn_id: string;
  messages: Message[];
}

const MAX_TURNS = 50;

export const agent = async function* (query: UserEvent, dbService: DbService) {
  if (!query) {
    throw new Error("Query is required ");
  }
  const { type, message } = query;

  const thread_id = message.thread_id;
  let remainingTurns = MAX_TURNS;

  // Add the query to the history
  await dbService.addMessage(message);

  let history: Message[] = await dbService.getMessages(thread_id);
  console.log("[Ajora:Server][0]: History", JSON.stringify(history, null, 2));

  const turn: Turn = {
    turn_id: generateId(),
    messages: history,
  };

  try {
    // --- Handle incoming message ---
    const pendingFromHistory = getPendingToolCall(turn.messages);
    console.log("[Ajora:Server][1]: pendingFromHistory", pendingFromHistory);

    if (type === "function_response" && pendingFromHistory) {
      console.log("[Ajora:Server][2]: Function Response from User", message);
      const { functionCall, originalMessage } = pendingFromHistory;
      const functionResponse: FunctionResponse = {
        name: functionCall?.name,
        response: message.parts?.[0]?.functionResponse?.response,
      };
      const updatedMessage: Message = {
        ...originalMessage,
        parts: [...originalMessage.parts, { functionResponse }],
      };
      const idx = turn.messages.findIndex((m) => m._id === originalMessage._id);
      if (idx !== -1) turn.messages[idx] = updatedMessage;
      await dbService.updateMessage(originalMessage._id, updatedMessage);
    } else if (type === "text" && pendingFromHistory) {
      console.log("[Ajora:Server][3]: Ignored Tool Call from User", message);
      const { functionCall, originalMessage } = pendingFromHistory;
      const functionResponse: FunctionResponse = {
        name: functionCall?.name,
        response: {
          result: {
            text: "The user ignored the previous tool call. Please continue without it.",
          },
        },
      };
      const updatedMessage: Message = {
        ...originalMessage,
        parts: [...originalMessage.parts, { functionResponse }],
      };
      const idx = turn.messages.findIndex((m) => m._id === originalMessage._id);
      if (idx !== -1) turn.messages[idx] = updatedMessage;
      await dbService.updateMessage(originalMessage._id, updatedMessage);
    }

    let isComingFromTheUser = true;

    // --- Main loop ---
    while (remainingTurns-- > 0) {
      console.log("[Ajora:Server][4]: Entering Main Loop", remainingTurns);

      // If the query is coming from the user, means it is already processed above
      if (isComingFromTheUser) {
        isComingFromTheUser = false;
      } else {
        // Processing Tool Calls from the previous turn
        const pendingToolCall = getPendingToolCall(turn.messages);
        console.log("[Ajora:Server][4.5]: pendingToolCall", pendingToolCall);

        if (pendingToolCall) {
          const { functionCall, originalMessage } = pendingToolCall;
          const toolName = functionCall?.name;
          console.log("[Ajora:Server][5]: Tool Name", toolName);

          if (serverTools.includes(toolName || "")) {
            const toolResult = await Promise.resolve(
              executeTool(functionCall as any)
            );
            console.log("[Ajora:Server][6]: toolResult", toolResult);

            const updatedMessage: Message = {
              ...originalMessage,
              parts: [
                ...originalMessage.parts,
                {
                  functionResponse: {
                    name: toolName,
                    response: {
                      output: toolResult,
                    },
                  },
                },
              ],
            };

            const idx = turn.messages.findIndex(
              (m) => m._id === originalMessage._id
            );
            if (idx !== -1) turn.messages[idx] = updatedMessage;
            await dbService.updateMessage(originalMessage._id, updatedMessage);
            yield {
              type: "function_response",
              message: updatedMessage,
            };
          } else {
            console.log("[Ajora:Server][7]: Non-server tool", toolName);
            yield {
              type: "function_call",
              message: {
                _id: originalMessage._id,
                thread_id,
                role: "model",
                parts: [{ functionCall }],
              },
            };
            break;
          }
        }
      }
      // --- Streaming ---
      const messageId = generateId();
      let pendingStreamParts: Part[] = [{ text: "" }];

      const response = gemini(turn.messages);
      for await (const chunk of response) {
        console.log(
          "[Ajora:Server][8]: Streaming Chunk",
          JSON.stringify(chunk.candidates?.[0]?.content, null, 2)
        );
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
        const functionCall = chunk.candidates?.[0]?.content?.parts?.find(
          (p: Part) => p?.functionCall
        )?.functionCall;

        if (functionCall) {
          if (!functionCall.id) {
            console.log("[Ajora:Server][9]: Function Call does not have id");
            functionCall.id = generateId();
            console.log(
              "[Ajora:Server][9]: ID added to function call",
              functionCall
            );
          }
          pendingStreamParts.push({ functionCall });
        }

        if (text) {
          const textIndex = pendingStreamParts.findIndex((p) => p?.text);
          if (textIndex === -1) pendingStreamParts.unshift({ text });
          else pendingStreamParts[textIndex].text += text;
          console.log("[Ajora:Server][10]: Text updated", text);
        }

        const pendingMessage: Message = {
          _id: messageId,
          thread_id,
          role: "model",
          parts: pendingStreamParts,
        };

        console.log("[Ajora:Server][11]: Pending Message", pendingMessage);

        yield {
          type: "message",
          message: pendingMessage,
        };
      }

      const finalMessage: Message = {
        _id: messageId,
        thread_id,
        role: "model",
        parts: pendingStreamParts,
        created_at: new Date().toISOString(),
      };
      console.log("[Ajora:Server][11]: Final Message", finalMessage);
      turn.messages.push(finalMessage);
      await dbService.addMessage(finalMessage);

      console.log("[Ajora:Server][12]: About to get next speaker");

      const nextSpeakerResponse = await nextSpeaker(turn.messages);
      console.log(
        "[Ajora:Server][12]: Next Speaker Response",
        nextSpeakerResponse
      );

      if (nextSpeakerResponse?.next_speaker !== "model") {
        console.log("[Ajora:Server][14]: Breaking Main Loop");
        break;
      }
    }
  } catch (error: any) {
    console.error("[Ajora:Server][ERROR]:", error);
    yield {
      type: "error",
      thread_id,
      message_id: message._id,
      error: error?.message || "Unknown agent error",
    };
  }
};
