import { randomUUID, partialJSONParse } from "../utils";

describe("randomUUID", () => {
  it("returns a valid UUID v4 string", () => {
    const uuid = randomUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("returns unique values on successive calls", () => {
    const a = randomUUID();
    const b = randomUUID();
    expect(a).not.toBe(b);
  });
});

describe("partialJSONParse", () => {
  it("parses complete JSON", () => {
    expect(partialJSONParse('{"a":1,"b":"hello"}')).toEqual({
      a: 1,
      b: "hello",
    });
  });

  it("parses a partial JSON object", () => {
    const result = partialJSONParse('{"title":"Hello","mes');
    expect(result).toHaveProperty("title", "Hello");
  });

  it("parses a partial JSON array", () => {
    const result = partialJSONParse('[1, 2, 3');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toContain(1);
    expect(result).toContain(2);
    expect(result).toContain(3);
  });

  it("returns empty object for completely invalid input", () => {
    expect(partialJSONParse("not json at all!!!")).toEqual({});
  });

  it("returns empty object for empty string", () => {
    expect(partialJSONParse("")).toEqual({});
  });

  it("handles nested partial objects", () => {
    const result = partialJSONParse('{"outer":{"inner":"val');
    expect(result).toHaveProperty("outer");
    expect(result.outer).toHaveProperty("inner");
  });
});
