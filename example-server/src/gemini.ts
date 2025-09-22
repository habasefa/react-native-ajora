import { GoogleGenAI, Part } from "@google/genai";
import { nativeTools } from "./tools/toolsDeclaration";
import { nextSpeaker } from "./nextSpeaker";

const geminiSystemInstruction = `
You are a helpful assistant that can use the following tools to help the user:
${nativeTools.map((tool) => tool.name).join(", ")}
`;

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

export const gemini = async function* (message: any) {
  try {
    const response = await genAI.models.generateContentStream({
      model: "gemini-2.0-flash-lite",
      contents: {
        role: message.role,
        parts: message.parts,
      },
      config: {
        tools: [
          {
            functionDeclarations: nativeTools,
          },
        ],
        systemInstruction: geminiSystemInstruction,
      },
    });

    for await (const chunk of response) {
      yield chunk;
    }
    const nextSpeakerResponse = await nextSpeaker(message.parts);
    if (nextSpeakerResponse && nextSpeakerResponse.next_speaker === "model") {
      yield {
        candidates: [
          {
            content: {
              role: nextSpeakerResponse.next_speaker,
              parts: [{ text: nextSpeakerResponse.reasoning }],
            },
          },
        ],
      };
      gemini(message);
    } else {
      yield {
        candidates: [
          {
            content: {
              role: nextSpeakerResponse?.next_speaker,
              parts: [{ text: nextSpeakerResponse?.reasoning }],
            },
          },
        ],
      };
    }
  } catch (error) {
    console.error("Error in gemini:", error);
    throw error;
  }
};
