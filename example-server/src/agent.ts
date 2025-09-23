import { FunctionCall, Part } from "@google/genai";
import { nextSpeaker } from "./nextSpeaker";
import { gemini } from "./gemini";
import { isFunctionCall, isText } from "../utils/toolUtils";
import { executeTool } from "./toolExecutor";
import { v4 as uuidv4 } from "uuid";

export interface Message {
  role: "user" | "model";
  parts: Part[];
}

// Maximum internal follow-up turns to avoid infinite loops
const MAX_TURNS = 50;

export const agent = async function* (message: Message) {
  try {
    // Per-invocation state to prevent cross-request contamination
    const history: Message[] = [];
    const messageId = uuidv4();

    // Seed with the incoming user message
    history.push(message);

    let remainingTurns = MAX_TURNS;
    let nextRequest: Message | null = null;

    // Main loop: stream model → handle tools → optionally continue
    while (remainingTurns-- > 0) {
      const pendingToolCalls: FunctionCall[] = [];
      let pendingStreamedText = "";

      // Run model streaming turn against current history
      const response = gemini(history);

      for await (const chunk of response) {
        // Avoid excessively verbose logging in production; keep minimal
        // console.debug(JSON.stringify(chunk.candidates?.[0]?.content));

        if (isFunctionCall(chunk)) {
          const functionCall =
            chunk.candidates?.[0]?.content?.parts?.[0]?.functionCall;
          console.info("Function call detected", functionCall);
          if (functionCall) {
            pendingToolCalls.push(functionCall);
            // Reflect the functionCall in history per Gemini requirements
            history.push({
              role: "model",
              parts: [
                {
                  functionCall: functionCall,
                },
              ],
            });
          }
        }

        if (isText(chunk)) {
          pendingStreamedText +=
            chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        }

        // Stream chunk to caller
        yield {
          _id: messageId,
          role: "model",
          parts: chunk.candidates?.[0]?.content?.parts,
        };
      }

      // Push the aggregated streamed text as a finalized model turn
      if (pendingStreamedText) {
        history.push({
          role: "model",
          parts: [{ text: pendingStreamedText }],
        });
        pendingStreamedText = "";
      }

      // Execute any pending tool calls in order and append functionResponses
      if (pendingToolCalls.length > 0) {
        console.info("Executing tool calls", pendingToolCalls.length);
        for (const toolCall of pendingToolCalls) {
          try {
            const toolResult = await executeTool(toolCall);
            console.info("Tool result", toolResult);
            const functionResponse: Message = {
              role: "user",
              parts: [
                {
                  functionResponse: {
                    name: toolCall.name,
                    response: { toolResult },
                  },
                },
              ],
            } as unknown as Message;

            // Per Gemini: functionResponse must immediately follow functionCall
            history.push(functionResponse);
          } catch (err) {
            console.error("Error executing tool:", err);
          }
        }

        // After tools, continue the loop to let model consume tool outputs
        nextRequest = null;
        continue;
      }

      // No tools pending: check if model should continue
      const nextSpeakerResponse = await nextSpeaker(history);
      if (nextSpeakerResponse && nextSpeakerResponse.next_speaker === "model") {
        nextRequest = {
          role: "user",
          parts: [{ text: "Please continue." }],
        } as Message;
        history.push(nextRequest);
        // Continue to next loop turn to stream follow-up
        continue;
      }

      // Neither tools nor continuation requested → end
      break;
    }

    console.info("History", JSON.stringify(history, null, 2));
  } catch (error) {
    console.error("Error in agent:", error);
    throw error;
  }
};
