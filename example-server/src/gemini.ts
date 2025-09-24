import { GoogleGenAI, Type } from "@google/genai";
import { nativeTools } from "./tools/toolsDeclaration";
import { basePrompt } from "./system_prompt";
import { Message } from "../db/dbService";

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is not set. Create example-backend/.env and set GEMINI_API_KEY."
  );
}

const genAI = new GoogleGenAI({
  apiKey,
});

export const gemini = async function* (message: Message[]) {
  try {
    if (message.length === 0) {
      throw new Error("Message is empty");
    }
    const formattedMessage = message.map((message) => ({
      role: message.role,
      parts: message.parts,
    }));
    const response = await genAI.models.generateContentStream({
      model: "gemini-2.5-pro",
      contents: formattedMessage,
      config: {
        tools: [
          {
            functionDeclarations: nativeTools,
          },
        ],
        systemInstruction: basePrompt,
      },
    });

    for await (const chunk of response) {
      yield chunk;
    }
  } catch (error) {
    console.error("Error in gemini:", error);
  }
};

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
    model: "gemini-2.0-flash-lite",
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
  const nextSpeaker = JSON.parse(response.text ?? "") as NextSpeakerResponse;
  return nextSpeaker;
};

export { nextSpeaker };

export const threadTitleUpdate = async (history: Message[]) => {
  // Sanitize history: keep only text parts to avoid passing function calls/responses
  const sanitized = history
    .map((msg) => {
      const textParts = (msg.parts || [])
        .map((p: any) => (p && p.text ? { text: p.text } : null))
        .filter(Boolean) as { text: string }[];
      if (textParts.length === 0) return null;
      return {
        role: msg.role,
        parts: textParts,
      } as any;
    })
    .filter(Boolean) as any[];

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [
        ...sanitized,
        {
          role: "user",
          parts: [
            {
              text: "Given the conversation above, respond with a title for the thread in 3-4 words.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
          },
          required: ["title"],
        },
      },
    });

    const title = JSON.parse(response.text ?? "");

    return title.title;
  } catch (error) {
    console.error("Error in threadTitleUpdate:", error);
    return "Untitled Thread";
  }
};
