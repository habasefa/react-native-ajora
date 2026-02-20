export type MaybePromise<T> = T | PromiseLike<T>;

/**
 * More specific utility for records with at least one key
 */
export type NonEmptyRecord<T> =
  T extends Record<string, unknown>
    ? keyof T extends never
      ? never
      : T
    : never;

/**
 * Type representing an agent's basic information
 */
export interface AgentDescription {
  name: string;
  className: string;
  description: string;
}

/**
 * Model information received from the runtime.
 * Matches the ModelOption shape used in the native UI components.
 */
export interface RuntimeModelInfo {
  id: string;
  name: string;
  provider?: string;
  description?: string;
  tier?: string;
  contextWindow?: string;
  isDisabled?: boolean;
  badge?: string;
  extraData?: Record<string, unknown>;
}

export interface RuntimeInfo {
  version: string;
  agents: Record<string, AgentDescription>;
  audioFileTranscriptionEnabled: boolean;
  models?: RuntimeModelInfo[];
  extraData?: Record<string, unknown>;
}
