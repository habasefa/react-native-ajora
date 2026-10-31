import { ProxiedAjoraRuntimeAgent } from "../agent";
import { AjoraCore } from "../core";

const RUNTIME_URL = "https://runtime.example/rest";

const okJson = (payload: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(payload),
  }) as unknown as Response;

const makeAgent = () =>
  new ProxiedAjoraRuntimeAgent({
    runtimeUrl: RUNTIME_URL,
    agentId: "magnus",
    transport: "rest",
  });

describe("AjoraCore.loadHistory", () => {
  const originalFetch = global.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    (global as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (global as unknown as { fetch: typeof fetch }).fetch = originalFetch;
  });

  it("replaces agent.messages on initial load (no beforeMessageId)", async () => {
    const core = new AjoraCore({ runtimeUrl: RUNTIME_URL });
    const agent = makeAgent();
    // Agent starts empty; initial load populates messages

    fetchMock.mockResolvedValueOnce(
      okJson({
        messages: [
          { id: "u1", role: "user", content: "hi" },
          { id: "a1", role: "assistant", content: "hello" },
        ],
        hasMore: true,
        oldestMessageId: "u1",
      }),
    );

    const result = await core.loadHistory({ agent, threadId: "thread-1" });

    expect(result).toEqual({
      messages: [
        { id: "u1", role: "user", content: "hi" },
        { id: "a1", role: "assistant", content: "hello" },
      ],
      hasMore: true,
      oldestMessageId: "u1",
    });
    expect(agent.messages.map((m) => m.id)).toEqual(["u1", "a1"]);
  });

  it("prepends and dedupes when beforeMessageId is provided (load earlier)", async () => {
    const core = new AjoraCore({ runtimeUrl: RUNTIME_URL });
    const agent = makeAgent();
    agent.setMessages([
      { id: "u3", role: "user", content: "third" } as any,
      { id: "a3", role: "assistant", content: "reply3" } as any,
    ]);

    fetchMock.mockResolvedValueOnce(
      okJson({
        messages: [
          { id: "u1", role: "user", content: "first" },
          { id: "a1", role: "assistant", content: "reply1" },
          // u3 already in current messages — should be deduped
          { id: "u3", role: "user", content: "third" },
        ],
        hasMore: false,
        oldestMessageId: "u1",
      }),
    );

    await core.loadHistory({
      agent,
      threadId: "thread-1",
      beforeMessageId: "u3",
    });

    expect(agent.messages.map((m) => m.id)).toEqual(["u1", "a1", "u3", "a3"]);
  });

  it("does not call fetch or mutate state for non-proxied agents", async () => {
    const core = new AjoraCore({ runtimeUrl: RUNTIME_URL });
    // Plain object — not a ProxiedAjoraRuntimeAgent
    const fakeAgent = {
      messages: [{ id: "x", role: "user", content: "x" }],
      setMessages: vi.fn(),
    } as any;

    const result = await core.loadHistory({
      agent: fakeAgent,
      threadId: "thread-1",
    });

    expect(result).toEqual({
      messages: [],
      hasMore: false,
      oldestMessageId: null,
    });
    expect(fakeAgent.setMessages).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("propagates the loaded hasMore/oldestMessageId for pagination", async () => {
    const core = new AjoraCore({ runtimeUrl: RUNTIME_URL });
    const agent = makeAgent();

    fetchMock.mockResolvedValueOnce(
      okJson({
        messages: [{ id: "u2", role: "user", content: "x" }],
        hasMore: true,
        oldestMessageId: "u2",
      }),
    );

    const first = await core.loadHistory({ agent, threadId: "t" });
    expect(first.hasMore).toBe(true);
    expect(first.oldestMessageId).toBe("u2");

    fetchMock.mockResolvedValueOnce(
      okJson({
        messages: [{ id: "u1", role: "user", content: "y" }],
        hasMore: false,
        oldestMessageId: "u1",
      }),
    );

    const second = await core.loadHistory({
      agent,
      threadId: "t",
      beforeMessageId: "u2",
    });
    expect(second.hasMore).toBe(false);
    expect(second.oldestMessageId).toBe("u1");
    expect(agent.messages.map((m) => m.id)).toEqual(["u1", "u2"]);
  });
});
