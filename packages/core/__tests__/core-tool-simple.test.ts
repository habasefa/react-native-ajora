import { AjoraCore } from "../core";
import { MockAgent, createToolCallMessage, createTool } from "./test-utils";

describe("AjoraCore Tool Simple", () => {
  let ajoraCore: AjoraCore;

  beforeEach(() => {
    ajoraCore = new AjoraCore({});
  });

  it("should execute a simple tool", async () => {
    console.log("Starting simple tool test");

    const toolName = "simpleTool";
    const tool = createTool({
      name: toolName,
      handler: vi.fn(async () => {
        console.log("Tool handler called");
        return "Simple result";
      }),
      followUp: false, // Important: no follow-up to avoid recursion
    });
    ajoraCore.addTool(tool);

    const message = createToolCallMessage(toolName, { input: "test" });
    const agent = new MockAgent({ newMessages: [message] });
    ajoraCore.addAgent__unsafe_dev_only({
      id: "test",
      agent: agent as any,
    });

    console.log("About to run agent");
    await ajoraCore.runAgent({ agent: agent as any });
    console.log("Agent run complete");

    expect(tool.handler).toHaveBeenCalledWith(
      { input: "test" },
      expect.objectContaining({
        id: expect.any(String),
        function: expect.objectContaining({
          name: toolName,
          arguments: '{"input":"test"}',
        }),
      })
    );
    expect(agent.messages.length).toBeGreaterThan(0);
  });

  it("inserts a tool result message into agent.messages after the assistant message", async () => {
    const toolName = "insertionTool";
    const tool = createTool({
      name: toolName,
      handler: vi.fn(async () => "inserted result"),
      followUp: false,
    });
    ajoraCore.addTool(tool);

    const message = createToolCallMessage(toolName, { key: "val" });
    const agent = new MockAgent({ newMessages: [message] });
    ajoraCore.addAgent__unsafe_dev_only({ id: "test", agent: agent as any });

    await ajoraCore.runAgent({ agent: agent as any });

    // After execution, agent.messages should contain:
    // 1. The assistant message with the tool call
    // 2. The tool result message
    const toolResultMsg = agent.messages.find((m) => m.role === "tool");
    expect(toolResultMsg).toBeDefined();
    expect(toolResultMsg!.content).toBe("inserted result");
    expect(toolResultMsg!.toolCallId).toBe(message.toolCalls![0].id);

    // Tool result should come after the assistant message
    const assistantIdx = agent.messages.findIndex((m) => m.id === message.id);
    const toolIdx = agent.messages.indexOf(toolResultMsg!);
    expect(toolIdx).toBe(assistantIdx + 1);
  });

  it("executes tool with the correct agent instance", async () => {
    const toolName = "agentInstanceTool";
    let capturedContext: any = null;
    const tool = createTool({
      name: toolName,
      handler: vi.fn(async (args, toolCall) => {
        capturedContext = { args, toolCall };
        return "ok";
      }),
      followUp: false,
    });
    ajoraCore.addTool(tool);

    const message = createToolCallMessage(toolName, { x: 1 });
    const agent = new MockAgent({
      newMessages: [message],
      agentId: "specific-agent",
    });
    ajoraCore.addAgent__unsafe_dev_only({
      id: "specific-agent",
      agent: agent as any,
    });

    await ajoraCore.runAgent({ agent: agent as any });

    expect(capturedContext).not.toBeNull();
    expect(capturedContext.args).toEqual({ x: 1 });
    expect(capturedContext.toolCall.function.name).toBe(toolName);
  });
});
