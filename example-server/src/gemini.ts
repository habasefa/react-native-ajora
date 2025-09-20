import { GoogleGenAI } from "@google/genai";

export const gemini = async function* (message: any) {
  try {
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

    const response = await genAI.models.generateContentStream({
      model: "gemini-2.0-flash-lite",
      contents: {
        role: message.role,
        parts: message.parts,
      },
    });

    for await (const chunk of response) {
      yield chunk;
    }
  } catch (error) {
    console.error("Error in gemini:", error);
    throw error;
  }
};
