import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { mockGen } from "./mockGen";
import { gemini } from "./gemini";

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

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

    let finalText = "";
    const messageId = uuidv4();

    const response = gemini(message);

    for await (const chunk of response) {
      const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      // Accumulate text
      finalText += chunkText;

      const streamedMessage = {
        _id: messageId,
        ...message[0],
        role: chunk.candidates?.[0]?.content?.role,
        parts: [{ text: finalText }],
      };

      // Send incremental update to client
      res.write(`data: ${JSON.stringify(streamedMessage)}\n\n`);
    }

    // Send end event
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

    res.end();
    console.log("SSE stream completed");
  } catch (error: any) {
    console.error("Error in streaming:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

app.listen(port, () => {
  console.log(`AI Backend Server listening on port ${port}`);
  console.log(`Available endpoints:`);
  console.log(`  POST /api/stream - Streaming AI responses`);
});

export default app;
