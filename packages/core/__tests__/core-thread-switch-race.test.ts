/**
 * Tests for thread-switch race conditions.
 *
 * When a user switches threads while a tool is executing, the tool result
 * must NOT be spliced into the new thread's messages. The key guard is in
 * RunHandler.executeSpecificTool / executeWildcardTool:
 *
 *   const messageIndex = agent.messages.findIndex(m => m.id === message.id);
 *   if (messageIndex === -1) return false;
 *
 * If the assistant message that triggered the tool call is no longer in the
 * agent's messages array (because the thread was replaced), the splice is
 * skipped and no follow-up is requested.
 */
import { AjoraCore } from "../core";
import { MockAgent, createTool, createAssistantMessage } from "./test-utils";

function makeToolCallMessage(toolName: string, toolCallId: string) {
  return createAssistantMessage({
    id: `msg-${toolCallId}`,
    content: "",
    toolCalls: [
      {
        id: toolCallId,
        type: "function",
        function: {
          name: toolName,
          arguments: JSON.stringify({}),
        },
      },
    ],
  });
}

describe("Thread-switch race conditions", () => {
  let ajoraCore: AjoraCore;

  beforeEach(() => {
    ajoraCore = new AjoraCore({});
  });

  it("does not insert tool result when thread switches during specific tool execution", async () => {
    const toolCallId = "tc-specific-1";
    const toolCallMsg = makeToolCallMessage("myTool", toolCallId);

    // The new-thread messages that will replace the current ones mid-execution
    const newThreadMessages = [
      createAssistantMessage({ id: "new-thread-msg", content: "Hello new thread" }),
    ];

    const tool = createTool({
      name: "myTool",
      followUp: false,
      handler: vi.fn(async () => {
        // Simulate thread switch: replace agent's messages while tool runs
        agent.messages.length = 0;
        agent.messages.push(...newThreadMessages);
        return "tool result";
      }),
    });
    ajoraCore.addTool(tool);

    const agent = new MockAgent({ newMessages: [toolCallMsg] });
    ajoraCore.addAgent__unsafe_dev_only({ id: "test", agent: agent as any });

    await ajoraCore.runAgent({ agent: agent as any });

    // Tool handler was called
    expect(tool.handler).toHaveBeenCalled();

    // But the result was NOT inserted — new thread only has its own message
    expect(agent.messages).toEqual(newThreadMessages);
    expect(agent.messages.find((m) => m.role === "tool")).toBeUndefined();
  });

  it("does not insert tool result when thread switches during wildcard tool execution", async () => {
    const toolCallId = "tc-wildcard-1";
    const toolCallMsg = makeToolCallMessage("unknownTool", toolCallId);

    const newThreadMessages = [
      createAssistantMessage({ id: "new-thread-msg-2", content: "Different thread" }),
    ];

    // Register a wildcard tool (name: "*")
    const wildcardTool = createTool({
      name: "*",
      followUp: false,
      handler: vi.fn(async () => {
        // Simulate thread switch mid-execution
        agent.messages.length = 0;
        agent.messages.push(...newThreadMessages);
        return "wildcard result";
      }),
    });
    ajoraCore.addTool(wildcardTool);

    const agent = new MockAgent({ newMessages: [toolCallMsg] });
    ajoraCore.addAgent__unsafe_dev_only({ id: "test", agent: agent as any });

    await ajoraCore.runAgent({ agent: agent as any });

    expect(wildcardTool.handler).toHaveBeenCalled();
    expect(agent.messages).toEqual(newThreadMessages);
    expect(agent.messages.find((m) => m.role === "tool")).toBeUndefined();
  });

  it("suppresses follow-up after thread switch", async () => {
    const toolCallId = "tc-followup-1";
    const toolCallMsg = makeToolCallMessage("followUpTool", toolCallId);

    const newThreadMessages = [
      createAssistantMessage({ id: "new-thread-msg-3", content: "Switched" }),
    ];

    const tool = createTool({
      name: "followUpTool",
      followUp: true, // Would normally trigger a follow-up run
      handler: vi.fn(async () => {
        agent.messages.length = 0;
        agent.messages.push(...newThreadMessages);
        return "result";
      }),
    });
    ajoraCore.addTool(tool);

    const agent = new MockAgent({ newMessages: [toolCallMsg] });
    ajoraCore.addAgent__unsafe_dev_only({ id: "test", agent: agent as any });

    await ajoraCore.runAgent({ agent: agent as any });

    // Tool handler was called exactly once
    expect(tool.handler).toHaveBeenCalledTimes(1);

    // No follow-up run happened — agent.runAgent should have been called only once
    expect(agent.runAgentCalls.length).toBe(1);

    // New thread messages are untouched
    expect(agent.messages).toEqual(newThreadMessages);
  });
});
