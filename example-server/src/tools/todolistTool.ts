import { TodoListService, TodoType } from "../services/todoService";

async function todolistTool(
  args: any,
  todoListService: TodoListService,
  thread_id: string
) {
  // Map the action string to TodoType enum
  const actionMap: Record<string, TodoType> = {
    create_list: TodoType.CREATE_LIST,
    add: TodoType.ADD,
    get: TodoType.GET,
    mark_as_queue: TodoType.MARK_AS_QUEUE,
    mark_as_executing: TodoType.MARK_AS_EXECUTING,
    mark_as_completed: TodoType.MARK_AS_COMPLETED,
    mark_as_error: TodoType.MARK_AS_ERROR,
  };

  const action = actionMap[args.action];
  if (!action) {
    throw new Error(`Invalid action: ${args.action}`);
  }

  try {
    const result = await todoListService.execute(
      { action, ...args },
      args,
      thread_id
    );
    return result;
  } catch (error) {
    throw new Error(
      `Todo operation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export { todolistTool };
