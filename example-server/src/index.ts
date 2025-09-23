import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { agent } from "./agent";

const app = express();
const port = process.env.PORT || 3000;
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

    const response = agent(message);

    for await (const message of response) {
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    }

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
