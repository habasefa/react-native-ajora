import { v4 as uuidv4 } from "uuid";
import DbService, {
  TodoList,
  Todo,
  TodoListWithTodos,
} from "../../db/dbService";

enum TodoType {
  CREATE_LIST = "create_list",
  ADD = "add",
  GET = "get",
  MARK_AS_QUEUE = "mark_as_queue",
  MARK_AS_EXECUTING = "mark_as_executing",
  MARK_AS_COMPLETED = "mark_as_completed",
  MARK_AS_ERROR = "mark_as_error",
}

type TodoAction =
  | {
      action: TodoType.CREATE_LIST;
      todoListId: string;
      todo: Todo[];
    }
  | {
      action: TodoType.ADD;
      todo: Todo;
    }
  | { action: TodoType.GET; todoListId: string }
  | { action: TodoType.MARK_AS_QUEUE; todo: Todo }
  | { action: TodoType.MARK_AS_EXECUTING; todo: Todo }
  | { action: TodoType.MARK_AS_COMPLETED; todo: Todo }
  | { action: TodoType.MARK_AS_ERROR; todo: Todo };

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
  private dbService: DbService;

  constructor(dbService: DbService) {
    this.dbService = dbService;
  }

  async createTodoList(
    name: string,
    description: string,
    todos: Todo[],
    thread_id: string
  ): Promise<TodoListWithTodos[]> {
    if (name.trim() === "") {
      throw new Error("Name is required to create a todo list");
    }

    if (description.trim() === "") {
      throw new Error("Description is required to create a todo list");
    }

    if (todos.length === 0) {
      throw new Error("Todos are required to create a todo list");
    }

    const newList = await this.dbService.addTodoList({
      thread_id: thread_id,
      name: name.trim(),
      description: description.trim(),
    });

    // Add all todos to the database
    for (const todo of todos) {
      await this.dbService.addTodo({
        todo_list_id: newList.id,
        name: todo.name.trim(),
        status: todo.status ?? "queue",
      });
    }

    return await this.getTodoLists(thread_id);
  }

  async addTodo({
    todo,
    todo_list_id,
  }: {
    todo: Todo;
    todo_list_id: string;
  }): Promise<TodoListWithTodos[]> {
    const todoList = await this.dbService.getTodoList(todo_list_id);
    if (!todoList) {
      throw new Error("Todo list not found. Create a todo list first.");
    }

    if (todo.name.trim() === "") {
      throw new Error("Name is required to add a todo");
    }

    await this.dbService.addTodo({
      todo_list_id: todo_list_id,
      name: todo.name.trim(),
      status: todo.status ?? "queue",
    });

    return await this.getTodoLists(todoList.thread_id);
  }

  async getTodoLists(thread_id: string): Promise<TodoListWithTodos[]> {
    return await this.dbService.getTodoListsWithTodos(thread_id);
  }

  async markTodoAsQueue(
    todo: Todo,
    todo_list_id: string
  ): Promise<TodoListWithTodos[]> {
    const todoList = await this.dbService.getTodoList(todo_list_id);
    if (!todoList) {
      throw new Error("Todo list not found. Create a todo list first.");
    }

    const existingTodo = await this.dbService.getTodo(todo.id);
    if (!existingTodo) {
      throw new Error("Todo not found");
    }

    await this.dbService.updateTodo(todo.id, { status: "queue" });

    return await this.getTodoLists(todoList.thread_id);
  }

  async markTodoAsExecuting(
    todo: Todo,
    todo_list_id: string
  ): Promise<TodoListWithTodos[]> {
    const todoList = await this.dbService.getTodoList(todo_list_id);
    if (!todoList) {
      throw new Error("Todo list not found. Create a todo list first.");
    }

    const existingTodo = await this.dbService.getTodo(todo.id);
    if (!existingTodo) {
      throw new Error("Todo not found");
    }

    await this.dbService.updateTodo(todo.id, { status: "executing" });

    return await this.getTodoLists(todoList.thread_id);
  }

  async markTodoAsCompleted(
    todo: Todo,
    todo_list_id: string
  ): Promise<TodoListWithTodos[]> {
    const todoList = await this.dbService.getTodoList(todo_list_id);
    if (!todoList) {
      throw new Error("Todo list not found. Create a todo list first.");
    }

    const existingTodo = await this.dbService.getTodo(todo.id);
    if (!existingTodo) {
      throw new Error("Todo not found");
    }

    await this.dbService.updateTodo(todo.id, { status: "completed" });

    return await this.getTodoLists(todoList.thread_id);
  }

  async markTodoAsError(
    todo: Todo,
    todo_list_id: string
  ): Promise<TodoListWithTodos[]> {
    const todoList = await this.dbService.getTodoList(todo_list_id);
    if (!todoList) {
      throw new Error("Todo list not found. Create a todo list first.");
    }

    const existingTodo = await this.dbService.getTodo(todo.id);
    if (!existingTodo) {
      throw new Error("Todo not found");
    }

    await this.dbService.updateTodo(todo.id, { status: "error" });

    return await this.getTodoLists(todoList.thread_id);
  }

  async execute(
    action: TodoAction,
    args: any,
    thread_id: string
  ): Promise<TodoListWithTodos[] | TodoListWithTodos | null> {
    switch (action.action) {
      case TodoType.CREATE_LIST:
        return await this.createTodoList(
          args.name,
          args.description,
          args.todos,
          thread_id
        );
      case TodoType.ADD:
        return await this.addTodo({
          todo: args.todo,
          todo_list_id: args.todo_list_id,
        });
      case TodoType.GET:
        return await this.getTodoLists(thread_id);
      case TodoType.MARK_AS_QUEUE:
        return await this.markTodoAsQueue(args.todo, args.todo_list_id);
      case TodoType.MARK_AS_EXECUTING:
        return await this.markTodoAsExecuting(args.todo, args.todo_list_id);
      case TodoType.MARK_AS_COMPLETED:
        return await this.markTodoAsCompleted(args.todo, args.todo_list_id);
      case TodoType.MARK_AS_ERROR:
        return await this.markTodoAsError(args.todo, args.todo_list_id);
      default:
        throw new Error("Invalid action");
    }
  }
}

export {
  TodoListService,
  Todo,
  TodoList,
  TodoListWithTodos,
  TodoType,
  TodoAction,
};
