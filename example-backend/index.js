import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from "uuid";
import { mockResponseText, mockThreadTitle } from "./mockGen.js";

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Streaming endpoint
app.post("/api/stream", async (req, res) => {
  try {
    const { message } = req.body;
    console.log("message in stream", JSON.stringify(message, null, 2));

    if (!message) {
      return res.status(400).json({ error: "Query is required" });
    }
    // Set headers for Server-Sent Events
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

    // const response = await genAI.models.generateContentStream({
    //   model: "gemini-2.0-flash-lite",
    //   contents: {
    //     role: message.role,
    //     parts: message.parts,
    //   },
    // });

    // let finalText = "";
    // const messageId = uuidv4();

    // for await (const chunk of response) {
    //   const chunkText = chunk.candidates[0]?.content?.parts?.[0]?.text ?? "";

    //   // Accumulate text
    //   finalText += chunkText;

    //   const streamedMessage = {
    //     _id: messageId,
    //     ...message[0],
    //     role: chunk.candidates[0].content.role,
    //     parts: [{ text: finalText }],
    //   };

    //   // Send incremental update to client
    //   res.write(`data: ${JSON.stringify(streamedMessage)}\n\n`);
    // }

    // // Send end event
    // res.write(
    //   `data: ${JSON.stringify({
    //     done: true,
    //     data: {
    //       _id: messageId,
    //       ...message[0],
    //       role: "model",
    //       parts: [{ text: finalText }],
    //     },
    //   })}\n\n`
    // );

    /* Mock response */

    let finalText = "";
    const messageId = uuidv4();
    for (const chunk of mockResponseText) {
      finalText += chunk;
      // Send only the delta chunk; client should append
      res.write(
        `data: ${JSON.stringify({ _id: messageId, ...message[0], role: "model", parts: [{ text: chunk }] })}\n\n`
      );
      // Add a small delay between chunks to simulate streaming latency
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Send thread title BEFORE done so client can update UI
    const randomTitle = mockThreadTitle;
    res.write(`data: ${JSON.stringify({ threadTitle: randomTitle })}\n\n`);

    // Final done event with the complete accumulated text
    res.write(
      `data: ${JSON.stringify({
        done: true,
        data: {
          _id: messageId,
          ...message[0],
          role: "model",
          parts: [{ text: finalText }],
        },
      })}\n\n`
    );

    /* End of mock response */

    res.end();
    console.log("SSE stream completed");
  } catch (error) {
    console.error("Error in streaming:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Non-streaming endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Query is required" });
    }

    console.log("Processing query:", message);

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        role: message.role,
        parts: message.parts,
      },
    });

    res.json({
      role: response.candidates[0].content.role,
      parts: response.candidates[0].content.parts,
    });
  } catch (error) {
    console.error("Error in chat:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.json({ message: "AI Backend Server is running!" });
});

app.listen(port, () => {
  console.log(`AI Backend Server listening on port ${port}`);
  console.log(`Available endpoints:`);
  console.log(`  POST /api/stream - Streaming AI responses`);
  console.log(`  POST /api/chat - Non-streaming AI responses`);
});
