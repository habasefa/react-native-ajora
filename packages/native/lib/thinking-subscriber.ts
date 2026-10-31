import {
  AbstractAgent,
  EventType,
  TextMessageStartEvent,
  ThinkingStartEvent,
  ThinkingTextMessageContentEvent,
} from "@ag-ui/client";
import type { LiveThinkingState, ThinkingBlock } from "../types/thinking";

/**
 * Per-agent thinking subscriber.
 *
 * AG-UI thinking events (`THINKING_START`, `THINKING_TEXT_MESSAGE_CONTENT`,
 * `THINKING_END`) carry no `messageId`, so we buffer them client-side and
 * attach the resulting block to the next assistant message that materializes
 * (matched by `TEXT_MESSAGE_START.messageId`).
 *
 * Installed once per `AbstractAgent` instance via `installThinkingSubscriber`,
 * which is idempotent — subsequent calls are no-ops. State is held in
 * module-level `WeakMap`s so it's freed when the agent is garbage-collected.
 *
 * Two outputs:
 *   1. The buffered `ThinkingBlock` is mutated onto the matching assistant
 *      message as `(message as any).thinking` once it appears in
 *      `agent.messages`.
 *   2. A live snapshot is broadcast to listeners registered via
 *      `subscribeLiveThinking` so React hooks can render the in-flight UI.
 */

type Listener = (state: LiveThinkingState) => void;

interface AgentThinkingState {
  /** Current in-flight buffer between THINKING_START and the next TEXT_MESSAGE_START. */
  buffer: ThinkingBlock | null;
  /**
   * Blocks waiting to be attached, keyed by the assistant messageId from
   * TEXT_MESSAGE_START. Held until the message appears in `agent.messages`,
   * then drained on `onMessagesChanged`.
   */
  pending: Map<string, ThinkingBlock>;
  listeners: Set<Listener>;
}

const installed = new WeakSet<AbstractAgent>();
const stateByAgent = new WeakMap<AbstractAgent, AgentThinkingState>();

const EMPTY_STATE: LiveThinkingState = { text: "", isActive: false };

function getState(agent: AbstractAgent): AgentThinkingState {
  let s = stateByAgent.get(agent);
  if (!s) {
    s = { buffer: null, pending: new Map(), listeners: new Set() };
    stateByAgent.set(agent, s);
  }
  return s;
}

function snapshot(s: AgentThinkingState): LiveThinkingState {
  if (!s.buffer) return EMPTY_STATE;
  return {
    title: s.buffer.title,
    text: s.buffer.text,
    isActive: s.buffer.endedAt === undefined,
  };
}

function notify(s: AgentThinkingState): void {
  if (s.listeners.size === 0) return;
  const snap = snapshot(s);
  for (const listener of s.listeners) {
    try {
      listener(snap);
    } catch (err) {
      console.error("[thinking-subscriber] listener error:", err);
    }
  }
}

function drainPending(agent: AbstractAgent, s: AgentThinkingState): void {
  if (s.pending.size === 0) return;
  const messages = agent.messages ?? [];
  for (const message of messages) {
    if (message.role !== "assistant") continue;
    const block = s.pending.get(message.id);
    if (!block) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((message as any).thinking) {
      // Server-provided thinking already present — defer to it.
      s.pending.delete(message.id);
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (message as any).thinking = block;
    s.pending.delete(message.id);
  }
}

export function installThinkingSubscriber(agent: AbstractAgent): void {
  if (installed.has(agent)) return;
  installed.add(agent);
  const s = getState(agent);

  agent.subscribe({
    onEvent: ({ event }) => {
      switch (event.type) {
        case EventType.THINKING_START: {
          const e = event as ThinkingStartEvent;
          if (s.buffer) {
            // Mid-turn restart — keep accumulated text, update title if given.
            if (e.title) s.buffer.title = e.title;
            s.buffer.endedAt = undefined;
          } else {
            s.buffer = {
              title: e.title,
              text: "",
              startedAt: Date.now(),
            };
          }
          notify(s);
          break;
        }
        case EventType.THINKING_TEXT_MESSAGE_CONTENT: {
          const e = event as ThinkingTextMessageContentEvent;
          if (!s.buffer) {
            // CONTENT before START — synthesize a buffer.
            s.buffer = { text: "", startedAt: Date.now() };
          }
          s.buffer.text += e.delta ?? "";
          notify(s);
          break;
        }
        case EventType.THINKING_END: {
          if (s.buffer) {
            s.buffer.endedAt = Date.now();
            notify(s);
          }
          break;
        }
        case EventType.TEXT_MESSAGE_START: {
          const e = event as TextMessageStartEvent;
          if (e.role && e.role !== "assistant") break;
          if (!s.buffer) break;
          // Stamp duration if THINKING_END never fired.
          if (s.buffer.endedAt === undefined) s.buffer.endedAt = Date.now();
          s.pending.set(e.messageId, s.buffer);
          s.buffer = null;
          drainPending(agent, s);
          notify(s);
          break;
        }
        default:
          break;
      }
    },
    onMessagesChanged: () => {
      drainPending(agent, s);
    },
  });
}

/**
 * Subscribe to live thinking state changes for an agent. Returns an
 * unsubscribe function. Safe to call before {@link installThinkingSubscriber};
 * the listener will start receiving snapshots once events arrive.
 */
export function subscribeLiveThinking(
  agent: AbstractAgent,
  listener: Listener,
): () => void {
  const s = getState(agent);
  s.listeners.add(listener);
  // Prime the listener with the current snapshot so callers don't render
  // a stale empty state if a thinking turn is already in flight.
  listener(snapshot(s));
  return () => {
    s.listeners.delete(listener);
  };
}

/** Read the current live thinking snapshot synchronously. */
export function getLiveThinking(agent: AbstractAgent): LiveThinkingState {
  return snapshot(getState(agent));
}
