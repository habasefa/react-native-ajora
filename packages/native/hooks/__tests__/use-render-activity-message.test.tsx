/**
 * @vitest-environment jsdom
 */
import React from "react";
import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { useRenderActivityMessage } from "../use-render-activity-message";
import { useAjora } from "../../providers/AjoraProvider";
import { useAjoraChatConfiguration } from "../../providers/AjoraChatConfigurationProvider";

vi.mock("../../providers/AjoraProvider", () => ({
  useAjora: vi.fn(),
}));

vi.mock("../../providers/AjoraChatConfigurationProvider", () => ({
  useAjoraChatConfiguration: vi.fn(),
}));

const mockUseAjora = useAjora as ReturnType<typeof vi.fn>;
const mockUseConfig = useAjoraChatConfiguration as ReturnType<typeof vi.fn>;

describe("useRenderActivityMessage", () => {
  let renderActivityMessagesRef: any[];

  beforeEach(() => {
    renderActivityMessagesRef = [];

    mockUseAjora.mockReturnValue({
      ajora: {
        renderActivityMessages: renderActivityMessagesRef,
        getAgent: vi.fn(() => ({ agentId: "default" })),
      },
    });

    mockUseConfig.mockReturnValue({
      agentId: "default",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("findRenderer", () => {
    it("returns null when no renderers registered", () => {
      const { result } = renderHook(() => useRenderActivityMessage());
      expect(result.current.findRenderer("some-type")).toBeNull();
    });

    it("finds renderer by exact activityType match", () => {
      const renderer = {
        activityType: "progress",
        content: z.object({ percent: z.number() }),
        render: () => null,
      };
      renderActivityMessagesRef.push(renderer);

      const { result } = renderHook(() => useRenderActivityMessage());
      expect(result.current.findRenderer("progress")).toBe(renderer);
    });

    it("returns null for unmatched activityType", () => {
      renderActivityMessagesRef.push({
        activityType: "progress",
        content: z.any(),
        render: () => null,
      });

      const { result } = renderHook(() => useRenderActivityMessage());
      expect(result.current.findRenderer("unknown")).toBeNull();
    });

    it("prefers agent-specific renderer over global", () => {
      const globalRenderer = {
        activityType: "status",
        content: z.any(),
        render: () => null,
      };
      const agentRenderer = {
        activityType: "status",
        agentId: "default",
        content: z.any(),
        render: () => null,
      };
      renderActivityMessagesRef.push(globalRenderer, agentRenderer);

      const { result } = renderHook(() => useRenderActivityMessage());
      expect(result.current.findRenderer("status")).toBe(agentRenderer);
    });

    it("falls back to wildcard renderer", () => {
      const wildcardRenderer = {
        activityType: "*",
        content: z.any(),
        render: () => null,
      };
      renderActivityMessagesRef.push(wildcardRenderer);

      const { result } = renderHook(() => useRenderActivityMessage());
      expect(result.current.findRenderer("anything")).toBe(wildcardRenderer);
    });

    it("prefers exact match over wildcard", () => {
      const exactRenderer = {
        activityType: "progress",
        content: z.any(),
        render: () => null,
      };
      const wildcardRenderer = {
        activityType: "*",
        content: z.any(),
        render: () => null,
      };
      renderActivityMessagesRef.push(wildcardRenderer, exactRenderer);

      const { result } = renderHook(() => useRenderActivityMessage());
      expect(result.current.findRenderer("progress")).toBe(exactRenderer);
    });
  });

  describe("renderActivityMessage", () => {
    it("returns null when no renderer matches", () => {
      const { result } = renderHook(() => useRenderActivityMessage());

      const message = {
        id: "msg-1",
        activityType: "unknown",
        content: {},
        role: "activity" as const,
      };

      expect(result.current.renderActivityMessage(message as any)).toBeNull();
    });

    it("returns null when content fails schema validation", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      renderActivityMessagesRef.push({
        activityType: "progress",
        content: z.object({ percent: z.number() }),
        render: () => <span>ok</span>,
      });

      const { result } = renderHook(() => useRenderActivityMessage());

      const message = {
        id: "msg-1",
        activityType: "progress",
        content: { percent: "not-a-number" },
        role: "activity" as const,
      };

      expect(result.current.renderActivityMessage(message as any)).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to parse content"),
        expect.anything()
      );

      warnSpy.mockRestore();
    });

    it("renders component with parsed content when schema matches", () => {
      const RenderComponent = vi.fn(({ content }: any) => (
        <span>{content.percent}%</span>
      ));

      renderActivityMessagesRef.push({
        activityType: "progress",
        content: z.object({ percent: z.number() }),
        render: RenderComponent,
      });

      const { result } = renderHook(() => useRenderActivityMessage());

      const message = {
        id: "msg-1",
        activityType: "progress",
        content: { percent: 75 },
        role: "activity" as const,
      };

      const rendered = result.current.renderActivityMessage(message as any);
      expect(rendered).not.toBeNull();
      expect(rendered!.type).toBe(RenderComponent);
      expect(rendered!.props).toEqual(
        expect.objectContaining({
          activityType: "progress",
          content: { percent: 75 },
          message,
        })
      );
    });
  });
});
