/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";

// React Native maps to plain DOM nodes so we can query rendered text.
// RN-specific props are stripped so React doesn't warn about unknown DOM
// attributes during tests.
const stripRnProps = ({
  style: _style,
  numberOfLines: _numberOfLines,
  ellipsizeMode: _ellipsizeMode,
  pointerEvents: _pointerEvents,
  ...rest
}: Record<string, unknown>) => rest;

vi.mock("react-native", () => {
  return {
    View: ({ children, ...props }: any) =>
      React.createElement(
        "div",
        { ...stripRnProps(props), "data-rn-view": true },
        children,
      ),
    Text: ({ children, ...props }: any) =>
      React.createElement(
        "span",
        { ...stripRnProps(props), "data-rn-text": true },
        children,
      ),
    StyleSheet: {
      create: (s: Record<string, unknown>) => s,
      flatten: (s: unknown) => s,
    },
  };
});

// Reanimated is reduced to inert wrappers — animation values are not under
// test here; only the conditional rendering driven by props is.
vi.mock("react-native-reanimated", () => {
  return {
    default: {
      View: ({ children, ...props }: any) =>
        React.createElement(
          "div",
          { ...stripRnProps(props), "data-rn-animated": true },
          children,
        ),
    },
    useAnimatedStyle: (fn: () => unknown) => fn(),
    useSharedValue: (init: number) => ({ value: init }),
    withTiming: (val: number) => val,
    withSequence: (val: number) => val,
    interpolate: (val: number) => val,
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
  };
});

vi.mock("../../../providers/AjoraThemeProvider", () => ({
  useAjoraTheme: () => ({
    colors: {
      assistantBubble: "#F3F4F6",
      textSecondary: "#6B7280",
      text: "#111827",
    },
  }),
}));

import { AjoraChatThinkingIndicator } from "../AjoraChatThinkingIndicator";

describe("AjoraChatThinkingIndicator", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders dots-only when no title or text is provided", () => {
    const { container, queryByText } = render(
      <AjoraChatThinkingIndicator isThinking />,
    );
    expect(queryByText(/./)).toBeNull();
    // The container still has rendered output (the animated wrapper), even
    // though no text content is shown.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((container as any).innerHTML.length).toBeGreaterThan(0);
  });

  it("renders the title when provided", () => {
    const { getByText } = render(
      <AjoraChatThinkingIndicator isThinking title="Planning" />,
    );
    expect(getByText("Planning")).toBeTruthy();
  });

  it("renders the live text when provided", () => {
    const { getByText } = render(
      <AjoraChatThinkingIndicator isThinking text="reasoning step" />,
    );
    expect(getByText("reasoning step")).toBeTruthy();
  });

  it("shows only the last non-empty line of multi-line text", () => {
    const text = "first line\nsecond line\nthird line";
    const { getByText, queryByText } = render(
      <AjoraChatThinkingIndicator isThinking text={text} />,
    );
    expect(getByText("third line")).toBeTruthy();
    expect(queryByText("first line")).toBeNull();
    expect(queryByText("second line")).toBeNull();
  });

  it("renders both title and text together", () => {
    const { getByText } = render(
      <AjoraChatThinkingIndicator
        isThinking
        title="Planning"
        text="step one"
      />,
    );
    expect(getByText("Planning")).toBeTruthy();
    expect(getByText("step one")).toBeTruthy();
  });

  it("treats trailing whitespace as no content (falls back to dots)", () => {
    const { queryByText } = render(
      <AjoraChatThinkingIndicator isThinking text={"\n   \n"} />,
    );
    expect(queryByText(/\S/)).toBeNull();
  });

  it("renders nothing when not thinking and never visible", () => {
    const { container } = render(<AjoraChatThinkingIndicator />);
    // Component returns null until isThinking flips to true.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((container as any).innerHTML).toBe("");
  });
});
