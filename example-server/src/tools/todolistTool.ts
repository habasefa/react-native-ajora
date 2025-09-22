import { TodoListService } from "../services/todoService";
async function todolistTool(args: any) {
  const todoListService = new TodoListService();
  return todoListService.execute(args.action, args);
}

export { todolistTool };
