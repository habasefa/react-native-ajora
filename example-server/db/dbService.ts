import path from "path";
import sqlite3 from "sqlite3";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";

export interface Thread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  _id: string;
  thread_id: string;
  role: "user" | "model";
  parts: any[];
  created_at: string;
  updated_at: string;
}

class DbService {
  private db_path: string;
  private db: sqlite3.Database | null = null;

  constructor() {
    this.db_path = path.join(__dirname, "ajora.db");
  }

  // Initialize database connection and create tables
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.db_path, (err) => {
        if (err) {
          console.error("Error opening database:", err);
          reject(err);
          return;
        }
        console.log("Connected to SQLite database");
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const run = promisify(this.db.run.bind(this.db));

    try {
      // Create threads table
      await run(`
        CREATE TABLE IF NOT EXISTS threads (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create messages table
      await run(`
        CREATE TABLE IF NOT EXISTS messages (
          _id TEXT PRIMARY KEY,
          thread_id TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'model')),
          parts TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (thread_id) REFERENCES threads (id) ON DELETE CASCADE
        )
      `);

      // Create indexes for better performance
      await run(
        `CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages (thread_id)`
      );
      await run(
        `CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at)`
      );
      await run(
        `CREATE INDEX IF NOT EXISTS idx_threads_updated_at ON threads (updated_at)`
      );

      console.log("Database tables created successfully");
    } catch (error) {
      console.error("Error creating tables:", error);
      throw error;
    }
  }

  // Thread methods
  async addThread(
    thread: Omit<Thread, "id" | "created_at" | "updated_at">
  ): Promise<Thread> {
    if (!this.db) throw new Error("Database not initialized");

    const run = promisify(this.db.run.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any>;
    const _id = uuidv4();
    const now = new Date().toISOString();

    try {
      await run(
        `INSERT INTO threads (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)`,
        [_id, thread.title, now, now]
      );

      return {
        id: _id,
        title: thread.title,
        created_at: now,
        updated_at: now,
      };
    } catch (error) {
      console.error("Error adding thread:", error);
      throw error;
    }
  }

  async getThreads(): Promise<Thread[]> {
    if (!this.db) throw new Error("Database not initialized");

    const all = promisify(this.db.all.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any[]>;

    try {
      const threads = await all(
        `SELECT * FROM threads ORDER BY updated_at DESC`
      );
      return threads as Thread[];
    } catch (error) {
      console.error("Error getting threads:", error);
      throw error;
    }
  }

  async getThread(id: string): Promise<Thread | null> {
    if (!this.db) throw new Error("Database not initialized");

    const get = promisify(this.db.get.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any>;

    try {
      const thread = await get(`SELECT * FROM threads WHERE id = ?`, [id]);
      return thread as Thread | null;
    } catch (error) {
      console.error("Error getting thread:", error);
      throw error;
    }
  }

  async updateThread(
    id: string,
    updates: Partial<Pick<Thread, "title">>
  ): Promise<Thread | null> {
    if (!this.db) throw new Error("Database not initialized");

    const run = promisify(this.db.run.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any>;
    const get = promisify(this.db.get.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any>;

    try {
      const setClause = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");

      if (setClause) {
        await run(
          `UPDATE threads SET ${setClause}, updated_at = ? WHERE id = ?`,
          [...Object.values(updates), new Date().toISOString(), id]
        );
      }

      const updatedThread = await get(`SELECT * FROM threads WHERE id = ?`, [
        id,
      ]);
      return updatedThread as Thread | null;
    } catch (error) {
      console.error("Error updating thread:", error);
      throw error;
    }
  }

  async deleteThread(id: string): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");

    const run = promisify(this.db.run.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any>;

    try {
      const result = await run(`DELETE FROM threads WHERE id = ?`, [id]);
      return (result as any).changes > 0;
    } catch (error) {
      console.error("Error deleting thread:", error);
      throw error;
    }
  }

  // Message methods
  async addMessage(
    message: Omit<Message, "_id" | "created_at" | "updated_at">
  ): Promise<Message> {
    if (!this.db) throw new Error("Database not initialized");

    const run = promisify(this.db.run.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any>;
    const _id = uuidv4();
    const now = new Date().toISOString();

    try {
      await run(
        `INSERT INTO messages (_id, thread_id, role, parts, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          _id,
          message.thread_id,
          message.role,
          JSON.stringify(message.parts),
          now,
          now,
        ]
      );

      return {
        _id,
        thread_id: message.thread_id,
        role: message.role,
        parts: message.parts,
        created_at: now,
        updated_at: now,
      };
    } catch (error) {
      console.error("Error adding message:", error);
      throw error;
    }
  }

  async getMessages(thread_id: string): Promise<Message[]> {
    if (!this.db) throw new Error("Database not initialized");

    const all = promisify(this.db.all.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any[]>;

    try {
      const messages = await all(
        `SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at DESC`,
        [thread_id]
      );

      return messages.map((msg: any) => ({
        ...msg,
        parts: JSON.parse(msg.parts),
      })) as Message[];
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  }

  async getMessage(_id: string): Promise<Message | null> {
    if (!this.db) throw new Error("Database not initialized");

    const get = promisify(this.db.get.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any>;

    try {
      const message = await get(`SELECT * FROM messages WHERE _id = ?`, [_id]);
      if (!message) return null;

      return {
        ...message,
        parts: JSON.parse(message.parts),
      } as Message;
    } catch (error) {
      console.error("Error getting message:", error);
      throw error;
    }
  }

  async updateMessage(
    _id: string,
    updates: Partial<Pick<Message, "parts">>
  ): Promise<Message | null> {
    if (!this.db) throw new Error("Database not initialized");

    const run = promisify(this.db.run.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any>;
    const get = promisify(this.db.get.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any>;

    try {
      const setClause = Object.keys(updates)
        .map((key) => (key === "parts" ? "parts = ?" : `${key} = ?`))
        .join(", ");

      if (setClause) {
        const values = Object.entries(updates).map(([key, value]) =>
          key === "parts" ? JSON.stringify(value) : value
        );

        await run(
          `UPDATE messages SET ${setClause}, updated_at = ? WHERE _id = ?`,
          [...values, new Date().toISOString(), _id]
        );
      }

      const updatedMessage = await get(`SELECT * FROM messages WHERE _id = ?`, [
        _id,
      ]);
      if (!updatedMessage) return null;

      return {
        ...updatedMessage,
        parts: JSON.parse(updatedMessage.parts),
      } as Message;
    } catch (error) {
      console.error("Error updating message:", error);
      throw error;
    }
  }

  async deleteMessage(_id: string): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");

    const run = promisify(this.db.run.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any>;

    try {
      const result = await run(`DELETE FROM messages WHERE _id = ?`, [_id]);
      return (result as any).changes > 0;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  }

  // Utility methods
  async getOrCreateThread(title: string): Promise<Thread> {
    const existingThreads = await this.getThreads();
    const existingThread = existingThreads.find((t) => t.title === title);

    if (existingThread) {
      return existingThread;
    }

    return await this.addThread({ title });
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) {
            console.error("Error closing database:", err);
            reject(err);
          } else {
            console.log("Database connection closed");
            resolve();
          }
        });
      });
    }
  }
}

export default DbService;
