import React from "react";
import TestRenderer, {
  act,
  type ReactTestRenderer,
} from "react-test-renderer";
import { useAjoraHaptics, AjoraHaptics } from "../use-haptics";
import { AjoraPreferencesProvider } from "../../providers/ajora-preferences";

// react-test-renderer + React 19 needs this flag for act() to flush cleanly.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

// Mock the optional-haptics seam (a real, resolvable module) rather than the
// unresolvable `expo-haptics` specifier.
const { impactAsync, notificationAsync } = vi.hoisted(() => ({
  impactAsync: vi.fn((_s: string) => Promise.resolve()),
  notificationAsync: vi.fn((_t: string) => Promise.resolve()),
}));

vi.mock("../../lib/optional-haptics", () => ({
  haptics: {
    impactAsync,
    notificationAsync,
    ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
    NotificationFeedbackType: {
      Success: "success",
      Warning: "warning",
      Error: "error",
    },
  },
}));

let haptics: AjoraHaptics;

const Capture: React.FC = () => {
  haptics = useAjoraHaptics();
  return null;
};

function renderWith(hapticsEnabled?: boolean) {
  const tree =
    hapticsEnabled === undefined ? (
      <Capture /> // no provider → safe default
    ) : (
      <AjoraPreferencesProvider value={{ hapticsEnabled }}>
        <Capture />
      </AjoraPreferencesProvider>
    );
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(tree);
  });
  return renderer;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("useAjoraHaptics", () => {
  describe("default-off (safe by default)", () => {
    it("no-ops with no provider", () => {
      renderWith(undefined);
      act(() => {
        haptics.impactLight();
        haptics.impactMedium();
        haptics.notifySuccess();
        haptics.notifyError();
      });
      expect(impactAsync).not.toHaveBeenCalled();
      expect(notificationAsync).not.toHaveBeenCalled();
    });

    it("no-ops when hapticsEnabled is false", () => {
      renderWith(false);
      act(() => {
        haptics.impactLight();
        haptics.notifySuccess();
      });
      expect(impactAsync).not.toHaveBeenCalled();
      expect(notificationAsync).not.toHaveBeenCalled();
    });
  });

  describe("opted in", () => {
    it("fires the correct expo-haptics primitive for each callback", () => {
      renderWith(true);

      act(() => haptics.impactLight());
      expect(impactAsync).toHaveBeenLastCalledWith("light");

      act(() => haptics.impactMedium());
      expect(impactAsync).toHaveBeenLastCalledWith("medium");

      act(() => haptics.notifySuccess());
      expect(notificationAsync).toHaveBeenLastCalledWith("success");

      act(() => haptics.notifyError());
      expect(notificationAsync).toHaveBeenLastCalledWith("error");
    });
  });

  describe("stability", () => {
    it("returns referentially-stable callbacks across re-render", () => {
      const renderer = renderWith(true);
      const first = haptics;
      act(() => {
        renderer.update(
          <AjoraPreferencesProvider value={{ hapticsEnabled: true }}>
            <Capture />
          </AjoraPreferencesProvider>,
        );
      });
      expect(haptics.impactLight).toBe(first.impactLight);
      expect(haptics.impactMedium).toBe(first.impactMedium);
      expect(haptics.notifySuccess).toBe(first.notifySuccess);
      expect(haptics.notifyError).toBe(first.notifyError);
    });
  });
});
