import { nextSpeaker } from "./nextSpeaker";
import { gemini } from "./gemini";
import { generateId, getPendingToolCall } from "../utils/toolUtils";
import { executeTool } from "./toolExecutor";
import { Message } from "../db/dbService";
import DbService from "../db/dbService";

export type AgentEvent =
  | {
      type: "text";
      message: Message;
    }
  | {
      type: "function_call";
      message: Message;
    }
  | {
      type: "function_response";
      message: Message;
    };

export type UserEvent =
  | {
      type: "text";
      message: Message;
    }
  | {
      type: "function_response";
      message: Message;
    };

export type AgentMode = "agent" | "assistant";

// Maximum internal follow-up turns to avoid infinite loops
const MAX_TURNS = 50;

export const agent = async function* (query: UserEvent) {
  const { type, message } = query;
  const thread_id = message.thread_id;

  const dbService = new DbService();
  let history: Message[] = await dbService.getMessages(thread_id);

  try {
    let turn: Message[] = [];
    const pendingToolCall = getPendingToolCall(history);

    if (type === "function_response" && pendingToolCall) {
      const { functionCall, originalMessage } = pendingToolCall;
      // Get the original function call and update it
      const updatedMessage = {
        _id: message._id,
        thread_id: thread_id,
        role: message.role,
        parts: [
          {
            functionResponse: {
              id: functionCall?.functionCall?.id,
              name: functionCall?.functionCall?.name,
              response: message.parts[0].functionResponse?.response,
            },
          },
        ],
      };
      turn.push(updatedMessage);
      dbService.updateMessage(message._id, updatedMessage);
      history = await dbService.getMessages(thread_id);
    } else if (type === "text" && pendingToolCall) {
      const { functionCall, originalMessage } = pendingToolCall;
      const updatedMessage = {
        ...originalMessage,
        parts: [
          {
            functionResponse: {
              id: functionCall?.functionCall?.id,
              name: functionCall?.functionCall?.name,
              response: {
                text: "The user is ignoring the previous tool call. Please continue.",
              },
            },
          },
        ],
      };
      turn.push(updatedMessage);
      dbService.updateMessage(originalMessage._id, updatedMessage);
      history = await dbService.getMessages(thread_id);
    } else {
      // Add the incoming user message
      turn.push({
        _id: message._id,
        thread_id: thread_id,
        role: message.role,
        parts: message.parts,
      });
      dbService.addMessage(message);
      history = await dbService.getMessages(thread_id);
    }

    let remainingTurns = MAX_TURNS;

    // Main loop: every turn we generate a new message id
    while (remainingTurns-- > 0) {
      // Check for pending tool calls, if found, execute the tool and add the function response to the turn
      const pendingToolCall = getPendingToolCall(turn);
      if (pendingToolCall) {
        const { functionCall, originalMessage } = pendingToolCall;

        const toolResult = executeTool({
          id: functionCall?.functionCall?.id,
          name: functionCall?.functionCall?.name,
          args: functionCall?.functionCall?.args,
        });
        turn.push({
          _id: message._id,
          thread_id: thread_id,
          role: "user",
          parts: [
            {
              functionResponse: {
                name: functionCall?.functionCall?.name,
                response: toolResult,
              },
            },
          ],
        });

        yield turn;
      }

      const messageId = generateId();

      let pendingStream: Message = {
        _id: messageId,
        thread_id: thread_id,
        role: "model",
        parts: [{ text: "" }, { functionCall: [] }],
      };

      // Run model streaming turn against current history
      const response = gemini(turn);

      for await (const chunk of response) {
        const { functionCalls, text } = chunk;

        if (functionCalls) {
          pendingStream = {
            ...pendingStream,
            parts: [
              {
                functionCall: functionCalls,
              },
            ],
          };
        }

        if (text) {
          pendingStream = {
            ...pendingStream,
            parts: [{ text: (pendingStream.parts[0]?.text ?? "") + text }],
          };
        }

        // Stream chunk to caller
        yield pendingStream;
      }

      turn.push({
        ...pendingStream,
        parts: [{ text: pendingStream.parts[0]?.text ?? "" }],
      });

      // No tools pending: check if model should continue
      const nextSpeakerResponse = await nextSpeaker(turn);
      if (nextSpeakerResponse && nextSpeakerResponse.next_speaker === "model") {
        const nextRequest: Message = {
          _id: generateId(),
          thread_id: thread_id,
          role: "user",
          parts: [{ text: "Please continue." }],
        };
        turn.push(nextRequest);
        // Continue to next loop turn to stream follow-up
        continue;
      }

      // Neither tools nor continuation requested → end
      console.log("Turns complete:", turn);
      break;
    }
  } catch (error) {
    console.error("Error in agent:", error);
    throw error;
  }
};
