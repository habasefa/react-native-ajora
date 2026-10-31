/**
 * @vitest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useThreads } from "../use-threads";
import { useAjora } from "../../providers/AjoraProvider";
import { AjoraCoreRuntimeConnectionStatus } from "../../../core";

vi.mock("../../providers/AjoraProvider", () => ({
  useAjora: vi.fn(),
}));

const mockUseAjora = useAjora as ReturnType<typeof vi.fn>;

function makeThread(id: string, title = `Thread ${id}`) {
  return { id, title, createdAt: new Date().toISOString() };
}

describe("useThreads", () => {
  let listThreadsMock: ReturnType<typeof vi.fn>;
  let createThreadMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    listThreadsMock = vi.fn().mockResolvedValue({
      threads: [makeThread("t-1"), makeThread("t-2")],
      nextCursor: "cursor-abc",
      hasMore: true,
    });

    createThreadMock = vi.fn().mockResolvedValue(makeThread("t-new"));

    mockUseAjora.mockReturnValue({
      ajora: {
        listThreads: listThreadsMock,
        createThread: createThreadMock,
        runtimeConnectionStatus: AjoraCoreRuntimeConnectionStatus.Connected,
        runtimeUrl: "http://localhost:3000",
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("starts with empty state and isLoading", async () => {
    const { result } = renderHook(() =>
      useThreads({ resourceId: "user-1" })
    );

    expect(result.current.threads).toEqual([]);
    // isLoading may already be true from the initial effect
    expect(result.current.error).toBeNull();

    // Let the async effect settle to avoid act() warnings
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("loads threads on mount when runtime is connected", async () => {
    const { result } = renderHook(() =>
      useThreads({ resourceId: "user-1" })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.threads).toHaveLength(2);
    expect(result.current.threads[0].id).toBe("t-1");
    expect(result.current.hasMore).toBe(true);
  });

  it("does not load when resourceId is empty", async () => {
    const { result } = renderHook(() =>
      useThreads({ resourceId: "" })
    );

    // Wait a tick to ensure no load was triggered
    await new Promise(r => setTimeout(r, 10));

    expect(listThreadsMock).not.toHaveBeenCalled();
    expect(result.current.threads).toEqual([]);
  });

  it("passes pageSize to listThreads", async () => {
    renderHook(() =>
      useThreads({ resourceId: "user-1", pageSize: 5 })
    );

    await waitFor(() => {
      expect(listThreadsMock).toHaveBeenCalled();
    });

    expect(listThreadsMock).toHaveBeenCalledWith(
      "default",
      expect.objectContaining({ limit: 5 })
    );
  });

  it("uses provided agentId", async () => {
    renderHook(() =>
      useThreads({ resourceId: "user-1", agentId: "my-agent" })
    );

    await waitFor(() => {
      expect(listThreadsMock).toHaveBeenCalled();
    });

    expect(listThreadsMock).toHaveBeenCalledWith(
      "my-agent",
      expect.anything()
    );
  });

  it("handles load errors", async () => {
    listThreadsMock.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() =>
      useThreads({ resourceId: "user-1" })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Network error");
    expect(result.current.threads).toEqual([]);
  });

  describe("loadMore", () => {
    it("appends next page of threads", async () => {
      const { result } = renderHook(() =>
        useThreads({ resourceId: "user-1" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      listThreadsMock.mockResolvedValueOnce({
        threads: [makeThread("t-3")],
        nextCursor: null,
        hasMore: false,
      });

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.threads).toHaveLength(3);
      expect(result.current.threads[2].id).toBe("t-3");
      expect(result.current.hasMore).toBe(false);
    });

    it("does nothing when hasMore is false", async () => {
      listThreadsMock.mockResolvedValueOnce({
        threads: [makeThread("t-1")],
        nextCursor: null,
        hasMore: false,
      });

      const { result } = renderHook(() =>
        useThreads({ resourceId: "user-1" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const callCount = listThreadsMock.mock.calls.length;

      await act(async () => {
        await result.current.loadMore();
      });

      expect(listThreadsMock.mock.calls.length).toBe(callCount);
    });
  });

  describe("reload", () => {
    it("re-fetches from the beginning", async () => {
      const { result } = renderHook(() =>
        useThreads({ resourceId: "user-1" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      listThreadsMock.mockResolvedValueOnce({
        threads: [makeThread("t-fresh")],
        nextCursor: null,
        hasMore: false,
      });

      await act(async () => {
        await result.current.reload();
      });

      expect(result.current.threads).toHaveLength(1);
      expect(result.current.threads[0].id).toBe("t-fresh");
    });
  });

  describe("createThread", () => {
    it("creates a thread and prepends it to the list", async () => {
      const { result } = renderHook(() =>
        useThreads({ resourceId: "user-1" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let created: any;
      await act(async () => {
        created = await result.current.createThread({ title: "New chat" });
      });

      expect(created.id).toBe("t-new");
      expect(result.current.threads[0].id).toBe("t-new");
      expect(result.current.threads).toHaveLength(3);
    });

    it("calls ajora.createThread with the correct agentId", async () => {
      const { result } = renderHook(() =>
        useThreads({ resourceId: "user-1", agentId: "my-agent" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createThread();
      });

      expect(createThreadMock).toHaveBeenCalledWith(
        "my-agent",
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });
  });
});
