import { describe, it, expect, beforeEach, vi } from "vitest";
import { AjoraCore } from "../core";
import { MockAgent, createMessage, createAssistantMessage } from "./test-utils";

describe("AjoraCore.runAgent Simple", () => {
  let ajoraCore: AjoraCore;

  beforeEach(() => {
    ajoraCore = new AjoraCore({});
  });

  it("should run agent without tools", async () => {
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
});
