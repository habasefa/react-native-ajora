import { DEFAULT_AGENT_ID, DEFAULT_MODEL_ID } from "../constants";

describe("constants", () => {
  it("DEFAULT_AGENT_ID is 'default'", () => {
    expect(DEFAULT_AGENT_ID).toBe("default");
  });

  it("DEFAULT_MODEL_ID is 'default'", () => {
    expect(DEFAULT_MODEL_ID).toBe("default");
  });
});
