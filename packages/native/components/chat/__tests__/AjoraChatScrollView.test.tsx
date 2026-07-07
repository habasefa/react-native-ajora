/**
 * @vitest-environment node
 */
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const stripRnProps = ({
  style: _style,
  contentContainerStyle: _contentContainerStyle,
  keyboardShouldPersistTaps: _keyboardShouldPersistTaps,
  showsVerticalScrollIndicator: _showsVerticalScrollIndicator,
  scrollEventThrottle: _scrollEventThrottle,
  maintainVisibleContentPosition: _maintainVisibleContentPosition,
  renderScrollComponent: _renderScrollComponent,
  accessibilityRole: _accessibilityRole,
  accessibilityLabel: _accessibilityLabel,
  ...rest
}: Record<string, unknown>) => rest;

const flashListRef = {
  scrollToEnd: vi.fn(),
  scrollToOffset: vi.fn(),
};

let latestFlashListProps: any = null;

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
  ActivityIndicator: () => React.createElement("span", null),
  ScrollView: ({ children, ...props }: any) =>
    React.createElement("div", stripRnProps(props), children),
  StyleSheet: {
    create: (s: Record<string, unknown>) => s,
    flatten: (s: unknown) => s,
    hairlineWidth: 1,
  },
}));

vi.mock("@shopify/flash-list", () => ({
  FlashList: React.forwardRef((props: any, ref: any) => {
    latestFlashListProps = props;
    React.useImperativeHandle(ref, () => flashListRef);
    return React.createElement("div", { "data-testid": "flash-list" });
  }),
}));

vi.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) =>
    React.createElement("i", { "data-icon": name }, null),
}));

vi.mock("react-native-reanimated", () => ({
  default: {
    View: ({ children, ...props }: any) =>
      React.createElement("div", stripRnProps(props), children),
  },
  useAnimatedStyle: (fn: () => unknown) => fn(),
}));

vi.mock("react-native-keyboard-controller", () => ({
  KeyboardProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
  useReanimatedKeyboardAnimation: () => ({ height: { value: 0 } }),
}));

vi.mock("../../../providers/AjoraThemeProvider", () => ({
  useAjoraTheme: () => ({
    colors: {
      surface: "#fff",
      border: "#eee",
      iconDefault: "#888",
      text: "#111",
      textSecondary: "#666",
      assistantBubble: "#f4f4f5",
      userBubble: "#111",
    },
  }),
}));

vi.mock("../../../providers/AjoraChatConfigurationProvider", () => ({
  useAjoraChatConfiguration: () => null,
  AjoraChatDefaultLabels: {},
}));

vi.mock("../../../hooks/use-live-thinking", () => ({
  useLiveThinking: () => null,
}));

vi.mock("../AjoraChatInput", () => ({
  default: () => null,
}));

vi.mock("../AjoraChatSuggestionView", () => ({
  default: () => null,
}));

vi.mock("../AjoraChatMessageView", () => ({
  default: () => null,
  dedupeMessagesById: (messages: unknown[]) => messages,
  useRenderMessage: () => null,
}));

vi.mock("../AjoraChatThinkingIndicator", () => ({
  default: () => null,
}));

vi.mock("../AjoraChatEmptyState", () => ({
  default: () => null,
}));

vi.mock("../AjoraChatLoadingState", () => ({
  default: () => null,
}));

vi.mock("../AjoraChatErrorMessage", () => ({
  default: () => null,
}));

import { AjoraChatScrollView } from "../AjoraChatView";

const message = (id: string, role: "user" | "assistant", content: string) =>
  ({ id, role, content }) as any;

const scrollEvent = (offsetY: number, contentHeight = 1000, viewHeight = 500) =>
  ({
    nativeEvent: {
      contentOffset: { y: offsetY },
      contentSize: { height: contentHeight },
      layoutMeasurement: { height: viewHeight },
    },
  }) as any;

describe("AjoraChatScrollView auto-scroll", () => {
  let renderer: ReturnType<typeof TestRenderer.create> | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    flashListRef.scrollToEnd.mockClear();
    flashListRef.scrollToOffset.mockClear();
    latestFlashListProps = null;
    global.requestAnimationFrame = ((cb: (time: number) => void) => {
      cb(0);
      return 0;
    }) as any;
  });

  afterEach(() => {
    if (renderer) {
      act(() => {
        renderer?.unmount();
      });
    }
    renderer = null;
    vi.useRealTimers();
  });

  it("keeps following streaming output while the user remains at bottom", () => {
    act(() => {
      renderer = TestRenderer.create(
        <AjoraChatScrollView
          isStreaming
          messages={[message("a1", "assistant", "hello")]}
        />,
      );
    });

    act(() => {
      latestFlashListProps.onLayout({ nativeEvent: { layout: { height: 500 } } });
      latestFlashListProps.onScroll(scrollEvent(500));
      vi.advanceTimersByTime(150);
      flashListRef.scrollToEnd.mockClear();
    });

    act(() => {
      renderer!.update(
        <AjoraChatScrollView
          isStreaming
          messages={[message("a1", "assistant", "hello world")]}
        />,
      );
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(flashListRef.scrollToEnd).toHaveBeenCalledWith({ animated: true });
  });

  it("does not snap back when the user scrolls up during a stream", () => {
    act(() => {
      renderer = TestRenderer.create(
        <AjoraChatScrollView
          isStreaming
          messages={[message("a1", "assistant", "hello")]}
        />,
      );
    });

    act(() => {
      latestFlashListProps.onLayout({ nativeEvent: { layout: { height: 500 } } });
      latestFlashListProps.onScroll(scrollEvent(500));
      vi.advanceTimersByTime(150);
      flashListRef.scrollToEnd.mockClear();
    });

    act(() => {
      renderer!.update(
        <AjoraChatScrollView
          isStreaming
          messages={[message("a1", "assistant", "hello world")]}
        />,
      );
    });

    act(() => {
      latestFlashListProps.onScroll(scrollEvent(480));
      vi.advanceTimersByTime(50);
    });

    expect(flashListRef.scrollToEnd).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(150);
      flashListRef.scrollToEnd.mockClear();
      renderer!.update(
        <AjoraChatScrollView
          isStreaming
          messages={[message("a1", "assistant", "hello world again")]}
        />,
      );
      vi.advanceTimersByTime(50);
    });

    expect(flashListRef.scrollToEnd).not.toHaveBeenCalled();
  });

  it("leaves FlashList bottom autoscroll disabled so user intent has one owner", () => {
    act(() => {
      renderer = TestRenderer.create(
        <AjoraChatScrollView messages={[message("a1", "assistant", "hello")]} />,
      );
    });

    expect(
      latestFlashListProps.maintainVisibleContentPosition
        .autoscrollToBottomThreshold,
    ).toBeUndefined();
  });
});
