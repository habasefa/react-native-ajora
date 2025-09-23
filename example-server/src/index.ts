import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { agent } from "./agent";
import DbService from "../db/dbService";

const app = express();
const port = process.env.PORT || 3000;

// Initialize database
const dbService = new DbService();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database on startup
async function initializeDatabase() {
  try {
    await dbService.initialize();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
}

// Streaming endpoint
app.post("/api/stream", async (req, res) => {
  try {
    const { message, threadId = "" } = req.body;
    console.log("message in stream", JSON.stringify(message, null, 2));
    console.log("threadId received:", threadId);

    if (!message) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Create or get thread
    const thread = threadId
      ? (await dbService.getThread(threadId)) ||
        (await dbService.addThread({ title: "New Conversation" }))
      : await dbService.addThread({ title: "New Conversation" });

    // Save user message to database
    const userMessage = await dbService.addMessage({
      thread_id: thread.id,
      role: "user",
      parts: message.parts || [{ text: JSON.stringify(message) }],
    });

    // Set headers for Server-Sent Events
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

    // Send thread ID to client only once
    res.write(`data: ${JSON.stringify({ threadId: thread.id })}\n\n`);

    const response = agent(message, {
      threadId: thread.id,
      dbService: dbService,
      maxHistoryMessages: 20,
    });
    let modelMessageContent = "";
    let modelMessageParts: any[] = [];

    for await (const chunk of response) {
      // Accumulate model response for database storage
      if (chunk.parts) {
        modelMessageParts = chunk.parts;
        if (chunk.parts[0]?.text) {
          modelMessageContent += chunk.parts[0].text;
        }
      }

      // Stream chunk to client
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    // Save model message to database
    if (modelMessageContent || modelMessageParts.length > 0) {
      // Create final message with accumulated content
      const finalMessageParts = [];

      // Add text content if we have accumulated text
      if (modelMessageContent) {
        finalMessageParts.push({ text: modelMessageContent });
      }

      // Add any non-text parts (like function calls) from the last chunk
      if (modelMessageParts.length > 0) {
        const nonTextParts = modelMessageParts.filter((part) => !part.text);
        finalMessageParts.push(...nonTextParts);
      }

      await dbService.addMessage({
        thread_id: thread.id,
        role: "model",
        parts: finalMessageParts,
      });
    }

    res.end();
    console.log("SSE stream completed");
  } catch (error: any) {
    console.error("Error in streaming:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Get conversation history
app.get("/api/threads", async (req, res) => {
  try {
    const threads = await dbService.getThreads();
    console.log("threads:", threads.length);
    res.json(threads);
  } catch (error: any) {
    console.error("Error getting threads:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a specific thread
app.get("/api/threads/:threadId/messages", async (req, res) => {
  try {
    const { threadId } = req.params;
    const messages = await dbService.getMessages(threadId);
    console.log("messages:", messages.length);
    res.json(messages);
  } catch (error: any) {
    console.error("Error getting messages:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create new thread
app.post("/api/threads", async (req, res) => {
  try {
    const { title } = req.body;
    const thread = await dbService.addThread({
      title: title || "New Conversation",
    });
    res.json(thread);
  } catch (error: any) {
    console.error("Error creating thread:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update thread title
app.put("/api/threads/:threadId", async (req, res) => {
  try {
    const { threadId } = req.params;
    const { title } = req.body;
    const thread = await dbService.updateThread(threadId, { title });
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    res.json(thread);
  } catch (error: any) {
    console.error("Error updating thread:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete thread
app.delete("/api/threads/:threadId", async (req, res) => {
  try {
    const { threadId } = req.params;
    const deleted = await dbService.deleteThread(threadId);
    if (!deleted) {
      return res.status(404).json({ error: "Thread not found" });
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting thread:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete message
app.delete("/api/messages/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const deleted = await dbService.deleteMessage(messageId);
    if (!deleted) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, async () => {
  await initializeDatabase();
  console.log(`AI Backend Server listening on port ${port}`);
  console.log(`Available endpoints:`);
  console.log(`  POST /api/stream - Streaming AI responses`);
  console.log(`  GET /api/threads - Get all conversation threads`);
  console.log(
    `  GET /api/threads/:threadId/messages - Get messages for a thread`
  );
  console.log(`  POST /api/threads - Create new conversation thread`);
  console.log(`  PUT /api/threads/:threadId - Update thread title`);
  console.log(`  DELETE /api/threads/:threadId - Delete thread`);
  console.log(`  DELETE /api/messages/:messageId - Delete message`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await dbService.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await dbService.close();
  process.exit(0);
});

export default app;
