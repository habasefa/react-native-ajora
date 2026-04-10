/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, cleanup, act } from "@testing-library/react";
import { useAgent, UseAgentUpdate } from "../hooks/use-agent";
import { useAjora } from "../providers/AjoraProvider";
import { AjoraCoreRuntimeConnectionStatus } from "../../core";

vi.mock("../providers/AjoraProvider", () => ({
  useAjora: vi.fn(),
}));

// Mock expo-haptics so the dynamic require doesn't blow up in jsdom
vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "light" },
}));

const mockUseAjora = useAjora as ReturnType<typeof vi.fn>;

describe("useAgent", () => {
  let subscribeMock: ReturnType<typeof vi.fn>;
  let unsubscribeMock: ReturnType<typeof vi.fn>;
  let getAgentMock: ReturnType<typeof vi.fn>;
  let lastSubscriber: any;

  const fakeAgent = {
    agentId: "test-agent",
    messages: [],
    isRunning: false,
    subscribe: vi.fn((handlers: any) => {
      lastSubscriber = handlers;
      return { unsubscribe: unsubscribeMock };
    }),
  };

  beforeEach(() => {
    unsubscribeMock = vi.fn();
    subscribeMock = vi.fn();
    getAgentMock = vi.fn(() => fakeAgent);

    mockUseAjora.mockReturnValue({
      ajora: {
        getAgent: getAgentMock,
        agents: { "test-agent": fakeAgent },
        runtimeConnectionStatus: AjoraCoreRuntimeConnectionStatus.Connected,
        runtimeUrl: undefined,
        runtimeTransport: undefined,
        headers: {},
        subscribe: subscribeMock,
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  let hookResult: ReturnType<typeof useAgent>;

  const TestComponent: React.FC<{
    agentId?: string;
    updates?: UseAgentUpdate[];
  }> = ({ agentId, updates }) => {
    hookResult = useAgent({ agentId, updates });
    return null;
  };

  describe("agent resolution", () => {
    it("returns existing agent when found", () => {
      render(<TestComponent agentId="test-agent" />);

      expect(getAgentMock).toHaveBeenCalledWith("test-agent");
      expect(hookResult.agent).toBe(fakeAgent);
    });

    it("uses DEFAULT_AGENT_ID when no agentId provided", () => {
      render(<TestComponent />);

      expect(getAgentMock).toHaveBeenCalledWith("default");
    });

    it("throws when agent not found and no runtime configured", () => {
      getAgentMock.mockReturnValue(undefined);
      mockUseAjora.mockReturnValue({
        ajora: {
          getAgent: getAgentMock,
          agents: {},
          runtimeConnectionStatus: AjoraCoreRuntimeConnectionStatus.Connected,
          runtimeUrl: undefined,
          runtimeTransport: undefined,
          headers: {},
          subscribe: subscribeMock,
        },
      });

      expect(() => render(<TestComponent agentId="unknown" />)).toThrow(
        /Agent 'unknown' not found/,
      );
    });

    it("creates provisional agent when runtime is connecting", () => {
      getAgentMock.mockReturnValue(undefined);
      mockUseAjora.mockReturnValue({
        ajora: {
          getAgent: getAgentMock,
          agents: {},
          runtimeConnectionStatus:
            AjoraCoreRuntimeConnectionStatus.Connecting,
          runtimeUrl: "https://example.com/runtime",
          runtimeTransport: undefined,
          headers: {},
          subscribe: subscribeMock,
        },
      });

      render(<TestComponent agentId="pending-agent" />);

      // Should not throw — returns a provisional agent
      expect(hookResult.agent).toBeDefined();
      expect(hookResult.agent.agentId).toBe("pending-agent");
    });
  });

  describe("subscriptions", () => {
    it("subscribes to all updates by default", () => {
      render(<TestComponent agentId="test-agent" />);

      expect(fakeAgent.subscribe).toHaveBeenCalled();
      const handlers = fakeAgent.subscribe.mock.calls[0][0];
      expect(handlers.onMessagesChanged).toBeDefined();
      expect(handlers.onStateChanged).toBeDefined();
      expect(handlers.onRunInitialized).toBeDefined();
      expect(handlers.onRunFinalized).toBeDefined();
      expect(handlers.onRunFailed).toBeDefined();
    });

    it("only subscribes to specified updates", () => {
      render(
        <TestComponent
          agentId="test-agent"
          updates={[UseAgentUpdate.OnMessagesChanged]}
        />,
      );

      const handlers = fakeAgent.subscribe.mock.calls[0][0];
      expect(handlers.onMessagesChanged).toBeDefined();
      expect(handlers.onStateChanged).toBeUndefined();
      expect(handlers.onRunInitialized).toBeUndefined();
    });

    it("does not subscribe when updates is empty array", () => {
      render(<TestComponent agentId="test-agent" updates={[]} />);

      expect(fakeAgent.subscribe).not.toHaveBeenCalled();
    });

    it("unsubscribes on unmount", () => {
      const { unmount } = render(<TestComponent agentId="test-agent" />);

      expect(fakeAgent.subscribe).toHaveBeenCalledTimes(1);

      unmount();

      expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    });
  });
});
