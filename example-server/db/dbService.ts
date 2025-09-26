import path from "path";
import sqlite3 from "sqlite3";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import { Part } from "@google/genai";

export interface Thread {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  _id: string;
  thread_id: string;
  role: "user" | "model";
  parts: Part[];
  created_at?: string;
  updated_at?: string;
}

export interface TodoList {
  id: string;
  thread_id: string;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface Todo {
  id: string;
  todo_list_id: string;
  name: string;
  status: "queue" | "executing" | "completed" | "error";
  created_at?: string;
  updated_at?: string;
}

export interface TodoListWithTodos extends TodoList {
  todos: Todo[];
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

      // Create todo_lists table
      await run(`
        CREATE TABLE IF NOT EXISTS todo_lists (
          id TEXT PRIMARY KEY,
          thread_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (thread_id) REFERENCES threads (id) ON DELETE CASCADE
        )
      `);

      // Create todos table
      await run(`
        CREATE TABLE IF NOT EXISTS todos (
          id TEXT PRIMARY KEY,
          todo_list_id TEXT NOT NULL,
          name TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('queue', 'executing', 'completed', 'error')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (todo_list_id) REFERENCES todo_lists (id) ON DELETE CASCADE
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
      await run(
        `CREATE INDEX IF NOT EXISTS idx_todo_lists_thread_id ON todo_lists (thread_id)`
      );
      await run(
        `CREATE INDEX IF NOT EXISTS idx_todos_todo_list_id ON todos (todo_list_id)`
      );
      await run(
        `CREATE INDEX IF NOT EXISTS idx_todos_status ON todos (status)`
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

  // TodoList methods
  async addTodoList(
    todoList: Omit<TodoList, "id" | "created_at" | "updated_at">
  ): Promise<TodoList> {
    if (!this.db) throw new Error("Database not initialized");

    const run = promisify(this.db.run.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any>;
    const _id = uuidv4();
    const now = new Date().toISOString();

    try {
      await run(
        `INSERT INTO todo_lists (id, thread_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [_id, todoList.thread_id, todoList.name, todoList.description, now, now]
      );

      return {
        id: _id,
        thread_id: todoList.thread_id,
        name: todoList.name,
        description: todoList.description,
        created_at: now,
        updated_at: now,
      };
    } catch (error) {
      console.error("Error adding todo list:", error);
      throw error;
    }
  }

  async getTodoLists(thread_id: string): Promise<TodoList[]> {
    if (!this.db) throw new Error("Database not initialized");

    const all = promisify(this.db.all.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any[]>;

    try {
      const todoLists = await all(
        `SELECT * FROM todo_lists WHERE thread_id = ? ORDER BY created_at DESC`,
        [thread_id]
      );
      return todoLists as TodoList[];
    } catch (error) {
      console.error("Error getting todo lists:", error);
      throw error;
    }
  }

  async getTodoListsWithTodos(thread_id: string): Promise<TodoListWithTodos[]> {
    if (!this.db) throw new Error("Database not initialized");

    const all = promisify(this.db.all.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any[]>;

    try {
      const todoListsWithTodos = await all(
        `SELECT 
          tl.id as todo_list_id,
          tl.thread_id,
          tl.name as todo_list_name,
          tl.description,
          tl.created_at as todo_list_created_at,
          tl.updated_at as todo_list_updated_at,
          t.id as todo_id,
          t.name as todo_name,
          t.status,
          t.created_at as todo_created_at,
          t.updated_at as todo_updated_at
        FROM todo_lists tl
        LEFT JOIN todos t ON tl.id = t.todo_list_id
        WHERE tl.thread_id = ?
        ORDER BY tl.created_at DESC, t.created_at ASC`,
        [thread_id]
      );

      // Group the results by todo list
      const todoListMap = new Map<string, TodoListWithTodos>();

      for (const row of todoListsWithTodos) {
        const todoListId = row.todo_list_id;

        if (!todoListMap.has(todoListId)) {
          todoListMap.set(todoListId, {
            id: todoListId,
            thread_id: row.thread_id,
            name: row.todo_list_name,
            description: row.description,
            created_at: row.todo_list_created_at,
            updated_at: row.todo_list_updated_at,
            todos: [],
          });
        }

        // Add todo if it exists (LEFT JOIN might return null for todos)
        if (row.todo_id) {
          const todoList = todoListMap.get(todoListId)!;
          todoList.todos.push({
            id: row.todo_id,
            todo_list_id: todoListId,
            name: row.todo_name,
            status: row.status,
            created_at: row.todo_created_at,
            updated_at: row.todo_updated_at,
          });
        }
      }

      return Array.from(todoListMap.values());
    } catch (error) {
      console.error("Error getting todo lists with todos:", error);
      throw error;
    }
  }

  async getTodoList(id: string): Promise<TodoList | null> {
    if (!this.db) throw new Error("Database not initialized");

    const get = promisify(this.db.get.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any>;

    try {
      const todoList = await get(`SELECT * FROM todo_lists WHERE id = ?`, [id]);
      return todoList as TodoList | null;
    } catch (error) {
      console.error("Error getting todo list:", error);
      throw error;
    }
  }

  async getTodoListWithTodos(id: string): Promise<TodoListWithTodos | null> {
    if (!this.db) throw new Error("Database not initialized");

    const all = promisify(this.db.all.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any[]>;

    try {
      const todoListWithTodos = await all(
        `SELECT 
          tl.id as todo_list_id,
          tl.thread_id,
          tl.name as todo_list_name,
          tl.description,
          tl.created_at as todo_list_created_at,
          tl.updated_at as todo_list_updated_at,
          t.id as todo_id,
          t.name as todo_name,
          t.status,
          t.created_at as todo_created_at,
          t.updated_at as todo_updated_at
        FROM todo_lists tl
        LEFT JOIN todos t ON tl.id = t.todo_list_id
        WHERE tl.id = ?
        ORDER BY t.created_at ASC`,
        [id]
      );

      if (todoListWithTodos.length === 0) {
        return null;
      }

      // Build the todo list with todos
      const firstRow = todoListWithTodos[0];
      const todoList: TodoListWithTodos = {
        id: firstRow.todo_list_id,
        thread_id: firstRow.thread_id,
        name: firstRow.todo_list_name,
        description: firstRow.description,
        created_at: firstRow.todo_list_created_at,
        updated_at: firstRow.todo_list_updated_at,
        todos: [],
      };

      // Add all todos
      for (const row of todoListWithTodos) {
        if (row.todo_id) {
          todoList.todos.push({
            id: row.todo_id,
            todo_list_id: firstRow.todo_list_id,
            name: row.todo_name,
            status: row.status,
            created_at: row.todo_created_at,
            updated_at: row.todo_updated_at,
          });
        }
      }

      return todoList;
    } catch (error) {
      console.error("Error getting todo list with todos:", error);
      throw error;
    }
  }

  async updateTodoList(
    id: string,
    updates: Partial<Pick<TodoList, "name" | "description">>
  ): Promise<TodoList | null> {
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
          `UPDATE todo_lists SET ${setClause}, updated_at = ? WHERE id = ?`,
          [...Object.values(updates), new Date().toISOString(), id]
        );
      }

      const updatedTodoList = await get(
        `SELECT * FROM todo_lists WHERE id = ?`,
        [id]
      );
      return updatedTodoList as TodoList | null;
    } catch (error) {
      console.error("Error updating todo list:", error);
      throw error;
    }
  }

  async deleteTodoList(id: string): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");

    const run = promisify(this.db.run.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any>;

    try {
      const result = await run(`DELETE FROM todo_lists WHERE id = ?`, [id]);
      return (result as any).changes > 0;
    } catch (error) {
      console.error("Error deleting todo list:", error);
      throw error;
    }
  }

  // Todo methods
  async addTodo(
    todo: Omit<Todo, "id" | "created_at" | "updated_at">
  ): Promise<Todo> {
    if (!this.db) throw new Error("Database not initialized");

    const run = promisify(this.db.run.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any>;
    const _id = uuidv4();
    const now = new Date().toISOString();

    try {
      await run(
        `INSERT INTO todos (id, todo_list_id, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [_id, todo.todo_list_id, todo.name, todo.status, now, now]
      );

      return {
        id: _id,
        todo_list_id: todo.todo_list_id,
        name: todo.name,
        status: todo.status,
        created_at: now,
        updated_at: now,
      };
    } catch (error) {
      console.error("Error adding todo:", error);
      throw error;
    }
  }

  async getTodos(todo_list_id: string): Promise<Todo[]> {
    if (!this.db) throw new Error("Database not initialized");

    const all = promisify(this.db.all.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any[]>;

    try {
      const todos = await all(
        `SELECT * FROM todos WHERE todo_list_id = ? ORDER BY created_at ASC`,
        [todo_list_id]
      );
      return todos as Todo[];
    } catch (error) {
      console.error("Error getting todos:", error);
      throw error;
    }
  }

  async getTodo(id: string): Promise<Todo | null> {
    if (!this.db) throw new Error("Database not initialized");

    const get = promisify(this.db.get.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any>;

    try {
      const todo = await get(`SELECT * FROM todos WHERE id = ?`, [id]);
      return todo as Todo | null;
    } catch (error) {
      console.error("Error getting todo:", error);
      throw error;
    }
  }

  async updateTodo(
    id: string,
    updates: Partial<Pick<Todo, "name" | "status">>
  ): Promise<Todo | null> {
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
          `UPDATE todos SET ${setClause}, updated_at = ? WHERE id = ?`,
          [...Object.values(updates), new Date().toISOString(), id]
        );
      }

      const updatedTodo = await get(`SELECT * FROM todos WHERE id = ?`, [id]);
      return updatedTodo as Todo | null;
    } catch (error) {
      console.error("Error updating todo:", error);
      throw error;
    }
  }

  async deleteTodo(id: string): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");

    const run = promisify(this.db.run.bind(this.db)) as (
      sql: string,
      params?: any[]
    ) => Promise<any>;

    try {
      const result = await run(`DELETE FROM todos WHERE id = ?`, [id]);
      return (result as any).changes > 0;
    } catch (error) {
      console.error("Error deleting todo:", error);
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
