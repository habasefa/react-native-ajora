/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

type KeyboardEventCallback = (e: { endCoordinates: { height: number } }) => void;
type HideCallback = () => void;

const listeners: Record<string, KeyboardEventCallback | HideCallback> = {};
const removeMocks: Record<string, ReturnType<typeof vi.fn>> = {};

vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
  Keyboard: {
    addListener: vi.fn((event: string, callback: KeyboardEventCallback | HideCallback) => {
      listeners[event] = callback;
      const remove = vi.fn();
      removeMocks[event] = remove;
      return { remove };
    }),
  },
}));

import { useKeyboardHeight } from "../use-keyboard-height";

describe("useKeyboardHeight", () => {
  beforeEach(() => {
    for (const key of Object.keys(listeners)) delete listeners[key];
    for (const key of Object.keys(removeMocks)) delete removeMocks[key];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 initially", () => {
    const { result } = renderHook(() => useKeyboardHeight());
    expect(result.current).toBe(0);
  });

  it("should update height on keyboard show", () => {
    const { result } = renderHook(() => useKeyboardHeight());

    act(() => {
      const showCb = listeners["keyboardWillShow"] as KeyboardEventCallback;
      showCb({ endCoordinates: { height: 300 } });
    });

    expect(result.current).toBe(300);
  });

  it("should reset height on keyboard hide", () => {
    const { result } = renderHook(() => useKeyboardHeight());

    act(() => {
      const showCb = listeners["keyboardWillShow"] as KeyboardEventCallback;
      showCb({ endCoordinates: { height: 300 } });
    });

    expect(result.current).toBe(300);

    act(() => {
      const hideCb = listeners["keyboardWillHide"] as HideCallback;
      hideCb();
    });

    expect(result.current).toBe(0);
  });

  it("should unsubscribe on unmount", () => {
    const { unmount } = renderHook(() => useKeyboardHeight());

    unmount();

    expect(removeMocks["keyboardWillShow"]).toHaveBeenCalled();
    expect(removeMocks["keyboardWillHide"]).toHaveBeenCalled();
  });
});
