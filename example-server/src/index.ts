import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { agent } from "./agent";
import { threadTitleUpdate } from "./gemini";
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
  } catch (error) {
    console.error("[Ajora:Server]: Failed to initialize database:", error);
    process.exit(1);
  }
}

// Streaming endpoint
app.post("/api/stream", async (req, res) => {
  console.log(
    "[Ajora:Server]: Recieved query",
    JSON.stringify(req.body, null, 2)
  );
  try {
    const query = req.body;
    const { type, message } = query;
    if (!message) {
      return res
        .status(400)
        .json({ error: "Message is required in user query" });
    } else if (!type) {
      return res.status(400).json({ error: "Type is required in user query" });
    }

    // Set headers for Server-Sent Events
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

    const response = agent(query, dbService);

    for await (const chunk of response) {
      // Stream chunk to client
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    // After streaming completes, compute and send updated thread title
    try {
      const historyForTitle = await dbService.getMessages(message.thread_id);
      const totalMessages = historyForTitle.length;
      // Only update the title on the first turn (<= 2 messages) or every 10 messages
      if (totalMessages <= 2 || totalMessages % 10 === 0) {
        // Only use the last 10 messages for the title
        const lastTenMessages = historyForTitle.slice(-10);
        const title = await threadTitleUpdate(lastTenMessages);

        if (title) {
          await dbService.updateThread(message.thread_id, { title });
          res.write(
            `data: ${JSON.stringify({ type: "thread_title", threadTitle: title })}\n\n`
          );
        }
      }
    } catch (e) {
      console.warn("[Ajora:Server]: Failed to update thread title:", e);
    }

    res.end();
  } catch (error: any) {
    console.error("[Ajora:Server]: Error in streaming:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Get conversation history
app.get("/api/threads", async (req, res) => {
  try {
    const threads = await dbService.getThreads();
    console.log("[Ajora:Server]: threads:", threads.length);
    res.json(threads);
  } catch (error: any) {
    console.error("[Ajora:Server]: Error getting threads:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a specific thread
app.get("/api/threads/:threadId/messages", async (req, res) => {
  try {
    const { threadId } = req.params;
    const messages = await dbService.getMessages(threadId);
    console.log("[Ajora:Server]: messages:", messages.length);
    res.json(messages);
  } catch (error: any) {
    console.error("[Ajora:Server]: Error getting messages:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create new thread
app.post("/api/threads", async (req, res) => {
  console.log("[Ajora:Server]: createThread in API", req.body);
  try {
    const title =
      (req.body && (req.body as any).title) ??
      ((req.query as any)?.title as string | undefined) ??
      "New Conversation";
    const thread = await dbService.addThread({
      title,
    });
    res.json(thread);
  } catch (error: any) {
    console.error("[Ajora:Server]: Error creating thread:", error);
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
    console.error("[Ajora:Server]: Error updating thread:", error);
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
    console.error("[Ajora:Server]: Error deleting thread:", error);
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
    console.error("[Ajora:Server]: Error deleting message:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, async () => {
  await initializeDatabase();
  console.log(`[Ajora:Server]: AI Backend Server listening on port ${port}`);
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
  console.log("[Ajora:Server]: Shutting down gracefully...");
  await dbService.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("[Ajora:Server]: Shutting down gracefully...");
  await dbService.close();
  process.exit(0);
});

export default app;
