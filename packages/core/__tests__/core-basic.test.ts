import { describe, it, expect, beforeEach, vi } from "vitest";
import { AjoraCore } from "../core";

describe("AjoraCore Basic", () => {
  let ajoraCore: AjoraCore;

  beforeEach(() => {
    ajoraCore = new AjoraCore({});
  });

  it("should create an instance", () => {
    expect(ajoraCore).toBeDefined();
    expect(ajoraCore.agents).toEqual({});
    expect(ajoraCore.tools).toEqual([]);
  });

  it("should add a tool", () => {
    const tool = {
      name: "testTool",
      handler: vi.fn(),
    };

    ajoraCore.addTool(tool);

    expect(ajoraCore.getTool({ toolName: "testTool" })).toBe(tool);
  });
});
