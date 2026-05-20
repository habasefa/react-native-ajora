import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { useAgent, UseAgentUpdate } from "../use-agent";
import { useAjora } from "../../providers/AjoraProvider";
import { AjoraPreferencesProvider } from "../../providers/ajora-preferences";
import { AjoraCoreRuntimeConnectionStatus } from "../../../core";

// react-test-renderer + React 19 needs this flag for act() to flush cleanly.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

vi.mock("../../providers/AjoraProvider", () => ({
  useAjora: vi.fn(),
}));

// Mock the optional-haptics seam (resolvable) instead of `expo-haptics`.
const { impactAsync } = vi.hoisted(() => ({
  impactAsync: vi.fn((_s: string) => Promise.resolve()),
}));

vi.mock("../../lib/optional-haptics", () => ({
  haptics: {
    impactAsync,
    ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  },
}));

const mockUseAjora = useAjora as ReturnType<typeof vi.fn>;

let lastSubscriber: any;
const fakeAgent = {
  agentId: "test-agent",
  messages: [] as unknown[],
  isRunning: false,
  subscribe: vi.fn((handlers: any) => {
    lastSubscriber = handlers;
    return { unsubscribe: vi.fn() };
  }),
};

beforeEach(() => {
  mockUseAjora.mockReturnValue({
    ajora: {
      getAgent: vi.fn(() => fakeAgent),
      agents: { "test-agent": fakeAgent },
      runtimeConnectionStatus: AjoraCoreRuntimeConnectionStatus.Connected,
      runtimeUrl: undefined,
      runtimeTransport: undefined,
      headers: {},
      subscribe: vi.fn(),
    },
  });
});

afterEach(() => {
  fakeAgent.isRunning = false;
  vi.clearAllMocks();
});

const Probe: React.FC = () => {
  useAgent({
    agentId: "test-agent",
    updates: [UseAgentUpdate.OnMessagesChanged],
  });
  return null;
};

function mount(withHaptics: boolean) {
  const tree = withHaptics ? (
    <AjoraPreferencesProvider value={{ hapticsEnabled: true }}>
      <Probe />
    </AjoraPreferencesProvider>
  ) : (
    <Probe />
  );
  act(() => {
    TestRenderer.create(tree);
  });
}

const tick = () => act(() => lastSubscriber.onMessagesChanged());

describe("useAgent streaming haptics (every other token)", () => {
  it("does not buzz while haptics are disabled (no provider)", () => {
    fakeAgent.isRunning = true;
    mount(false);
    tick();
    tick();
    tick();
    tick();
    expect(impactAsync).not.toHaveBeenCalled();
  });

  it("fires on every other onMessagesChanged while running", () => {
    fakeAgent.isRunning = true;
    mount(true);
    tick(); // 1 — skip
    tick(); // 2 — fire
    tick(); // 3 — skip
    tick(); // 4 — fire
    expect(impactAsync).toHaveBeenCalledTimes(2);
    expect(impactAsync).toHaveBeenCalledWith("light");
  });

  it("never buzzes when the agent is not running", () => {
    fakeAgent.isRunning = false;
    mount(true);
    tick();
    tick();
    tick();
    expect(impactAsync).not.toHaveBeenCalled();
  });

  it("resets the tick phase between runs", () => {
    fakeAgent.isRunning = true;
    mount(true);

    tick(); // run A, tick 1 — skip
    expect(impactAsync).not.toHaveBeenCalled();

    fakeAgent.isRunning = false;
    tick(); // run ends — counter resets

    fakeAgent.isRunning = true;
    tick(); // run B, tick 1 — skip (proves reset; else this would fire)
    expect(impactAsync).not.toHaveBeenCalled();

    tick(); // run B, tick 2 — fire
    expect(impactAsync).toHaveBeenCalledTimes(1);
  });
});
