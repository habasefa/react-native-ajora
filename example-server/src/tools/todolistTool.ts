import { TodoListService, TodoType } from "../services/todoService";

// Create a singleton instance to maintain state across calls
const todoListService = new TodoListService();

async function todolistTool(args: any) {
  // Map the action string to TodoType enum
  const actionMap: Record<string, TodoType> = {
    create_list: TodoType.CREATE_LIST,
    add: TodoType.ADD,
    get: TodoType.GET,
    remove: TodoType.REMOVE,
    update: TodoType.UPDATE,
  };

  const action = actionMap[args.action];
  if (!action) {
    throw new Error(`Invalid action: ${args.action}`);
  }

  try {
    const result = todoListService.execute({ action, ...args }, args);
    return result;
  } catch (error) {
    throw new Error(
      `Todo operation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export { todolistTool };
