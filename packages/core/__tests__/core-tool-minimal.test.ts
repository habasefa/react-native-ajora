import { describe, it, expect, beforeEach, vi } from "vitest";
import { AjoraCore } from "../core";
import { MockAgent, createToolCallMessage, createTool } from "./test-utils";

describe("AjoraCore Tool Minimal", () => {
  let ajoraCore: AjoraCore;

  beforeEach(() => {
    ajoraCore = new AjoraCore({});
  });

  it("should execute tool with string result", async () => {
    const toolName = "stringTool";
    const tool = createTool({
      name: toolName,
      handler: vi.fn(async () => "String result"),
    });
    ajoraCore.addTool(tool);

    const message = createToolCallMessage(toolName, { input: "test" });
    const agent = new MockAgent({ newMessages: [message] });
    ajoraCore.addAgent__unsafe_dev_only({
      id: "test",
      agent: agent as any,
    });

    await ajoraCore.runAgent({ agent: agent as any });

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
    expect(agent.messages.some((m) => m.role === "tool")).toBe(true);
  });

  it("should skip tool call when tool not found", async () => {
    const message = createToolCallMessage("nonExistentTool");
    const agent = new MockAgent({ newMessages: [message] });
    ajoraCore.addAgent__unsafe_dev_only({
      id: "test",
      agent: agent as any,
    });

    await ajoraCore.runAgent({ agent: agent as any });

    expect(agent.messages.filter((m) => m.role === "tool")).toHaveLength(0);
  });
});
