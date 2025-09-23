# Database Service

This directory contains the SQLite database service for the Ajora chat application.

## Overview

The `DbService` class provides a complete database layer for managing conversation threads and messages. It uses SQLite3 with proper TypeScript types and error handling.

## Features

- **Thread Management**: Create, read, update, and delete conversation threads
- **Message Management**: Store and retrieve messages with full conversation history
- **Type Safety**: Full TypeScript support with proper interfaces
- **Error Handling**: Comprehensive error handling and logging
- **Performance**: Indexed queries for optimal performance
- **Graceful Shutdown**: Proper database connection cleanup

## Database Schema

### Threads Table

```sql
CREATE TABLE threads (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Messages Table

```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  parts TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES threads (id) ON DELETE CASCADE
);
```

## API Endpoints

The database service is integrated with the following REST endpoints:

- `POST /api/stream` - Stream AI responses with conversation persistence
- `GET /api/threads` - Get all conversation threads
- `GET /api/threads/:threadId/messages` - Get messages for a specific thread
- `POST /api/threads` - Create a new conversation thread
- `PUT /api/threads/:threadId` - Update thread title
- `DELETE /api/threads/:threadId` - Delete a thread and all its messages
- `DELETE /api/messages/:messageId` - Delete a specific message

## Usage

The database service is automatically initialized when the server starts and is used by the agent to maintain conversation context across requests.

### Example Usage

```typescript
import DbService from "./db/dbService";

const dbService = new DbService();
await dbService.initialize();

// Create a new thread
const thread = await dbService.addThread({ title: "My Conversation" });

// Add a message
const message = await dbService.addMessage({
  thread_id: thread.id,
  role: "user",
  parts: [{ text: "Hello, world!" }],
});

// Get conversation history
const messages = await dbService.getMessages(thread.id);
```

## Dependencies

- `sqlite3`: SQLite database driver
- `uuid`: UUID generation for unique IDs
- `@types/sqlite3`: TypeScript definitions

## Installation

The required dependencies are already included in the main `package.json`. To install:

```bash
npm install
```

## Database File

The database file (`ajora.db`) is created in the `db/` directory and will be automatically created on first run.
