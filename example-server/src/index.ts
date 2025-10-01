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

// Bearer token middleware - log the token passed to the server
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log(`[Ajora:Server]: Bearer token received: ${token}`);
    (req as any).bearerToken = token;
  } else {
    console.log("[Ajora:Server]: No bearer token provided");
  }
  next();
});

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
app.get("/api/stream", async (req, res) => {
  console.log("[Ajora:Server]: Streaming request received", req.query);
  try {
    const { type, message, mode } = req.query;

    if (!message) {
      return res
        .status(400)
        .json({ error: "Message is required in user query" });
    } else if (!type) {
      return res.status(400).json({ error: "Type is required in user query" });
    }

    // Parse the message from JSON string
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message as string);
    } catch (parseError) {
      return res.status(400).json({ error: "Invalid message format" });
    }

    const query = {
      type: type as "text" | "function_response",
      message: parsedMessage,
      mode: mode as string | undefined,
    };

    // Set headers for Server-Sent Events
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

    // Set up cooperative abort. When client disconnects, abort downstream work.
    const abortController = new AbortController();
    const { signal } = abortController;

    // Flush headers to establish SSE before we begin streaming
    try {
      // @ts-ignore - not all types expose flushHeaders
      if (typeof (res as any).flushHeaders === "function") {
        (res as any).flushHeaders();
      }
    } catch {}

    // Use response close to detect actual stream closure
    res.on("close", () => {
      if (!signal.aborted) abortController.abort();
      try {
        res.end();
      } catch {}
    });

    const response = agent(
      query,
      dbService,
      mode as "agent" | "assistant" | undefined,
      signal
    );

    // Inform client that a new stream has started (isComplete=false)
    res.write(
      `data: ${JSON.stringify({ type: "complete", is_complete: false })}\n\n`
    );

    for await (const chunk of response) {
      if (signal.aborted) break;
      // Stream chunk to client
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    if (signal.aborted) {
      try {
        res.end();
      } catch {}
      return;
    }

    // After streaming completes, compute and send updated thread title
    try {
      const historyForTitle = await dbService.getMessages(
        parsedMessage.thread_id
      );
      // Count only user messages for more robust title updates
      const userMessages = historyForTitle.filter((msg) => msg.role === "user");
      const userMessageCount = userMessages.length;
      // Only update the title on the first user message or every 5 user messages
      if (userMessageCount === 1 || userMessageCount % 5 === 0) {
        // Only use the last 10 messages for the title
        const lastTenMessages = historyForTitle.slice(-10);
        if (signal.aborted) {
          try {
            res.end();
          } catch {}
          return;
        }
        const title = await threadTitleUpdate(lastTenMessages);

        if (title) {
          await dbService.updateThread(parsedMessage.thread_id, { title });
          res.write(
            `data: ${JSON.stringify({ type: "thread_title", threadTitle: title })}\n\n`
          );
        }
      }
    } catch (e) {
      console.warn("[Ajora:Server]: Failed to update thread title:", e);
    }

    // Inform client that the stream completed normally (isComplete=true)
    res.write(
      `data: ${JSON.stringify({ type: "complete", is_complete: true })}\n\n`
    );

    res.end();
  } catch (error: any) {
    console.error("[Ajora:Server]: Error in streaming:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.write(
      `data: ${JSON.stringify({ type: "complete", is_complete: true })}\n\n`
    );
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

// Get messages for a specific thread with pagination support
app.get("/api/threads/:threadId/messages", async (req, res) => {
  try {
    const { threadId } = req.params;
    const { limit, offset } = req.query;

    // Parse pagination parameters
    const limitNum = limit ? parseInt(limit as string, 10) : undefined;
    const offsetNum = offset ? parseInt(offset as string, 10) : undefined;

    // Get messages with pagination
    const messages = await dbService.getMessages(threadId, limitNum, offsetNum);

    // Get total count for pagination metadata
    const totalCount = await dbService.getMessagesCount(threadId);

    const response = {
      messages,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum || 0,
        hasMore:
          offsetNum !== undefined && limitNum !== undefined
            ? offsetNum + limitNum < totalCount
            : messages.length > 0,
      },
    };

    console.log(
      `[Ajora:Server]: Retrieved ${messages.length} messages for thread ${threadId} (${offsetNum || 0}-${(offsetNum || 0) + messages.length}/${totalCount})`
    );
    res.json(response);
  } catch (error: any) {
    console.error("[Ajora:Server]: Error getting messages:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create new thread
app.post("/api/threads", async (req, res) => {
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
  console.log(`  GET /api/stream - Streaming AI responses`);
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
