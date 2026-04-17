import { StatelessAjoraRuntimeAgent } from "../agent";

const encoder = new TextEncoder();

function createSseResponse(): Response {
  const stream = new ReadableStream({
    start(controller) {
      const events = [
        { type: "RUN_STARTED", threadId: "t", runId: "r" },
        { type: "RUN_FINISHED", threadId: "t", runId: "r", result: { newMessages: [] } },
      ];
      const payload = events
        .map((event) => `data: ${JSON.stringify(event)}\n\n`)
        .join("");
      controller.enqueue(encoder.encode(payload));
      controller.close();
    },
  });
  return new Response(stream as unknown as BodyInit_, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });
}

describe("StatelessAjoraRuntimeAgent", () => {
  const originalFetch = global.fetch;
  const url = "https://runtime.example/stateless";
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.resolve(createSseResponse()));
    // @ts-expect-error - test-only reassignment
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("requires a url", () => {
    expect(
      () =>
        new StatelessAjoraRuntimeAgent({
          // @ts-expect-error — intentional missing url
          url: undefined,
          agentId: "x",
        }),
    ).toThrow(/url/i);
  });

  it("injects stateless + isEphemeral into forwardedProps on REST runs", async () => {
    const agent = new StatelessAjoraRuntimeAgent({
      url,
      agentId: "suggestions",
      transport: "rest",
    });

    await agent.runAgent({ forwardedProps: { foo: "bar" } });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(url);
    const body = JSON.parse(init.body as string);
    expect(body.forwardedProps).toMatchObject({
      foo: "bar",
      stateless: true,
      isEphemeral: true,
    });
  });

  it("wraps single-route runs in the agent/run envelope with stateless flag", async () => {
    const agent = new StatelessAjoraRuntimeAgent({
      url,
      agentId: "suggestions",
      transport: "single",
    });

    await agent.runAgent({ forwardedProps: { foo: "bar" } });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(url);
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      method: "agent/run",
      params: { agentId: "suggestions" },
    });
    expect(body.body.forwardedProps).toMatchObject({
      foo: "bar",
      stateless: true,
      isEphemeral: true,
    });
  });

  it("throws on createThread / listThreads / fetchHistory", async () => {
    const agent = new StatelessAjoraRuntimeAgent({ url, agentId: "x" });
    await expect(agent.createThread()).rejects.toThrow(/stateless/i);
    await expect(agent.listThreads()).rejects.toThrow(/stateless/i);
    await expect(agent.fetchHistory()).rejects.toThrow(/stateless/i);
  });

  it("preserves config on clone()", async () => {
    const agent = new StatelessAjoraRuntimeAgent({
      url,
      agentId: "suggestions",
      transport: "single",
    });
    const cloned = agent.clone();
    expect(cloned).toBeInstanceOf(StatelessAjoraRuntimeAgent);

    await cloned.runAgent({});

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(url);
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      method: "agent/run",
      params: { agentId: "suggestions" },
    });
    expect(body.body.forwardedProps).toMatchObject({
      stateless: true,
      isEphemeral: true,
    });
  });
});
