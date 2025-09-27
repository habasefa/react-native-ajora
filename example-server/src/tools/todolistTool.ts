import { TodoListService } from "../services/todoService";
import { ToolResult } from "../toolExecutor";

async function todolistTool(
  args: any,
  todoListService: TodoListService,
  thread_id: string
): Promise<ToolResult> {
  try {
    if (!todoListService) {
      throw new Error(
        "TodoListService is not initialized. Please provide a TodoListService instance."
      );
    }
    if (!thread_id) {
      throw new Error("Thread ID is not provided. Please provide a thread ID.");
    }
    const result = await todoListService.execute(
      { action: args.action, ...args },
      args,
      thread_id
    );
    // Return the result directly since TodoListService already returns ToolResult
    return result;
  } catch (error) {
    return { output: null, error: error };
  }
}

export { todolistTool };
