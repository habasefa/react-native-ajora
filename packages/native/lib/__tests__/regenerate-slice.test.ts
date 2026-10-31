import { describe, it, expect } from "vitest";
import { Message } from "@ag-ui/core";
import { computeRegenerateSlice } from "../regenerate-slice";

const user = (id: string, content = id): Message => ({
  id,
  role: "user",
  content,
});

type ToolCall = {
  id: string;
  function: { name: string; arguments: string };
};

const assistant = (
  id: string,
  content = id,
  toolCalls?: ToolCall[],
): Message =>
  ({
    id,
    role: "assistant",
    content,
    ...(toolCalls ? { toolCalls } : {}),
  }) as unknown as Message;

const tool = (id: string, toolCallId: string, content = ""): Message =>
  ({
    id,
    role: "tool",
    toolCallId,
    content,
  }) as unknown as Message;

describe("computeRegenerateSlice", () => {
  it("keeps through clicked user message when user bubble is clicked", () => {
    // Two-turn conversation; user long-presses the most recent user message
    // ("u2") and taps "Regenerate Response". The handler must rerun against
    // u2, not against the earlier u1 (the prior bug).
    const messages: Message[] = [
      user("u1"),
      assistant("a1"),
      user("u2"),
      assistant("a2"),
    ];
    const slice = computeRegenerateSlice(messages, "u2");
    expect(slice).not.toBeNull();
    expect(slice!.anchorUserIndex).toBe(2);
    expect(slice!.messagesToKeep.map((m) => m.id)).toEqual(["u1", "a1", "u2"]);
  });

  it("walks back to the prior user message when an assistant is clicked", () => {
    const messages: Message[] = [
      user("u1"),
      assistant("a1"),
      user("u2"),
      assistant("a2"),
    ];
    const slice = computeRegenerateSlice(messages, "a2");
    expect(slice).not.toBeNull();
    expect(slice!.anchorUserIndex).toBe(2);
    expect(slice!.messagesToKeep.map((m) => m.id)).toEqual(["u1", "a1", "u2"]);
  });

  it("drops tool calls and tool results when assistant text is clicked", () => {
    // Tool-calling run: rerun from u1 must throw away the entire prior run,
    // including the assistant tool-call bubble and the tool result.
    const messages: Message[] = [
      user("u1"),
      assistant("a1", "", [
        { id: "tc1", function: { name: "search", arguments: "{}" } },
      ]),
      tool("t1", "tc1", "result"),
      assistant("a2", "final answer"),
    ];
    const slice = computeRegenerateSlice(messages, "a2");
    expect(slice).not.toBeNull();
    expect(slice!.anchorUserIndex).toBe(0);
    expect(slice!.messagesToKeep.map((m) => m.id)).toEqual(["u1"]);
  });

  it("regenerates against the first user turn on a first-response click", () => {
    const messages: Message[] = [user("u1"), assistant("a1")];
    const slice = computeRegenerateSlice(messages, "a1");
    expect(slice).not.toBeNull();
    expect(slice!.messagesToKeep.map((m) => m.id)).toEqual(["u1"]);
  });

  it("regenerates against the clicked user even with later turns present", () => {
    // User scrolls back and regenerates an *older* user message. Everything
    // after that user message (including later user turns) gets dropped —
    // that's how branched conversations work.
    const messages: Message[] = [
      user("u1"),
      assistant("a1"),
      user("u2"),
      assistant("a2"),
      user("u3"),
      assistant("a3"),
    ];
    const slice = computeRegenerateSlice(messages, "u2");
    expect(slice).not.toBeNull();
    expect(slice!.anchorUserIndex).toBe(2);
    expect(slice!.messagesToKeep.map((m) => m.id)).toEqual(["u1", "a1", "u2"]);
  });

  it("returns null when the clicked id is unknown", () => {
    const messages: Message[] = [user("u1"), assistant("a1")];
    expect(computeRegenerateSlice(messages, "missing")).toBeNull();
  });

  it("returns null when an assistant is clicked with no prior user message", () => {
    // Pathological thread (system + assistant only). Bailing out is correct —
    // a regenerate with no user prompt has no defined behavior, and we'd
    // rather warn than rerun an empty thread.
    const messages: Message[] = [assistant("a1")];
    expect(computeRegenerateSlice(messages, "a1")).toBeNull();
  });
});
