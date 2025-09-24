import { GoogleGenAI } from "@google/genai";
import { nativeTools } from "./tools/toolsDeclaration";
import { basePrompt } from "./system_prompt";
import { Message } from "./agent";

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

export const threadTitleUpdate = async (history: Message[]) => {
  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: [
      ...history,
      {
        role: "user",
        parts: [
          {
            text: `Given the history of the thread, write a title for the thread`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
        },
        required: ["title"],
      },
    },
  });
  return response.text;
};
