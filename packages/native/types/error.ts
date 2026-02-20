export interface AjoraChatError {
  type: "network" | "runtime" | "unknown";
  message: string;
  code?: string;
  details?: any;
}
