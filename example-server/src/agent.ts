import { gemini, nextSpeaker } from "./gemini";
import { generateId, getPendingToolCall } from "../utils/toolUtils";
import { executeTool } from "./toolExecutor";
import { Message } from "../db/dbService";
import DbService from "../db/dbService";
import { TodoListService } from "./services/todoService";
import { FunctionResponse, Part } from "@google/genai";

export const serverTools = ["search_web", "search_document", "todo_list"];

export type AgentEvent =
  | { type: "message"; message: Message }
  | { type: "thought"; thought: string }
  | { type: "is_thinking"; is_thinking: boolean }
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

export const agent = async function* (
  query: UserEvent,
  dbService: DbService,
  mode: AgentMode = "agent",
  signal?: AbortSignal
) {
  if (!query) {
    throw new Error("Query is required ");
  }

  // Track current thinking indicator state to avoid redundant toggles
  let isThinkingShown = false;

  if (signal?.aborted) return;
  yield {
    type: "is_thinking",
    is_thinking: true,
  };

  isThinkingShown = true;

  const { type, message } = query;

  // Initialize TodoListService with the database service
  const todoListService = new TodoListService(dbService);

  const thread_id = message.thread_id;
  let remainingTurns = MAX_TURNS;

  // Add the query to the history
  if (signal?.aborted) return;
  await dbService.addMessage(message);

  let history: Message[] = await dbService.getMessages(thread_id);

  const turn: Turn = {
    turn_id: generateId(),
    messages: history,
  };

  try {
    // --- Handle incoming message ---
    const pendingFromHistory = getPendingToolCall(turn.messages);

    if (signal?.aborted) return;
    if (type === "function_response" && pendingFromHistory) {
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
      if (signal?.aborted) return;
      await dbService.updateMessage(originalMessage._id!, updatedMessage);
    } else if (type === "text" && pendingFromHistory) {
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
      if (signal?.aborted) return;
      await dbService.updateMessage(originalMessage._id!, updatedMessage);
    }

    let isComingFromTheUser = true;

    // --- Main loop ---
    while (remainingTurns-- > 0) {
      if (signal?.aborted) return;
      // If the query is coming from the user, means it is already processed above
      if (isComingFromTheUser) {
        isComingFromTheUser = false;
      } else {
        // Processing Tool Calls from the previous turn
        const pendingToolCall = getPendingToolCall(turn.messages);

        if (pendingToolCall) {
          if (signal?.aborted) return;
          const { functionCall, originalMessage } = pendingToolCall;
          const toolName = functionCall?.name;

          if (serverTools.includes(toolName || "")) {
            // Hide thinking indicator while server tool executes (tools have their own UI)
            if (isThinkingShown) {
              yield {
                type: "is_thinking",
                is_thinking: false,
              };
              isThinkingShown = false;
            }
            const { output, error } = await Promise.resolve(
              executeTool(functionCall, thread_id, todoListService)
            );

            const updatedMessage: Message = {
              ...originalMessage,
              parts: [
                ...originalMessage.parts,
                {
                  functionResponse: {
                    name: toolName,
                    response: {
                      output: output,
                      error: error,
                    },
                  },
                },
              ],
            };

            const idx = turn.messages.findIndex(
              (m) => m._id === originalMessage._id
            );
            if (idx !== -1) turn.messages[idx] = updatedMessage;
            if (signal?.aborted) return;
            await dbService.updateMessage(originalMessage._id!, {
              parts: updatedMessage.parts,
            });

            yield {
              type: "function_response",
              message: updatedMessage,
            };
          } else {
            // Non-server tool call (handled client-side) - hide thinking indicator
            if (isThinkingShown) {
              yield {
                type: "is_thinking",
                is_thinking: false,
              };
              isThinkingShown = false;
            }
            yield {
              type: "function_call",
              message: {
                _id: originalMessage._id!,
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
      if (signal?.aborted) return;
      // Show thinking indicator before starting model streaming if not already shown
      if (!isThinkingShown) {
        yield {
          type: "is_thinking",
          is_thinking: true,
        };
        isThinkingShown = true;
      }
      const messageId = generateId();
      let pendingStreamParts: Part[] = [{ text: "" }];

      const response = gemini(turn.messages, mode, signal);
      let hasStartedStreaming = false;
      for await (const chunk of response) {
        if (signal?.aborted) return;
        // Hide thinking indicator when streaming starts
        if (!hasStartedStreaming) {
          if (isThinkingShown) {
            yield {
              type: "is_thinking",
              is_thinking: false,
            };
            isThinkingShown = false;
          }
          hasStartedStreaming = true;
        }
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
        const functionCall = chunk.candidates?.[0]?.content?.parts?.find(
          (p: Part) => p?.functionCall
        )?.functionCall;

        if (functionCall) {
          if (!functionCall.id) {
            functionCall.id = generateId();
          }
          pendingStreamParts.push({ functionCall });
        }

        if (text) {
          const textIndex = pendingStreamParts.findIndex((p) => p?.text);
          if (textIndex === -1) pendingStreamParts.unshift({ text });
          else pendingStreamParts[textIndex].text += text;
        }

        const pendingMessage: Message = {
          _id: messageId,
          thread_id,
          role: "model",
          parts: pendingStreamParts,
        };

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

      turn.messages.push(finalMessage);
      if (signal?.aborted) return;
      await dbService.addMessage(finalMessage);

      const nextSpeakerResponse = await nextSpeaker(turn.messages);

      if (nextSpeakerResponse?.next_speaker !== "model") {
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
  } finally {
    if (!signal?.aborted) {
      yield {
        type: "is_thinking",
        is_thinking: false,
      };
    }
  }
};
