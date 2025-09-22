import { v4 as uuidv4 } from "uuid";

interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
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
    return newList;
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
    if (todo.title.trim() === "" || todo.description.trim() === "") {
      throw new Error("Title and description are required to add a todo");
    }

    const list = this.getList(todoListId);

    const newTodo: Todo = {
      id: todo.id ?? uuidv4(),
      title: todo.title.trim(),
      description: todo.description.trim(),
      completed: todo.completed ?? false,
    };

    if (list.todos.some((t) => t.id === newTodo.id)) {
      throw new Error("Todo with this ID already exists");
    }

    list.todos.push(newTodo);
    return newTodo;
  }

  getTodos(todoListId: string) {
    return this.getList(todoListId).todos;
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
