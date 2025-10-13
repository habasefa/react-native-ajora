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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoType = exports.TodoListService = void 0;
var TodoType;
(function (TodoType) {
    TodoType["CREATE_LIST"] = "create_list";
    TodoType["ADD"] = "add";
    TodoType["GET"] = "get";
    TodoType["MARK_AS_QUEUE"] = "mark_as_queue";
    TodoType["MARK_AS_COMPLETED"] = "mark_as_completed";
    TodoType["MARK_AS_ERROR"] = "mark_as_error";
})(TodoType || (exports.TodoType = TodoType = {}));
/**
 * TodoListService is a class that manages the todo list and the todos in the todo list.
 * It has the following methods:
 * - createTodoList: creates a new todo list
 * - addTodo: adds a new todo to the todo list
 * - getTodos: gets the todos in the todo list
 * - markTodoAsCompleted: marks a todo as completed
 * - markTodoAsPending: marks a todo as pending
 * - markTodoAsError: marks a todo as error
 * It also has the execute method that executes the action based on the action type.
 *
 * IMPORTANT: All methods return the todoLists object. This helps the model to get the latest todoLists state.
 */
class TodoListService {
    constructor(dbService) {
        this.dbService = dbService;
    }
    createTodoList(name, description, todos, thread_id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (name.trim() === "") {
                    throw new Error("Name is required to create a todo list");
                }
                if (description.trim() === "") {
                    throw new Error("Description is required to create a todo list");
                }
                if (todos.length === 0) {
                    throw new Error("Todos are required to create a todo list");
                }
                const newList = yield this.dbService.addTodoList({
                    thread_id: thread_id,
                    name: name.trim(),
                    description: description.trim(),
                });
                // Add all todos to the database
                for (const todo of todos) {
                    yield this.dbService.addTodo({
                        todo_list_id: newList.id,
                        name: todo.name.trim(),
                        status: (_a = todo.status) !== null && _a !== void 0 ? _a : "queue",
                    });
                }
                const result = yield this.getTodoLists(thread_id);
                return {
                    output: result,
                    error: null,
                };
            }
            catch (error) {
                console.error("Error creating todo list:", error);
                return {
                    output: null,
                    error: `Todo list creation failed: ${error}`,
                };
            }
        });
    }
    addTodo(_a) {
        return __awaiter(this, arguments, void 0, function* ({ todo, todo_list_id, }) {
            var _b;
            try {
                const todoList = yield this.dbService.getTodoList(todo_list_id);
                if (!todoList) {
                    throw new Error("Todo list not found. Create a todo list first.");
                }
                if (todo.name.trim() === "") {
                    throw new Error("Name is required to add a todo");
                }
                yield this.dbService.addTodo({
                    todo_list_id: todo_list_id,
                    name: todo.name.trim(),
                    status: (_b = todo.status) !== null && _b !== void 0 ? _b : "queue",
                });
                const result = yield this.getTodoLists(todoList.thread_id);
                return {
                    output: result,
                    error: null,
                };
            }
            catch (error) {
                console.error("Error adding todo:", error);
                return {
                    output: null,
                    error: `Todo addition failed: ${error}`,
                };
            }
        });
    }
    getTodoLists(thread_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.dbService.getTodoListsWithTodos(thread_id);
                return result;
            }
            catch (error) {
                console.error("Error getting todo lists:", error);
                throw error;
            }
        });
    }
    markTodoAsQueue(todo, todo_list_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const todoList = yield this.dbService.getTodoList(todo_list_id);
                if (!todoList) {
                    throw new Error("Todo list not found. Create a todo list first.");
                }
                const existingTodo = yield this.dbService.getTodo(todo.id);
                if (!existingTodo) {
                    throw new Error("Todo not found");
                }
                yield this.dbService.updateTodo(todo.id, { status: "queue" });
                const result = yield this.getTodoLists(todoList.thread_id);
                return {
                    output: result,
                    error: null,
                };
            }
            catch (error) {
                console.error("Error marking todo as queue:", error);
                return {
                    output: null,
                    error: `Todo marking as queue failed: ${error}`,
                };
            }
        });
    }
    markTodoAsCompleted(todo, todo_list_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const todoList = yield this.dbService.getTodoList(todo_list_id);
                if (!todoList) {
                    throw new Error("Todo list not found. Create a todo list first.");
                }
                const existingTodo = yield this.dbService.getTodo(todo.id);
                if (!existingTodo) {
                    throw new Error("Todo not found");
                }
                yield this.dbService.updateTodo(todo.id, { status: "completed" });
                const result = yield this.getTodoLists(todoList.thread_id);
                return {
                    output: result,
                    error: null,
                };
            }
            catch (error) {
                console.error("Error marking todo as completed:", error);
                return {
                    output: null,
                    error: `Todo marking as completed failed: ${error}`,
                };
            }
        });
    }
    markTodoAsError(todo, todo_list_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const todoList = yield this.dbService.getTodoList(todo_list_id);
                if (!todoList) {
                    throw new Error("Todo list not found. Create a todo list first.");
                }
                const existingTodo = yield this.dbService.getTodo(todo.id);
                if (!existingTodo) {
                    throw new Error("Todo not found");
                }
                yield this.dbService.updateTodo(todo.id, { status: "error" });
                const result = yield this.getTodoLists(todoList.thread_id);
                return {
                    output: result,
                    error: null,
                };
            }
            catch (error) {
                console.error("Error marking todo as error:", error);
                return {
                    output: null,
                    error: `Todo marking as error failed: ${error}`,
                };
            }
        });
    }
    execute(action, args, thread_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                switch (action.action) {
                    case TodoType.CREATE_LIST:
                        return yield this.createTodoList(args.name, args.description, args.todos, thread_id);
                    case TodoType.ADD:
                        return yield this.addTodo({
                            todo: args.todo,
                            todo_list_id: args.todo_list_id,
                        });
                    case TodoType.GET:
                        const todoLists = yield this.getTodoLists(thread_id);
                        return {
                            output: todoLists,
                            error: null,
                        };
                    case TodoType.MARK_AS_QUEUE:
                        return yield this.markTodoAsQueue(args.todo, args.todo_list_id);
                    case TodoType.MARK_AS_COMPLETED:
                        return yield this.markTodoAsCompleted(args.todo, args.todo_list_id);
                    case TodoType.MARK_AS_ERROR:
                        return yield this.markTodoAsError(args.todo, args.todo_list_id);
                    default:
                        throw new Error("Invalid action");
                }
            }
            catch (error) {
                console.error("Error executing todo action:", error);
                return {
                    output: null,
                    error: `Todo operation failed: ${error}`,
                };
            }
        });
    }
}
exports.TodoListService = TodoListService;
