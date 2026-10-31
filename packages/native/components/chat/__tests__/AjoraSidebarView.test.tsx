/**
 * @vitest-environment node
 */
import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let modalOpen = false;
let lastSheetProps: Record<string, unknown> = {};

vi.mock("react-native", () => ({
  View: ({ children, ...props }: any) =>
    React.createElement("div", props, children),
  Text: ({ children, ...props }: any) =>
    React.createElement("span", props, children),
  Pressable: ({ children, onPress, ...props }: any) =>
    React.createElement("button", { ...props, onClick: onPress }, children),
  StyleSheet: {
    absoluteFill: { position: "absolute" },
    create: (styles: Record<string, unknown>) => styles,
  },
}));

vi.mock("@gorhom/bottom-sheet", () => ({
  default: React.forwardRef(({ children, ...props }: any, _ref: any) => {
    lastSheetProps = props;
    return React.createElement("section", null, children);
  }),
  BottomSheetBackdrop: () => null,
  useBottomSheetScrollableCreator: () => () => null,
}));

vi.mock("@react-native-vector-icons/ionicons/static", () => ({
  default: () => null,
}));

vi.mock("../AjoraChatView", () => ({
  default: () => null,
}));

vi.mock("../AjoraModalHeader", () => ({
  AjoraModalHeader: () => null,
}));

vi.mock("../../../lib/slots", () => ({
  renderSlot: (
    _slot: unknown,
    Fallback: React.ComponentType<any>,
    props: any,
  ) => React.createElement(Fallback, props),
}));

vi.mock("../../../providers/AjoraChatConfigurationProvider", () => ({
  useAjoraChatConfiguration: () => ({
    isModalOpen: modalOpen,
    setModalOpen: vi.fn(),
  }),
}));

vi.mock("../../../providers/AjoraThemeProvider", () => ({
  useAjoraTheme: () => ({
    colors: {
      border: "#ddd",
      inputBackground: "#fff",
      placeholder: "#777",
      primary: "#fc0",
      surface: "#fff",
    },
  }),
}));

import { AjoraSidebarView } from "../AjoraSidebarView";

describe("AjoraSidebarView host interaction", () => {
  let renderer: ReactTestRenderer | null = null;

  const getHitAreaProps = () => {
    const tree = renderer?.toJSON();
    const serialized = Array.isArray(tree) ? tree : [tree];
    const pending = serialized.filter(Boolean);

    while (pending.length > 0) {
      const node = pending.shift();
      if (typeof node === "string" || !node) continue;
      if (node.props.testID === "ajora-sidebar-sheet-hit-area") {
        return node.props;
      }
      pending.push(...(node.children ?? []).filter(Boolean));
    }

    throw new Error("Ajora sidebar hit area was not rendered");
  };

  afterEach(() => {
    if (renderer) {
      act(() => renderer?.unmount());
    }
    renderer = null;
    modalOpen = false;
    lastSheetProps = {};
  });

  it("does not intercept the host screen while the sidebar is collapsed", () => {
    act(() => {
      renderer = TestRenderer.create(<AjoraSidebarView messages={[]} />);
    });

    const closedProps = getHitAreaProps();
    expect(closedProps.pointerEvents).toBe("none");
    expect(closedProps.accessibilityElementsHidden).toBe(true);
    expect(closedProps.importantForAccessibility).toBe("no-hide-descendants");
    expect(closedProps.style).toContainEqual({ opacity: 0 });

    modalOpen = true;
    act(() => {
      renderer!.update(<AjoraSidebarView messages={[]} />);
    });

    const openProps = getHitAreaProps();
    expect(openProps.pointerEvents).toBe("auto");
    expect(openProps.accessibilityElementsHidden).toBe(false);
    expect(openProps.importantForAccessibility).toBe("auto");
  });

  it("drives the sheet from `isModalOpen` so it can mount already open", () => {
    // The imperative path (`snapToIndex` in the `isOpen` effect) is a no-op on
    // the first render: @gorhom/bottom-sheet early-exits while the container
    // has not measured itself, which left a sidebar mounted open with no sheet
    // and no collapsed bar — an empty screen. The reactive `index` prop is the
    // library's supported mount-open path, so it has to track `isModalOpen`.
    act(() => {
      renderer = TestRenderer.create(<AjoraSidebarView messages={[]} />);
    });
    expect(lastSheetProps.index).toBe(-1);

    modalOpen = true;
    act(() => {
      renderer!.update(<AjoraSidebarView messages={[]} />);
    });
    expect(lastSheetProps.index).toBe(0);

    modalOpen = false;
    act(() => {
      renderer!.update(<AjoraSidebarView messages={[]} />);
    });
    expect(lastSheetProps.index).toBe(-1);
  });

  it("mounts the sheet open when the sidebar starts open", () => {
    modalOpen = true;
    act(() => {
      renderer = TestRenderer.create(<AjoraSidebarView messages={[]} />);
    });

    expect(lastSheetProps.index).toBe(0);
    expect(getHitAreaProps().pointerEvents).toBe("auto");
  });
});
