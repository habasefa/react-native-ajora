"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const util_1 = require("util");
const uuid_1 = require("uuid");
class DbService {
    constructor() {
        this.db = null;
        this.db_path = path_1.default.join(__dirname, "ajora.db");
    }
    // Initialize database connection and create tables
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db = new sqlite3_1.default.Database(this.db_path, (err) => {
                    if (err) {
                        console.error("Error opening database:", err);
                        reject(err);
                        return;
                    }
                    console.log("Connected to SQLite database");
                    this.createTables().then(resolve).catch(reject);
                });
            });
        });
    }
    createTables() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const run = (0, util_1.promisify)(this.db.run.bind(this.db));
            try {
                // Create threads table
                yield run(`
        CREATE TABLE IF NOT EXISTS threads (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
                // Create messages table
                yield run(`
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
                yield run(`
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
                yield run(`
        CREATE TABLE IF NOT EXISTS todos (
          id TEXT PRIMARY KEY,
          todo_list_id TEXT NOT NULL,
          name TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('queue', 'completed', 'error')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (todo_list_id) REFERENCES todo_lists (id) ON DELETE CASCADE
        )
      `);
                // Create indexes for better performance
                yield run(`CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages (thread_id)`);
                yield run(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at)`);
                yield run(`CREATE INDEX IF NOT EXISTS idx_threads_updated_at ON threads (updated_at)`);
                yield run(`CREATE INDEX IF NOT EXISTS idx_todo_lists_thread_id ON todo_lists (thread_id)`);
                yield run(`CREATE INDEX IF NOT EXISTS idx_todos_todo_list_id ON todos (todo_list_id)`);
                yield run(`CREATE INDEX IF NOT EXISTS idx_todos_status ON todos (status)`);
                console.log("Database tables created successfully");
            }
            catch (error) {
                console.error("Error creating tables:", error);
                throw error;
            }
        });
    }
    // Thread methods
    addThread(thread) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const run = (0, util_1.promisify)(this.db.run.bind(this.db));
            const _id = (0, uuid_1.v4)();
            const now = new Date().toISOString();
            try {
                yield run(`INSERT INTO threads (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)`, [_id, thread.title, now, now]);
                return {
                    id: _id,
                    title: thread.title,
                    created_at: now,
                    updated_at: now,
                };
            }
            catch (error) {
                console.error("Error adding thread:", error);
                throw error;
            }
        });
    }
    getThreads() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const all = (0, util_1.promisify)(this.db.all.bind(this.db));
            try {
                const threads = yield all(`SELECT * FROM threads ORDER BY updated_at DESC`);
                return threads;
            }
            catch (error) {
                console.error("Error getting threads:", error);
                throw error;
            }
        });
    }
    getThread(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const get = (0, util_1.promisify)(this.db.get.bind(this.db));
            try {
                const thread = yield get(`SELECT * FROM threads WHERE id = ?`, [id]);
                return thread;
            }
            catch (error) {
                console.error("Error getting thread:", error);
                throw error;
            }
        });
    }
    updateThread(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const run = (0, util_1.promisify)(this.db.run.bind(this.db));
            const get = (0, util_1.promisify)(this.db.get.bind(this.db));
            try {
                const setClause = Object.keys(updates)
                    .map((key) => `${key} = ?`)
                    .join(", ");
                if (setClause) {
                    yield run(`UPDATE threads SET ${setClause}, updated_at = ? WHERE id = ?`, [...Object.values(updates), new Date().toISOString(), id]);
                }
                const updatedThread = yield get(`SELECT * FROM threads WHERE id = ?`, [
                    id,
                ]);
                return updatedThread;
            }
            catch (error) {
                console.error("Error updating thread:", error);
                throw error;
            }
        });
    }
    deleteThread(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const run = (0, util_1.promisify)(this.db.run.bind(this.db));
            try {
                const result = yield run(`DELETE FROM threads WHERE id = ?`, [id]);
                return result.changes > 0;
            }
            catch (error) {
                console.error("Error deleting thread:", error);
                throw error;
            }
        });
    }
    // Message methods
    addMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const run = (0, util_1.promisify)(this.db.run.bind(this.db));
            const _id = message._id || (0, uuid_1.v4)();
            const now = new Date().toISOString();
            try {
                yield run(`INSERT INTO messages (_id, thread_id, role, parts, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, [
                    _id,
                    message.thread_id,
                    message.role,
                    JSON.stringify(message.parts),
                    now,
                    now,
                ]);
                return {
                    _id,
                    thread_id: message.thread_id,
                    role: message.role,
                    parts: message.parts,
                    created_at: now,
                    updated_at: now,
                };
            }
            catch (error) {
                console.error("Error adding message:", error);
                throw error;
            }
        });
    }
    getMessages(thread_id, limit, offset) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const all = (0, util_1.promisify)(this.db.all.bind(this.db));
            try {
                let sql = `SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at DESC`;
                const params = [thread_id];
                if (limit !== undefined) {
                    sql += ` LIMIT ?`;
                    params.push(limit);
                    if (offset !== undefined) {
                        sql += ` OFFSET ?`;
                        params.push(offset);
                    }
                }
                const messages = yield all(sql, params);
                return messages.map((msg) => (Object.assign(Object.assign({}, msg), { parts: JSON.parse(msg.parts) })));
            }
            catch (error) {
                console.error("Error getting messages:", error);
                throw error;
            }
        });
    }
    getMessagesCount(thread_id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const get = (0, util_1.promisify)(this.db.get.bind(this.db));
            try {
                const result = yield get(`SELECT COUNT(*) as count FROM messages WHERE thread_id = ?`, [thread_id]);
                return (result === null || result === void 0 ? void 0 : result.count) || 0;
            }
            catch (error) {
                console.error("Error getting messages count:", error);
                throw error;
            }
        });
    }
    getMessage(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const get = (0, util_1.promisify)(this.db.get.bind(this.db));
            try {
                const message = yield get(`SELECT * FROM messages WHERE _id = ?`, [_id]);
                if (!message)
                    return null;
                return Object.assign(Object.assign({}, message), { parts: JSON.parse(message.parts) });
            }
            catch (error) {
                console.error("Error getting message:", error);
                throw error;
            }
        });
    }
    updateMessage(_id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            if (!Array.isArray(updates.parts)) {
                console.warn("[WARN] Message parts parsed to non-array:", updates.parts);
            }
            const run = (0, util_1.promisify)(this.db.run.bind(this.db));
            const get = (0, util_1.promisify)(this.db.get.bind(this.db));
            try {
                const setClause = Object.keys(updates)
                    .map((key) => (key === "parts" ? "parts = ?" : `${key} = ?`))
                    .join(", ");
                if (setClause) {
                    const values = Object.entries(updates).map(([key, value]) => key === "parts" ? JSON.stringify(value) : value);
                    yield run(`UPDATE messages SET ${setClause}, updated_at = ? WHERE _id = ?`, [...values, new Date().toISOString(), _id]);
                }
                const updatedMessage = yield get(`SELECT * FROM messages WHERE _id = ?`, [
                    _id,
                ]);
                if (!updatedMessage)
                    return null;
                return Object.assign(Object.assign({}, updatedMessage), { parts: JSON.parse(updatedMessage.parts) });
            }
            catch (error) {
                console.error("Error updating message:", error);
                throw error;
            }
        });
    }
    deleteMessage(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const run = (0, util_1.promisify)(this.db.run.bind(this.db));
            try {
                const result = yield run(`DELETE FROM messages WHERE _id = ?`, [_id]);
                return result.changes > 0;
            }
            catch (error) {
                console.error("Error deleting message:", error);
                throw error;
            }
        });
    }
    // TodoList methods
    addTodoList(todoList) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const run = (0, util_1.promisify)(this.db.run.bind(this.db));
            const _id = (0, uuid_1.v4)();
            const now = new Date().toISOString();
            try {
                yield run(`INSERT INTO todo_lists (id, thread_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, [_id, todoList.thread_id, todoList.name, todoList.description, now, now]);
                return {
                    id: _id,
                    thread_id: todoList.thread_id,
                    name: todoList.name,
                    description: todoList.description,
                    created_at: now,
                    updated_at: now,
                };
            }
            catch (error) {
                console.error("Error adding todo list:", error);
                throw error;
            }
        });
    }
    getTodoLists(thread_id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const all = (0, util_1.promisify)(this.db.all.bind(this.db));
            try {
                const todoLists = yield all(`SELECT * FROM todo_lists WHERE thread_id = ? ORDER BY created_at DESC`, [thread_id]);
                return todoLists;
            }
            catch (error) {
                console.error("Error getting todo lists:", error);
                throw error;
            }
        });
    }
    getTodoListsWithTodos(thread_id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const all = (0, util_1.promisify)(this.db.all.bind(this.db));
            try {
                const todoListsWithTodos = yield all(`SELECT 
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
        ORDER BY tl.created_at DESC, t.created_at ASC`, [thread_id]);
                // Group the results by todo list
                const todoListMap = new Map();
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
                        const todoList = todoListMap.get(todoListId);
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
            }
            catch (error) {
                console.error("Error getting todo lists with todos:", error);
                throw error;
            }
        });
    }
    getTodoList(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const get = (0, util_1.promisify)(this.db.get.bind(this.db));
            try {
                const todoList = yield get(`SELECT * FROM todo_lists WHERE id = ?`, [id]);
                return todoList;
            }
            catch (error) {
                console.error("Error getting todo list:", error);
                throw error;
            }
        });
    }
    getTodoListWithTodos(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const all = (0, util_1.promisify)(this.db.all.bind(this.db));
            try {
                const todoListWithTodos = yield all(`SELECT 
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
        ORDER BY t.created_at ASC`, [id]);
                if (todoListWithTodos.length === 0) {
                    return null;
                }
                // Build the todo list with todos
                const firstRow = todoListWithTodos[0];
                const todoList = {
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
            }
            catch (error) {
                console.error("Error getting todo list with todos:", error);
                throw error;
            }
        });
    }
    updateTodoList(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const run = (0, util_1.promisify)(this.db.run.bind(this.db));
            const get = (0, util_1.promisify)(this.db.get.bind(this.db));
            try {
                const setClause = Object.keys(updates)
                    .map((key) => `${key} = ?`)
                    .join(", ");
                if (setClause) {
                    yield run(`UPDATE todo_lists SET ${setClause}, updated_at = ? WHERE id = ?`, [...Object.values(updates), new Date().toISOString(), id]);
                }
                const updatedTodoList = yield get(`SELECT * FROM todo_lists WHERE id = ?`, [id]);
                return updatedTodoList;
            }
            catch (error) {
                console.error("Error updating todo list:", error);
                throw error;
            }
        });
    }
    deleteTodoList(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const run = (0, util_1.promisify)(this.db.run.bind(this.db));
            try {
                const result = yield run(`DELETE FROM todo_lists WHERE id = ?`, [id]);
                return result.changes > 0;
            }
            catch (error) {
                console.error("Error deleting todo list:", error);
                throw error;
            }
        });
    }
    // Todo methods
    addTodo(todo) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const run = (0, util_1.promisify)(this.db.run.bind(this.db));
            const _id = (0, uuid_1.v4)();
            const now = new Date().toISOString();
            try {
                yield run(`INSERT INTO todos (id, todo_list_id, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, [_id, todo.todo_list_id, todo.name, todo.status, now, now]);
                return {
                    id: _id,
                    todo_list_id: todo.todo_list_id,
                    name: todo.name,
                    status: todo.status,
                    created_at: now,
                    updated_at: now,
                };
            }
            catch (error) {
                console.error("Error adding todo:", error);
                throw error;
            }
        });
    }
    getTodos(todo_list_id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const all = (0, util_1.promisify)(this.db.all.bind(this.db));
            try {
                const todos = yield all(`SELECT * FROM todos WHERE todo_list_id = ? ORDER BY created_at ASC`, [todo_list_id]);
                return todos;
            }
            catch (error) {
                console.error("Error getting todos:", error);
                throw error;
            }
        });
    }
    getTodo(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const get = (0, util_1.promisify)(this.db.get.bind(this.db));
            try {
                const todo = yield get(`SELECT * FROM todos WHERE id = ?`, [id]);
                return todo;
            }
            catch (error) {
                console.error("Error getting todo:", error);
                throw error;
            }
        });
    }
    updateTodo(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const run = (0, util_1.promisify)(this.db.run.bind(this.db));
            const get = (0, util_1.promisify)(this.db.get.bind(this.db));
            try {
                const setClause = Object.keys(updates)
                    .map((key) => `${key} = ?`)
                    .join(", ");
                if (setClause) {
                    yield run(`UPDATE todos SET ${setClause}, updated_at = ? WHERE id = ?`, [...Object.values(updates), new Date().toISOString(), id]);
                }
                const updatedTodo = yield get(`SELECT * FROM todos WHERE id = ?`, [id]);
                return updatedTodo;
            }
            catch (error) {
                console.error("Error updating todo:", error);
                throw error;
            }
        });
    }
    deleteTodo(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error("Database not initialized");
            const run = (0, util_1.promisify)(this.db.run.bind(this.db));
            try {
                const result = yield run(`DELETE FROM todos WHERE id = ?`, [id]);
                return result.changes > 0;
            }
            catch (error) {
                console.error("Error deleting todo:", error);
                throw error;
            }
        });
    }
    // Utility methods
    getOrCreateThread(title) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingThreads = yield this.getThreads();
            const existingThread = existingThreads.find((t) => t.title === title);
            if (existingThread) {
                return existingThread;
            }
            return yield this.addThread({ title });
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.db) {
                return new Promise((resolve, reject) => {
                    this.db.close((err) => {
                        if (err) {
                            console.error("Error closing database:", err);
                            reject(err);
                        }
                        else {
                            console.log("Database connection closed");
                            resolve();
                        }
                    });
                });
            }
        });
    }
}
exports.default = DbService;
