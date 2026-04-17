import type { AssistantMessage } from "@ag-ui/client";

/**
 * A streamed chain-of-thought block that precedes an assistant answer.
 *
 * The AG-UI protocol streams this via `THINKING_START` (optional `title`),
 * `THINKING_TEXT_MESSAGE_CONTENT` (deltas), and `THINKING_END`. None of those
 * events carry a `messageId`, so client-side we associate the buffered block
 * with the next `TEXT_MESSAGE_START`'s message.
 */
export interface ThinkingBlock {
  /** Optional heading provided by `THINKING_START.title`. */
  title?: string;
  /** Accumulated thinking text. */
  text: string;
  /** Wall-clock ms when `THINKING_START` arrived. */
  startedAt: number;
  /** Wall-clock ms when `THINKING_END` arrived. Unset while streaming. */
  endedAt?: number;
}

/**
 * AG-UI's `AssistantMessage` augmented with an optional `thinking` block.
 *
 * The field is attached client-side by the thinking subscriber when the
 * provider isn't yet returning it on the message; once the runtime persists
 * thinking on the assistant message itself, this same field is populated by
 * history-fetch.
 */
export type AjoraAssistantMessage = AssistantMessage & {
  thinking?: ThinkingBlock;
};

/** Live snapshot of the in-flight thinking buffer for an agent. */
export interface LiveThinkingState {
  title?: string;
  text: string;
  /** True between `THINKING_START` and the next `TEXT_MESSAGE_START`/`THINKING_END` flush. */
  isActive: boolean;
}
