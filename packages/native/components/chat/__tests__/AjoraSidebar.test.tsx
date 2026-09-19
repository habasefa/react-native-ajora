/**
 * @vitest-environment node
 */
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let lastChatProps: Record<string, unknown> = {};

vi.mock("../AjoraChat", () => ({
  AjoraChat: (props: any) => {
    lastChatProps = props;
    return null;
  },
}));

vi.mock("../AjoraChatView", () => ({
  default: function AjoraChatViewStub() {
    return null;
  },
}));

vi.mock("../AjoraSidebarView", () => ({
  AjoraSidebarView: () => null,
}));

import { AjoraSidebar } from "../AjoraSidebar";

describe("AjoraSidebar collapsed default", () => {
  afterEach(() => {
    lastChatProps = {};
  });

  it("defaults to collapsed when `defaultOpen` is omitted", () => {
    // The configuration provider falls back to `true` when
    // `isModalDefaultOpen` is `undefined`, which hides the collapsed bar
    // while the sheet is still closed at index -1 — the host screen renders
    // nothing at all. A sidebar's resting state is the bar, so the default
    // has to be an explicit `false`.
    act(() => {
      TestRenderer.create(<AjoraSidebar threadId="thread-1" />);
    });

    expect(lastChatProps.isModalDefaultOpen).toBe(false);
  });

  it("opens on mount when `defaultOpen` is set", () => {
    act(() => {
      TestRenderer.create(<AjoraSidebar threadId="thread-1" defaultOpen />);
    });

    expect(lastChatProps.isModalDefaultOpen).toBe(true);
  });
});
