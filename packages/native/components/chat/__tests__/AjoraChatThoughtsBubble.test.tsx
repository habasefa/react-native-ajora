/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";

const stripRnProps = ({
  style: _style,
  numberOfLines: _numberOfLines,
  ellipsizeMode: _ellipsizeMode,
  pointerEvents: _pointerEvents,
  selectable: _selectable,
  accessibilityRole: _accessibilityRole,
  accessibilityState: _accessibilityState,
  accessibilityLabel: _accessibilityLabel,
  ...rest
}: Record<string, unknown>) => rest;

vi.mock("react-native", () => ({
  View: ({ children, ...props }: any) =>
    React.createElement("div", stripRnProps(props), children),
  Text: ({ children, ...props }: any) =>
    React.createElement("span", stripRnProps(props), children),
  Pressable: ({ children, onPress, ...props }: any) =>
    React.createElement(
      "button",
      { ...stripRnProps(props), onClick: onPress },
      children,
    ),
  StyleSheet: {
    create: (s: Record<string, unknown>) => s,
    flatten: (s: unknown) => s,
    hairlineWidth: 1,
  },
}));

vi.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) =>
    React.createElement("i", { "data-icon": name }, null),
}));

vi.mock("../../../providers/AjoraThemeProvider", () => ({
  useAjoraTheme: () => ({
    colors: {
      surface: "#fff",
      border: "#eee",
      text: "#111",
      textSecondary: "#666",
      iconDefault: "#888",
    },
  }),
}));

vi.mock("../../../providers/AjoraChatConfigurationProvider", () => ({
  useAjoraChatConfiguration: () => null,
  AjoraChatDefaultLabels: {
    assistantMessageThoughtsLabel: "Thoughts",
    assistantMessageThoughtsDurationLabel: "Thought for",
  },
}));

import {
  AjoraChatThoughtsBubble,
  formatThoughtsDuration,
} from "../AjoraChatThoughtsBubble";

describe("formatThoughtsDuration", () => {
  it("returns null when either timestamp is missing", () => {
    expect(formatThoughtsDuration(undefined, 100)).toBeNull();
    expect(formatThoughtsDuration(100, undefined)).toBeNull();
    expect(formatThoughtsDuration(undefined, undefined)).toBeNull();
  });

  it("returns null when endedAt precedes startedAt", () => {
    expect(formatThoughtsDuration(2000, 1000)).toBeNull();
  });

  it("renders sub-second durations as <1s", () => {
    expect(formatThoughtsDuration(1000, 1500)).toBe("<1s");
  });

  it("renders seconds for sub-minute durations", () => {
    expect(formatThoughtsDuration(0, 4000)).toBe("4s");
    expect(formatThoughtsDuration(0, 59 * 1000)).toBe("59s");
  });

  it("renders minutes + seconds for longer durations", () => {
    expect(formatThoughtsDuration(0, 60 * 1000)).toBe("1m");
    expect(formatThoughtsDuration(0, 90 * 1000)).toBe("1m 30s");
    expect(formatThoughtsDuration(0, 125 * 1000)).toBe("2m 5s");
  });
});

describe("AjoraChatThoughtsBubble", () => {
  afterEach(() => cleanup());

  it("renders nothing when thinking is missing", () => {
    const { container } = render(<AjoraChatThoughtsBubble />);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((container as any).innerHTML).toBe("");
  });

  it("renders nothing when thinking has empty text", () => {
    const { container } = render(
      <AjoraChatThoughtsBubble
        thinking={{ text: "   ", startedAt: 1, endedAt: 2 }}
      />,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((container as any).innerHTML).toBe("");
  });

  it("uses the title from the block when present", () => {
    const { getByText } = render(
      <AjoraChatThoughtsBubble
        thinking={{
          title: "Planning",
          text: "step one",
          startedAt: 1000,
          endedAt: 5000,
        }}
      />,
    );
    expect(getByText("Planning")).toBeTruthy();
  });

  it("falls back to the default label when block has no title", () => {
    const { getByText } = render(
      <AjoraChatThoughtsBubble
        thinking={{ text: "x", startedAt: 1000, endedAt: 2000 }}
      />,
    );
    expect(getByText("Thoughts")).toBeTruthy();
  });

  it("shows duration in the meta line when block has ended", () => {
    const { getByText } = render(
      <AjoraChatThoughtsBubble
        thinking={{ text: "x", startedAt: 1000, endedAt: 5000 }}
      />,
    );
    expect(getByText("Thought for 4s")).toBeTruthy();
  });

  it("omits the meta line while still streaming (no endedAt)", () => {
    const { queryByText } = render(
      <AjoraChatThoughtsBubble
        thinking={{ text: "x", startedAt: 1000 }}
      />,
    );
    expect(queryByText(/Thought for/)).toBeNull();
  });

  it("starts collapsed and hides the body text", () => {
    const { queryByText } = render(
      <AjoraChatThoughtsBubble
        thinking={{
          title: "T",
          text: "long reasoning body",
          startedAt: 1000,
          endedAt: 2000,
        }}
      />,
    );
    expect(queryByText("long reasoning body")).toBeNull();
  });

  it("expands on header press to reveal the body", () => {
    const { getByRole, getByText } = render(
      <AjoraChatThoughtsBubble
        thinking={{
          title: "T",
          text: "long reasoning body",
          startedAt: 1000,
          endedAt: 2000,
        }}
      />,
    );
    fireEvent.click(getByRole("button"));
    expect(getByText("long reasoning body")).toBeTruthy();
  });

  it("respects defaultExpanded=true", () => {
    const { getByText } = render(
      <AjoraChatThoughtsBubble
        defaultExpanded
        thinking={{
          title: "T",
          text: "visible from the start",
          startedAt: 1000,
          endedAt: 2000,
        }}
      />,
    );
    expect(getByText("visible from the start")).toBeTruthy();
  });
});
