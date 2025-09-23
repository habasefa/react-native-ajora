import { GoogleGenAI } from "@google/genai";
import { Message } from "./agent";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const CHECK_PROMPT = `Analyze *only* the content and structure of your immediately preceding response (your last turn in the conversation history). Based *strictly* on that response, determine who should logically speak next: the 'user' or the 'model' (you).
**Decision Rules (apply in order):**
1.  **Model Continues:** If your last response explicitly states an immediate next action *you* intend to take (e.g., "Next, I will...", "Now I'll process...", "Moving on to analyze...", indicates an intended tool call that didn't execute), OR if the response seems clearly incomplete (cut off mid-thought without a natural conclusion), then the **'model'** should speak next.
2.  **Question to User:** If your last response ends with a direct question specifically addressed *to the user*, then the **'user'** should speak next.
3.  **Waiting for User:** If your last response completed a thought, statement, or task *and* does not meet the criteria for Rule 1 (Model Continues) or Rule 2 (Question to User), it implies a pause expecting user input or reaction. In this case, the **'user'** should speak next.`;

const RESPONSE_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    reasoning: {
      type: "string",
      description:
        "Brief explanation justifying the 'next_speaker' choice based *strictly* on the applicable rule and the content/structure of the preceding turn.",
    },
    next_speaker: {
      type: "string",
      enum: ["user", "model"],
      description:
        "Who should speak next based *only* on the preceding turn and the decision rules",
    },
  },
  required: ["reasoning", "next_speaker"],
};

export interface NextSpeakerResponse {
  reasoning: string;
  next_speaker: "user" | "model";
}

const nextSpeaker = async (
  history: Message[]
): Promise<NextSpeakerResponse | null> => {
  const response = await genAI.models.generateContent({
    model: "gemini-2.5-pro",
    contents: [
      ...history,
      {
        role: "user",
        parts: [{ text: CHECK_PROMPT }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });
  return response.text as unknown as NextSpeakerResponse;
};

export { nextSpeaker };
