import { ProxiedAjoraRuntimeAgent, FetchHistoryError } from "../agent";

const REST_URL = "https://runtime.example/rest";
const SINGLE_URL = "https://runtime.example/single";

const okJson = (payload: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(payload),
  }) as unknown as Response;

const errJson = (status: number, body: unknown = {}): Response =>
  ({
    ok: false,
    status,
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as Response;

describe("ProxiedAjoraRuntimeAgent.fetchHistory", () => {
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

  describe("REST transport", () => {
    it("POSTs to /agent/{id}/history with the request body", async () => {
      const agent = new ProxiedAjoraRuntimeAgent({
        runtimeUrl: REST_URL,
        agentId: "magnus",
        headers: { Authorization: "Bearer t" },
        transport: "rest",
      });

      fetchMock.mockResolvedValueOnce(
        okJson({
          messages: [{ id: "u1", role: "user", content: "hi" }],
          hasMore: false,
          oldestMessageId: "u1",
        }),
      );

      const result = await agent.fetchHistory({
        threadId: "thread-1",
        beforeMessageId: "m5",
        limit: 25,
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${REST_URL}/agent/magnus/history`);
      expect(init.method).toBe("POST");

      const body = JSON.parse(init.body as string);
      expect(body).toEqual({
        threadId: "thread-1",
        beforeMessageId: "m5",
        limit: 25,
      });

      const headers = new Headers(init.headers as Record<string, string>);
      expect(headers.get("authorization")).toBe("Bearer t");
      expect(headers.get("content-type")).toBe("application/json");

      expect(result.messages).toHaveLength(1);
      expect(result.hasMore).toBe(false);
      expect(result.oldestMessageId).toBe("u1");
    });
  });

  describe("Single endpoint transport", () => {
    it("POSTs an envelope with method=agent/history to the runtime URL", async () => {
      const agent = new ProxiedAjoraRuntimeAgent({
        runtimeUrl: SINGLE_URL,
        agentId: "magnus",
        headers: { Authorization: "Bearer t" },
        transport: "single",
      });

      fetchMock.mockResolvedValueOnce(
        okJson({
          messages: [],
          hasMore: false,
          oldestMessageId: null,
        }),
      );

      await agent.fetchHistory({ threadId: "thread-1" });

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(SINGLE_URL);

      const body = JSON.parse(init.body as string);
      expect(body).toEqual({
        method: "agent/history",
        params: { agentId: "magnus" },
        body: {
          threadId: "thread-1",
          beforeMessageId: undefined,
          limit: undefined,
        },
      });
    });
  });

  describe("Error mapping", () => {
    it("throws FetchHistoryError with status 401 on Unauthorized", async () => {
      const agent = new ProxiedAjoraRuntimeAgent({
        runtimeUrl: REST_URL,
        agentId: "magnus",
        transport: "rest",
      });
      fetchMock.mockResolvedValueOnce(errJson(401, { message: "Unauthorized" }));

      await expect(
        agent.fetchHistory({ threadId: "thread-1" }),
      ).rejects.toMatchObject({
        name: "FetchHistoryError",
        status: 401,
        message: "Unauthorized",
      });
    });

    it("throws FetchHistoryError with status 403 on Forbidden", async () => {
      const agent = new ProxiedAjoraRuntimeAgent({
        runtimeUrl: REST_URL,
        agentId: "magnus",
        transport: "rest",
      });
      fetchMock.mockResolvedValueOnce(errJson(403, { message: "Forbidden" }));

      await expect(
        agent.fetchHistory({ threadId: "thread-1" }),
      ).rejects.toMatchObject({ status: 403 });
    });

    it("throws FetchHistoryError with status 0 on network failure", async () => {
      const agent = new ProxiedAjoraRuntimeAgent({
        runtimeUrl: REST_URL,
        agentId: "magnus",
        transport: "rest",
      });
      fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));

      const err = await agent
        .fetchHistory({ threadId: "thread-1" })
        .catch((e) => e);
      expect(err).toBeInstanceOf(FetchHistoryError);
      expect((err as FetchHistoryError).status).toBe(0);
    });

    it("throws when the response payload is malformed", async () => {
      const agent = new ProxiedAjoraRuntimeAgent({
        runtimeUrl: REST_URL,
        agentId: "magnus",
        transport: "rest",
      });
      fetchMock.mockResolvedValueOnce(okJson({ wrong: "shape" }));

      await expect(
        agent.fetchHistory({ threadId: "thread-1" }),
      ).rejects.toMatchObject({
        name: "FetchHistoryError",
        message: expect.stringContaining("malformed"),
      });
    });
  });
});
