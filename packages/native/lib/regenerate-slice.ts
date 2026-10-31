import { Message } from "@ag-ui/core";

export interface RegenerateSlice {
  /** Messages to keep (up to and including the anchor user message). */
  messagesToKeep: Message[];
  /** Index of the anchor user message in the original array. */
  anchorUserIndex: number;
}

/**
 * Compute the message prefix to keep when the user requests a "regenerate"
 * on `clickedMessageId`.
 *
 * The anchor is the *user* turn the new run should respond to:
 *   - clicked an assistant/tool turn → anchor = the user message that
 *     triggered that run; everything after it (assistant text, tool calls,
 *     tool results) is dropped so the rerun starts clean.
 *   - clicked a user turn → anchor IS the clicked message; the user wants a
 *     fresh response to *that* prompt. Walking back to a prior user message
 *     would silently re-run the wrong prompt.
 *
 * Returns `null` if the clicked id is unknown or no user message anchor
 * exists (e.g. the thread starts with an assistant/system message and the
 * caller clicked one of those).
 */
export function computeRegenerateSlice(
  messages: ReadonlyArray<Message>,
  clickedMessageId: string,
): RegenerateSlice | null {
  const messageIndex = messages.findIndex((m) => m.id === clickedMessageId);
  if (messageIndex === -1) return null;

  const clicked = messages[messageIndex];
  let anchorUserIndex = clicked.role === "user" ? messageIndex : -1;
  if (anchorUserIndex === -1) {
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        anchorUserIndex = i;
        break;
      }
    }
  }

  if (anchorUserIndex === -1) return null;

  return {
    messagesToKeep: messages.slice(0, anchorUserIndex + 1),
    anchorUserIndex,
  };
}
