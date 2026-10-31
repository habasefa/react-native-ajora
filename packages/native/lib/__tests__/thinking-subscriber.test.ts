/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  AbstractAgent,
  AgentSubscriber,
  AssistantMessage,
  EventType,
  Message,
} from "@ag-ui/client";
import {
  getLiveThinking,
  installThinkingSubscriber,
  subscribeLiveThinking,
} from "../thinking-subscriber";

interface FakeAgent extends Pick<AbstractAgent, "messages" | "subscribe"> {
  fire: (event: any) => void;
  fireMessagesChanged: () => void;
}

function createFakeAgent(initialMessages: Message[] = []): FakeAgent {
  let captured: AgentSubscriber | null = null;
  const fakeAgent = {
    messages: [...initialMessages],
    subscribe: vi.fn((subscriber: AgentSubscriber) => {
      captured = subscriber;
      return { unsubscribe: () => {} };
    }),
    fire(event: any) {
      captured?.onEvent?.({
        event,
        messages: fakeAgent.messages,
        // The remaining AgentSubscriberParams fields aren't used by our
        // subscriber, so passing partial params keeps the test focused.
      } as any);
    },
    fireMessagesChanged() {
      captured?.onMessagesChanged?.({
        messages: fakeAgent.messages,
      } as any);
    },
  } as unknown as FakeAgent;
  return fakeAgent;
}

const assistantMsg = (id: string): AssistantMessage => ({
  id,
  role: "assistant",
  content: "",
});

describe("installThinkingSubscriber", () => {
  let agent: FakeAgent;

  beforeEach(() => {
    agent = createFakeAgent();
  });

  it("is idempotent — only one subscribe per agent", () => {
    installThinkingSubscriber(agent as unknown as AbstractAgent);
    installThinkingSubscriber(agent as unknown as AbstractAgent);
    installThinkingSubscriber(agent as unknown as AbstractAgent);
    expect(agent.subscribe).toHaveBeenCalledTimes(1);
  });

  it("buffers thinking content and attaches to assistant message on TEXT_MESSAGE_START", () => {
    installThinkingSubscriber(agent as unknown as AbstractAgent);
    const msg = assistantMsg("m1");
    agent.messages.push(msg);

    agent.fire({
      type: EventType.THINKING_START,
      title: "Planning",
    });
    agent.fire({
      type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
      delta: "Step one. ",
    });
    agent.fire({
      type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
      delta: "Step two.",
    });
    agent.fire({ type: EventType.THINKING_END });
    agent.fire({
      type: EventType.TEXT_MESSAGE_START,
      messageId: "m1",
      role: "assistant",
    });

    const thinking = (msg as any).thinking;
    expect(thinking).toBeDefined();
    expect(thinking.title).toBe("Planning");
    expect(thinking.text).toBe("Step one. Step two.");
    expect(typeof thinking.startedAt).toBe("number");
    expect(typeof thinking.endedAt).toBe("number");
  });

  it("attaches thinking when message arrives later via onMessagesChanged", () => {
    installThinkingSubscriber(agent as unknown as AbstractAgent);

    agent.fire({ type: EventType.THINKING_START, title: "Reasoning" });
    agent.fire({
      type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
      delta: "deep thought",
    });
    agent.fire({
      type: EventType.TEXT_MESSAGE_START,
      messageId: "late-msg",
      role: "assistant",
    });

    // Message hasn't been pushed yet — nothing to attach to.
    expect(agent.messages.find((m) => m.id === "late-msg")).toBeUndefined();

    // Now the message materializes.
    const msg = assistantMsg("late-msg");
    agent.messages.push(msg);
    agent.fireMessagesChanged();

    expect((msg as any).thinking).toBeDefined();
    expect((msg as any).thinking.text).toBe("deep thought");
  });

  it("skips TEXT_MESSAGE_START for non-assistant roles", () => {
    installThinkingSubscriber(agent as unknown as AbstractAgent);
    agent.fire({ type: EventType.THINKING_START });
    agent.fire({
      type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
      delta: "x",
    });
    agent.fire({
      type: EventType.TEXT_MESSAGE_START,
      messageId: "user-msg",
      role: "user",
    });

    // Buffer should still be live (not flushed).
    expect(getLiveThinking(agent as unknown as AbstractAgent).text).toBe("x");
  });

  it("does not overwrite a server-provided thinking field", () => {
    installThinkingSubscriber(agent as unknown as AbstractAgent);
    const msg = assistantMsg("m1");
    (msg as any).thinking = {
      title: "from-server",
      text: "preserved",
      startedAt: 1,
      endedAt: 2,
    };
    agent.messages.push(msg);

    agent.fire({ type: EventType.THINKING_START });
    agent.fire({
      type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
      delta: "client",
    });
    agent.fire({
      type: EventType.TEXT_MESSAGE_START,
      messageId: "m1",
      role: "assistant",
    });

    expect((msg as any).thinking.text).toBe("preserved");
  });

  it("merges THINKING_START following content (multi-step) into the same buffer", () => {
    installThinkingSubscriber(agent as unknown as AbstractAgent);
    agent.fire({ type: EventType.THINKING_START, title: "First" });
    agent.fire({
      type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
      delta: "a",
    });
    agent.fire({ type: EventType.THINKING_END });
    agent.fire({ type: EventType.THINKING_START, title: "Second" });
    agent.fire({
      type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
      delta: "b",
    });

    const live = getLiveThinking(agent as unknown as AbstractAgent);
    expect(live.text).toBe("ab");
    expect(live.title).toBe("Second");
    expect(live.isActive).toBe(true);
  });

  it("synthesizes a buffer if CONTENT arrives before START", () => {
    installThinkingSubscriber(agent as unknown as AbstractAgent);
    agent.fire({
      type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
      delta: "stray",
    });
    expect(getLiveThinking(agent as unknown as AbstractAgent).text).toBe(
      "stray",
    );
  });

  it("clears the buffer after flushing to a message", () => {
    installThinkingSubscriber(agent as unknown as AbstractAgent);
    const msg = assistantMsg("m1");
    agent.messages.push(msg);

    agent.fire({ type: EventType.THINKING_START });
    agent.fire({
      type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
      delta: "x",
    });
    agent.fire({
      type: EventType.TEXT_MESSAGE_START,
      messageId: "m1",
      role: "assistant",
    });

    expect(getLiveThinking(agent as unknown as AbstractAgent).isActive).toBe(
      false,
    );
    expect(getLiveThinking(agent as unknown as AbstractAgent).text).toBe("");
  });
});

describe("subscribeLiveThinking", () => {
  it("notifies listeners on each buffer change and unsubscribes cleanly", () => {
    const agent = createFakeAgent();
    installThinkingSubscriber(agent as unknown as AbstractAgent);

    const listener = vi.fn();
    const unsubscribe = subscribeLiveThinking(
      agent as unknown as AbstractAgent,
      listener,
    );

    // Primed once on subscribe.
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toEqual({ text: "", isActive: false });

    agent.fire({ type: EventType.THINKING_START, title: "T" });
    agent.fire({
      type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
      delta: "hi",
    });

    // 1 (priming) + 1 (start) + 1 (content) = 3
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener.mock.calls[2][0]).toEqual({
      title: "T",
      text: "hi",
      isActive: true,
    });

    unsubscribe();
    agent.fire({
      type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
      delta: "more",
    });
    expect(listener).toHaveBeenCalledTimes(3);
  });
});
