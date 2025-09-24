import { v4 as uuidv4 } from "uuid";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  category: string;
}

interface TodoList {
  id: string;
  name: string;
  description: string;
  todos: Todo[];
}

enum TodoType {
  CREATE_LIST = "create_list",
  ADD = "add",
  GET = "get",
  REMOVE = "remove",
  UPDATE = "update",
}

type TodoAction =
  | {
      action: TodoType.ADD;
      name: string;
      description: string;
      todos: Todo[];
    }
  | {
      action: TodoType.CREATE_LIST;
      todoListId: string;
      todo: Omit<Todo, "id"> & Partial<Pick<Todo, "id">>;
    }
  | { action: TodoType.GET; todoListId: string }
  | { action: TodoType.REMOVE; todoListId: string; id: string }
  | {
      action: TodoType.UPDATE;
      todoListId: string;
      todo: Partial<Todo> & { id: string };
    };

class TodoListService {
  private todoLists: TodoList[] = [];
  private defaultListId: string | null = null;

  createTodoList(name: string, description: string, todos: Todo[] = []) {
    if (name.trim() === "" || description.trim() === "") {
      throw new Error(
        "Name and description are required to create a todo list"
      );
    }

    const newList: TodoList = {
      id: uuidv4(),
      name: name.trim(),
      description: description.trim(),
      todos,
    };

    this.todoLists.push(newList);

    // Set as default if it's the first list
    if (!this.defaultListId) {
      this.defaultListId = newList.id;
    }

    return newList;
  }

  getDefaultList() {
    if (!this.defaultListId) {
      // Create a default list if none exists
      const defaultList = this.createTodoList(
        "My Todo List",
        "Default todo list for managing tasks",
        [
          {
            id: uuidv4(),
            text: "Plan weekly meal prep",
            completed: false,
            priority: "high",
            category: "meal planning",
          },
          {
            id: uuidv4(),
            text: "Research nutrition guidelines",
            completed: true,
            priority: "medium",
            category: "research",
          },
          {
            id: uuidv4(),
            text: "Create shopping list",
            completed: false,
            priority: "high",
            category: "shopping",
          },
          {
            id: uuidv4(),
            text: "Review dietary restrictions",
            completed: false,
            priority: "low",
            category: "planning",
          },
        ]
      );
      return this.getTodos(defaultList.id);
    }

    return this.getTodos(this.defaultListId);
  }

  private getList(todoListId: string): TodoList {
    const list = this.todoLists.find((t) => t.id === todoListId);
    if (!list) throw new Error("Todo list not found");
    return list;
  }

  addTodo({
    todoListId,
    todo,
  }: {
    todoListId: string;
    todo: Omit<Todo, "id"> & Partial<Pick<Todo, "id">>;
  }) {
    if (todo.text.trim() === "") {
      throw new Error("Text is required to add a todo");
    }

    const list = this.getList(todoListId);

    const newTodo: Todo = {
      id: todo.id ?? uuidv4(),
      text: todo.text.trim(),
      completed: todo.completed ?? false,
      priority: todo.priority ?? "medium",
      category: todo.category ?? "general",
    };

    if (list.todos.some((t) => t.id === newTodo.id)) {
      throw new Error("Todo with this ID already exists");
    }

    list.todos.push(newTodo);
    return newTodo;
  }

  getTodos(todoListId: string) {
    const list = this.getList(todoListId);
    const todos = list.todos;
    const completedTodos = todos.filter((todo) => todo.completed).length;
    const pendingTodos = todos.filter((todo) => !todo.completed).length;

    return {
      action: "get",
      todos,
      totalTodos: todos.length,
      completedTodos,
      pendingTodos,
      listName: list.name,
      listDescription: list.description,
    };
  }

  removeTodo(todoListId: string, id: string) {
    const list = this.getList(todoListId);

    const index = list.todos.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Todo not found");

    list.todos.splice(index, 1);
    return list.todos;
  }

  updateTodo(todoListId: string, partial: Partial<Todo> & { id: string }) {
    const list = this.getList(todoListId);

    const index = list.todos.findIndex((t) => t.id === partial.id);
    if (index === -1) throw new Error("Todo not found");

    list.todos[index] = { ...list.todos[index], ...partial };
    return list.todos[index];
  }

  execute(action: TodoAction, args: any) {
    switch (action.action) {
      case TodoType.CREATE_LIST:
        return this.createTodoList(args.name, args.description, args.todos);
      case TodoType.ADD:
        return this.addTodo({
          todoListId: args.todoListId,
          todo: args.todo,
        });
      case TodoType.GET:
        // If no todoListId provided, return default list
        if (!args.todoListId) {
          return this.getDefaultList();
        }
        return this.getTodos(args.todoListId);
      case TodoType.REMOVE:
        return this.removeTodo(args.todoListId, args.id);
      case TodoType.UPDATE:
        return this.updateTodo(args.todoListId, args.todo);
      default:
        throw new Error("Invalid action");
    }
  }
}

export { TodoListService, Todo, TodoList, TodoType, TodoAction };
