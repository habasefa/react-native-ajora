/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, cleanup, act } from "@testing-library/react";
import { useHistory } from "../hooks/use-history";
import { useAjora } from "../providers/AjoraProvider";
import { useAgent } from "../hooks/use-agent";

vi.mock("../providers/AjoraProvider", () => ({
  useAjora: vi.fn(),
}));

vi.mock("../hooks/use-agent", () => ({
  useAgent: vi.fn(),
}));

const mockUseAjora = useAjora as ReturnType<typeof vi.fn>;
const mockUseAgent = useAgent as ReturnType<typeof vi.fn>;

describe("useHistory", () => {
  let loadHistoryMock: ReturnType<typeof vi.fn>;
  let fakeAgent: any;

  beforeEach(() => {
    fakeAgent = {
      agentId: "default",
      messages: [],
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    };

    loadHistoryMock = vi.fn(async () => ({
      messages: [],
      hasMore: false,
      oldestMessageId: null,
    }));

    mockUseAjora.mockReturnValue({
      ajora: {
        loadHistory: loadHistoryMock,
      },
    });

    mockUseAgent.mockReturnValue({ agent: fakeAgent });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  let hookResult: ReturnType<typeof useHistory>;

  const TestComponent: React.FC<{
    agentId?: string;
    threadId?: string | null;
    pageSize?: number;
  }> = ({ agentId, threadId, pageSize }) => {
    hookResult = useHistory({ agentId, threadId, pageSize });
    return null;
  };

  describe("initial state", () => {
    it("starts idle when no threadId", () => {
      render(<TestComponent />);

      expect(hookResult.isLoading).toBe(false);
      expect(hookResult.isLoadingMore).toBe(false);
      expect(hookResult.hasMore).toBe(false);
      expect(hookResult.error).toBeNull();
    });

    it("does not call loadHistory when threadId is null", () => {
      render(<TestComponent threadId={null} />);

      expect(loadHistoryMock).not.toHaveBeenCalled();
    });
  });

  describe("initial load", () => {
    it("loads history when threadId is provided", async () => {
      loadHistoryMock.mockResolvedValueOnce({
        messages: [{ id: "msg-1", role: "user", content: "hi" }],
        hasMore: true,
        oldestMessageId: "msg-1",
      });

      await act(async () => {
        render(<TestComponent threadId="thread-1" />);
      });

      expect(loadHistoryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          agent: fakeAgent,
          threadId: "thread-1",
        }),
      );
      expect(hookResult.hasMore).toBe(true);
      expect(hookResult.isLoading).toBe(false);
    });

    it("does not re-load for the same threadId on re-render", async () => {
      loadHistoryMock.mockResolvedValueOnce({
        messages: [],
        hasMore: false,
        oldestMessageId: null,
      });

      let result: any;
      await act(async () => {
        result = render(<TestComponent threadId="thread-1" />);
      });

      expect(loadHistoryMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        result.rerender(<TestComponent threadId="thread-1" />);
      });

      // Should not call again for the same threadId
      expect(loadHistoryMock).toHaveBeenCalledTimes(1);
    });

    it("loads again when threadId changes", async () => {
      loadHistoryMock.mockResolvedValue({
        messages: [],
        hasMore: false,
        oldestMessageId: null,
      });

      let result: any;
      await act(async () => {
        result = render(<TestComponent threadId="thread-1" />);
      });

      expect(loadHistoryMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        result.rerender(<TestComponent threadId="thread-2" />);
      });

      expect(loadHistoryMock).toHaveBeenCalledTimes(2);
      expect(loadHistoryMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ threadId: "thread-2" }),
      );
    });
  });

  describe("error handling", () => {
    it("captures errors from loadHistory", async () => {
      loadHistoryMock.mockRejectedValueOnce(new Error("Network failed"));

      await act(async () => {
        render(<TestComponent threadId="thread-err" />);
      });

      expect(hookResult.error).toBeInstanceOf(Error);
      expect(hookResult.error!.message).toBe("Network failed");
      expect(hookResult.isLoading).toBe(false);
      expect(hookResult.hasMore).toBe(false);
    });
  });

  describe("loadMore pagination", () => {
    it("calls loadHistory with beforeMessageId for pagination", async () => {
      loadHistoryMock.mockResolvedValueOnce({
        messages: [{ id: "msg-50", role: "user", content: "oldest" }],
        hasMore: true,
        oldestMessageId: "msg-50",
      });

      await act(async () => {
        render(<TestComponent threadId="thread-page" pageSize={25} />);
      });

      expect(hookResult.hasMore).toBe(true);

      // Second page
      loadHistoryMock.mockResolvedValueOnce({
        messages: [{ id: "msg-100", role: "user", content: "even older" }],
        hasMore: false,
        oldestMessageId: "msg-100",
      });

      await act(async () => {
        await hookResult.loadMore();
      });

      expect(loadHistoryMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          threadId: "thread-page",
          beforeMessageId: "msg-50",
          limit: 25,
        }),
      );
      expect(hookResult.hasMore).toBe(false);
    });

    it("loadMore is a no-op when hasMore is false", async () => {
      loadHistoryMock.mockResolvedValueOnce({
        messages: [],
        hasMore: false,
        oldestMessageId: null,
      });

      await act(async () => {
        render(<TestComponent threadId="thread-nomore" />);
      });

      const callCount = loadHistoryMock.mock.calls.length;

      await act(async () => {
        await hookResult.loadMore();
      });

      // No additional call
      expect(loadHistoryMock).toHaveBeenCalledTimes(callCount);
    });
  });

  describe("reload", () => {
    it("re-fetches the initial page for the current thread", async () => {
      loadHistoryMock.mockResolvedValue({
        messages: [],
        hasMore: false,
        oldestMessageId: null,
      });

      await act(async () => {
        render(<TestComponent threadId="thread-reload" />);
      });

      expect(loadHistoryMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await hookResult.reload();
      });

      expect(loadHistoryMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("reset on null threadId", () => {
    it("resets state when threadId becomes null", async () => {
      loadHistoryMock.mockResolvedValueOnce({
        messages: [{ id: "msg-1", role: "user", content: "hi" }],
        hasMore: true,
        oldestMessageId: "msg-1",
      });

      let result: any;
      await act(async () => {
        result = render(<TestComponent threadId="thread-active" />);
      });

      expect(hookResult.hasMore).toBe(true);

      await act(async () => {
        result.rerender(<TestComponent threadId={null} />);
      });

      expect(hookResult.isLoading).toBe(false);
      expect(hookResult.isLoadingMore).toBe(false);
      expect(hookResult.hasMore).toBe(false);
      expect(hookResult.error).toBeNull();
    });
  });
});
