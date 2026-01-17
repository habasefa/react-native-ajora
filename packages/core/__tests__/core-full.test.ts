import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AjoraCore } from "../core";
import { FrontendTool } from "../types";
import {
  MockAgent,
  createMessage,
  createAssistantMessage,
  createToolCallMessage,
  createToolResultMessage,
  createTool,
  createMultipleToolCallsMessage,
} from "./test-utils";

describe("AjoraCore.runAgent - Full Test Suite", () => {
  let ajoraCore: AjoraCore;

  beforeEach(() => {
    ajoraCore = new AjoraCore({});
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Tests that should pass", () => {
    it("TEST 1: should run agent without tools", async () => {
      const messages = [
        createMessage({ content: "Hello" }),
        createAssistantMessage({ content: "Hi there!" }),
      ];
      const agent = new MockAgent({ newMessages: messages });
      ajoraCore.addAgent__unsafe_dev_only({
        id: "test",
        agent: agent as any,
      });

      const result = await ajoraCore.runAgent({ agent: agent as any });

      expect(result.newMessages).toEqual(messages);
      expect(agent.runAgentCalls).toHaveLength(1);
    });

    it("TEST 2: should execute tool with string result", async () => {
      const toolName = "stringTool";
      const tool = createTool({
        name: toolName,
        handler: vi.fn(async () => "String result"),
        followUp: false,
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

    it("TEST 3: should skip tool when not found", async () => {
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

  describe("Tests that might reveal problems", () => {
    it("TEST 4: should handle follow-up with recursion", async () => {
      console.log("TEST 4: Starting follow-up test");
      const tool = createTool({
        name: "followUpTool",
        handler: vi.fn(async () => "Result"),
        followUp: true, // This should trigger recursion
      });
      ajoraCore.addTool(tool);

      const message = createToolCallMessage("followUpTool");
      const followUpMessage = createAssistantMessage({
        content: "Follow-up response",
      });

      const agent = new MockAgent({ newMessages: [message] });
      ajoraCore.addAgent__unsafe_dev_only({
        id: "test",
        agent: agent as any,
      });
      let callCount = 0;
      agent.runAgentCallback = () => {
        callCount++;
        console.log(`TEST 4: Call count: ${callCount}`);
        if (callCount === 2) {
          agent.setNewMessages([followUpMessage]);
        }
      };

      try {
        const result = await ajoraCore.runAgent({ agent: agent as any });
        console.log(`TEST 4: Success - calls: ${agent.runAgentCalls.length}`);
        expect(agent.runAgentCalls).toHaveLength(2);
        expect(result.newMessages).toContain(followUpMessage);
      } catch (error) {
        console.log(`TEST 4: Error - ${error}`);
        throw error;
      }
    });

    it("TEST 5: should handle multiple tools with at least one follow-up", async () => {
      console.log("TEST 5: Starting multiple tools test");
      const tool1 = createTool({
        name: "tool1",
        handler: vi.fn(async () => "Result 1"),
        followUp: false,
      });
      const tool2 = createTool({
        name: "tool2",
        handler: vi.fn(async () => "Result 2"),
        followUp: true, // This one needs follow-up
      });
      ajoraCore.addTool(tool1);
      ajoraCore.addTool(tool2);

      const message = createMultipleToolCallsMessage([
        { name: "tool1" },
        { name: "tool2" },
      ]);

      const agent = new MockAgent({ newMessages: [message] });
      ajoraCore.addAgent__unsafe_dev_only({
        id: "test",
        agent: agent as any,
      });
      let callCount = 0;
      agent.runAgentCallback = () => {
        callCount++;
        console.log(`TEST 5: Call count: ${callCount}`);
        if (callCount === 2) {
          agent.setNewMessages([]);
        }
      };

      try {
        await ajoraCore.runAgent({ agent: agent as any });
        console.log(`TEST 5: Success - calls: ${agent.runAgentCalls.length}`);
        expect(agent.runAgentCalls).toHaveLength(2);
      } catch (error) {
        console.log(`TEST 5: Error - ${error}`);
        throw error;
      }
    });

    it("TEST 6: should handle tool with undefined follow-up (defaults to true)", async () => {
      console.log("TEST 6: Starting undefined follow-up test");
      const tool: FrontendTool = {
        name: "defaultFollowUpTool",
        handler: vi.fn(async () => "Result"),
        // followUp is undefined - should default to true
      };
      ajoraCore.addTool(tool);

      const message = createToolCallMessage("defaultFollowUpTool");
      const followUpMessage = createAssistantMessage({ content: "Follow-up" });

      const agent = new MockAgent({ newMessages: [message] });
      ajoraCore.addAgent__unsafe_dev_only({
        id: "test",
        agent: agent as any,
      });
      let callCount = 0;
      agent.runAgentCallback = () => {
        callCount++;
        console.log(`TEST 6: Call count: ${callCount}`);
        if (callCount === 2) {
          agent.setNewMessages([followUpMessage]);
        }
      };

      try {
        await ajoraCore.runAgent({ agent: agent as any });
        console.log(`TEST 6: Success - calls: ${agent.runAgentCalls.length}`);
        expect(agent.runAgentCalls).toHaveLength(2);
      } catch (error) {
        console.log(`TEST 6: Error - ${error}`);
        throw error;
      }
    });

    it("TEST 7: should handle invalid JSON in tool arguments", async () => {
      console.log("TEST 7: Starting invalid JSON test");
      const toolName = "invalidJsonTool";
      const tool = createTool({
        name: toolName,
        handler: vi.fn(async () => "Should not be called"),
      });
      ajoraCore.addTool(tool);

      const message = createAssistantMessage({
        content: "",
        toolCalls: [
          {
            id: "tool-call-1",
            type: "function",
            function: {
              name: toolName,
              arguments: "{ invalid json",
            },
          },
        ],
      });
      const agent = new MockAgent({ newMessages: [message] });
      ajoraCore.addAgent__unsafe_dev_only({
        id: "test",
        agent: agent as any,
      });

      try {
        await ajoraCore.runAgent({ agent: agent as any });
        console.log("TEST 7: ERROR - Should have thrown!");
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        console.log(`TEST 7: Success - caught error: ${error}`);
        expect(tool.handler).not.toHaveBeenCalled();
      }
    });

    it("TEST 8: should handle empty string arguments", async () => {
      console.log("TEST 8: Starting empty arguments test");
      const tool = createTool({
        name: "emptyArgsTool",
        handler: vi.fn(async (args) => `Received: ${JSON.stringify(args)}`),
      });
      ajoraCore.addTool(tool);

      const message = createAssistantMessage({
        content: "",
        toolCalls: [
          {
            id: "empty-args-call",
            type: "function",
            function: {
              name: "emptyArgsTool",
              arguments: "",
            },
          },
        ],
      });

      const agent = new MockAgent({ newMessages: [message] });
      ajoraCore.addAgent__unsafe_dev_only({
        id: "test",
        agent: agent as any,
      });

      try {
        await ajoraCore.runAgent({ agent: agent as any });
        console.log("TEST 8: ERROR - Should have thrown on empty string!");
        expect(true).toBe(false);
      } catch (error) {
        console.log(`TEST 8: Success - caught error: ${error}`);
        expect(tool.handler).not.toHaveBeenCalled();
      }
    });

    it("TEST 9: should handle chain of follow-ups", async () => {
      console.log("TEST 9: Starting chain test");
      const tool1 = createTool({
        name: "chainTool1",
        handler: vi.fn(async () => "Result 1"),
        followUp: true,
      });
      const tool2 = createTool({
        name: "chainTool2",
        handler: vi.fn(async () => "Result 2"),
        followUp: true,
      });
      ajoraCore.addTool(tool1);
      ajoraCore.addTool(tool2);

      const msg1 = createToolCallMessage("chainTool1");
      const msg2 = createToolCallMessage("chainTool2");
      const finalMsg = createAssistantMessage({ content: "Done" });

      const agent = new MockAgent({ newMessages: [msg1] });
      ajoraCore.addAgent__unsafe_dev_only({
        id: "test",
        agent: agent as any,
      });
      let callCount = 0;
      agent.runAgentCallback = () => {
        callCount++;
        console.log(`TEST 9: Call count: ${callCount}`);
        if (callCount === 2) {
          agent.setNewMessages([msg2]);
        } else if (callCount === 3) {
          agent.setNewMessages([finalMsg]);
        }
      };

      try {
        const result = await ajoraCore.runAgent({ agent: agent as any });
        console.log(`TEST 9: Success - calls: ${agent.runAgentCalls.length}`);
        expect(agent.runAgentCalls).toHaveLength(3);
        expect(result.newMessages).toEqual([finalMsg]);
      } catch (error) {
        console.log(`TEST 9: Error - ${error}`);
        throw error;
      }
    });

    it("TEST 10: should handle concurrent tool calls", async () => {
      console.log("TEST 10: Starting concurrent tools test");
      const delays = [50, 30, 70];
      const tools = delays.map((delay, i) =>
        createTool({
          name: `concurrentTool${i}`,
          handler: vi.fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, delay));
            return `Result ${i} after ${delay}ms`;
          }),
          followUp: false,
        })
      );

      tools.forEach((tool) => ajoraCore.addTool(tool));

      const message = createMultipleToolCallsMessage(
        delays.map((_, i) => ({ name: `concurrentTool${i}` }))
      );
      const agent = new MockAgent({ newMessages: [message] });
      ajoraCore.addAgent__unsafe_dev_only({
        id: "test",
        agent: agent as any,
      });

      const startTime = Date.now();
      try {
        await ajoraCore.runAgent({ agent: agent as any });
        const duration = Date.now() - startTime;
        console.log(`TEST 10: Success - duration: ${duration}ms`);

        // Should execute sequentially
        const expectedMinDuration = delays.reduce((a, b) => a + b, 0);
        expect(duration).toBeGreaterThanOrEqual(expectedMinDuration - 10);

        tools.forEach((tool) => {
          expect(tool.handler).toHaveBeenCalled();
        });
      } catch (error) {
        console.log(`TEST 10: Error - ${error}`);
        throw error;
      }
    });
  });
});
