/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, cleanup, act } from "@testing-library/react";
import { useLiveThinking } from "../use-live-thinking";
import { useAjora } from "../../providers/AjoraProvider";
import { AjoraCoreRuntimeConnectionStatus } from "../../../core";
import { AgentSubscriber, EventType } from "@ag-ui/client";

vi.mock("../../providers/AjoraProvider", () => ({
  useAjora: vi.fn(),
}));

vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "light" },
}));

const mockUseAjora = useAjora as ReturnType<typeof vi.fn>;

function createMockAgent() {
  const subscribers: AgentSubscriber[] = [];
  const fakeAgent = {
    agentId: "default",
    messages: [] as any[],
    isRunning: false,
    subscribe: vi.fn((handlers: AgentSubscriber) => {
      subscribers.push(handlers);
      return { unsubscribe: () => {} };
    }),
    fire(event: any) {
      for (const s of subscribers) {
        s.onEvent?.({
          event,
          messages: fakeAgent.messages,
        } as any);
      }
    },
  };
  return fakeAgent;
}

describe("useLiveThinking", () => {
  let agent: ReturnType<typeof createMockAgent>;
  let renderedState: any;

  const TestComponent: React.FC = () => {
    renderedState = useLiveThinking();
    return null;
  };

  beforeEach(() => {
    agent = createMockAgent();
    mockUseAjora.mockReturnValue({
      ajora: {
        getAgent: vi.fn(() => agent),
        agents: { default: agent },
        runtimeConnectionStatus: AjoraCoreRuntimeConnectionStatus.Connected,
        runtimeUrl: undefined,
        runtimeTransport: undefined,
        headers: {},
        subscribe: vi.fn(),
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("starts idle and updates on streaming events", () => {
    render(<TestComponent />);
    expect(renderedState).toEqual({ text: "", isActive: false });

    act(() => {
      agent.fire({ type: EventType.THINKING_START, title: "Plan" });
    });
    expect(renderedState).toEqual({
      title: "Plan",
      text: "",
      isActive: true,
    });

    act(() => {
      agent.fire({
        type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
        delta: "hi",
      });
    });
    expect(renderedState.text).toBe("hi");
    expect(renderedState.isActive).toBe(true);

    act(() => {
      agent.fire({
        type: EventType.TEXT_MESSAGE_START,
        messageId: "x",
        role: "assistant",
      });
    });
    expect(renderedState).toEqual({ text: "", isActive: false });
  });
});
