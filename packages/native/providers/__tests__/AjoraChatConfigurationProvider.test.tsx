/**
 * @vitest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  AjoraChatConfigurationProvider,
  AjoraChatDefaultLabels,
  useAjoraChatConfiguration,
} from "../AjoraChatConfigurationProvider";
import { DEFAULT_AGENT_ID } from "../../../shared";
import { DEFAULT_MODEL_ID } from "../../../shared/constants";

vi.mock("../../../shared", async importOriginal => {
  const actual = await importOriginal<typeof import("../../../shared")>();
  return {
    ...actual,
    randomUUID: () => "mock-uuid-1234",
  };
});

describe("AjoraChatConfigurationProvider", () => {
  describe("Basic functionality", () => {
    it("should provide default configuration", () => {
      const { result } = renderHook(() => useAjoraChatConfiguration(), {
        wrapper: ({ children }) => (
          <AjoraChatConfigurationProvider threadId='test-thread'>
            {children}
          </AjoraChatConfigurationProvider>
        ),
      });

      expect(result.current?.agentId).toBe(DEFAULT_AGENT_ID);
      expect(result.current?.threadId).toBe("test-thread");
      expect(result.current?.modelId).toBe(DEFAULT_MODEL_ID);
      expect(result.current?.labels.chatInputPlaceholder).toBe(
        AjoraChatDefaultLabels.chatInputPlaceholder
      );
    });

    it("should accept custom agentId", () => {
      const { result } = renderHook(() => useAjoraChatConfiguration(), {
        wrapper: ({ children }) => (
          <AjoraChatConfigurationProvider
            threadId='test-thread'
            agentId='custom-agent'
          >
            {children}
          </AjoraChatConfigurationProvider>
        ),
      });

      expect(result.current?.agentId).toBe("custom-agent");
    });

    it("should accept custom modelId", () => {
      const { result } = renderHook(() => useAjoraChatConfiguration(), {
        wrapper: ({ children }) => (
          <AjoraChatConfigurationProvider
            threadId='test-thread'
            modelId='gpt-4o'
          >
            {children}
          </AjoraChatConfigurationProvider>
        ),
      });

      expect(result.current?.modelId).toBe("gpt-4o");
    });

    it("should generate a threadId when none provided", () => {
      const { result } = renderHook(() => useAjoraChatConfiguration(), {
        wrapper: ({ children }) => (
          <AjoraChatConfigurationProvider>
            {children}
          </AjoraChatConfigurationProvider>
        ),
      });

      expect(result.current?.threadId).toBe("mock-uuid-1234");
    });

    it("should merge custom labels with defaults", () => {
      const { result } = renderHook(() => useAjoraChatConfiguration(), {
        wrapper: ({ children }) => (
          <AjoraChatConfigurationProvider
            threadId='test-thread'
            labels={{ chatInputPlaceholder: "Custom placeholder" }}
          >
            {children}
          </AjoraChatConfigurationProvider>
        ),
      });

      expect(result.current?.labels.chatInputPlaceholder).toBe(
        "Custom placeholder"
      );
      expect(
        result.current?.labels.assistantMessageToolbarCopyMessageLabel
      ).toBe(
        AjoraChatDefaultLabels.assistantMessageToolbarCopyMessageLabel
      );
    });
  });

  describe("Hook behavior", () => {
    it("should return null when no provider exists", () => {
      const { result } = renderHook(() => useAjoraChatConfiguration());

      expect(result.current).toBeNull();
    });
  });

  describe("Modal state", () => {
    it("should default isModalOpen to true", () => {
      const { result } = renderHook(() => useAjoraChatConfiguration(), {
        wrapper: ({ children }) => (
          <AjoraChatConfigurationProvider threadId='test-thread'>
            {children}
          </AjoraChatConfigurationProvider>
        ),
      });

      expect(result.current?.isModalOpen).toBe(true);
    });

    it("should respect isModalDefaultOpen=false", () => {
      const { result } = renderHook(() => useAjoraChatConfiguration(), {
        wrapper: ({ children }) => (
          <AjoraChatConfigurationProvider
            threadId='test-thread'
            isModalDefaultOpen={false}
          >
            {children}
          </AjoraChatConfigurationProvider>
        ),
      });

      expect(result.current?.isModalOpen).toBe(false);
    });

    it("should toggle modal state via setModalOpen", () => {
      const { result } = renderHook(() => useAjoraChatConfiguration(), {
        wrapper: ({ children }) => (
          <AjoraChatConfigurationProvider threadId='test-thread'>
            {children}
          </AjoraChatConfigurationProvider>
        ),
      });

      expect(result.current?.isModalOpen).toBe(true);

      act(() => {
        result.current?.setModalOpen(false);
      });

      expect(result.current?.isModalOpen).toBe(false);
    });
  });

  describe("Nested providers", () => {
    it("should let innermost provider win", () => {
      const { result } = renderHook(() => useAjoraChatConfiguration(), {
        wrapper: ({ children }) => (
          <AjoraChatConfigurationProvider
            threadId='outer-thread'
            agentId='outer-agent'
            labels={{ chatInputPlaceholder: "Outer" }}
          >
            <AjoraChatConfigurationProvider
              threadId='middle-thread'
              agentId='middle-agent'
              labels={{ chatInputPlaceholder: "Middle" }}
            >
              <AjoraChatConfigurationProvider
                threadId='inner-thread'
                agentId='inner-agent'
                labels={{ chatInputPlaceholder: "Inner" }}
              >
                {children}
              </AjoraChatConfigurationProvider>
            </AjoraChatConfigurationProvider>
          </AjoraChatConfigurationProvider>
        ),
      });

      expect(result.current?.agentId).toBe("inner-agent");
      expect(result.current?.threadId).toBe("inner-thread");
      expect(result.current?.labels.chatInputPlaceholder).toBe("Inner");
    });

    it("should inherit from parent when child omits props", () => {
      const { result } = renderHook(() => useAjoraChatConfiguration(), {
        wrapper: ({ children }) => (
          <AjoraChatConfigurationProvider
            threadId='outer-thread'
            agentId='outer-agent'
            modelId='outer-model'
          >
            <AjoraChatConfigurationProvider>
              {children}
            </AjoraChatConfigurationProvider>
          </AjoraChatConfigurationProvider>
        ),
      });

      expect(result.current?.agentId).toBe("outer-agent");
      expect(result.current?.threadId).toBe("outer-thread");
      expect(result.current?.modelId).toBe("outer-model");
    });

    it("should merge labels across parent and child providers", () => {
      const { result } = renderHook(() => useAjoraChatConfiguration(), {
        wrapper: ({ children }) => (
          <AjoraChatConfigurationProvider
            threadId='outer-thread'
            labels={{
              chatInputPlaceholder: "Outer placeholder",
              assistantMessageToolbarCopyMessageLabel: "Outer copy",
            }}
          >
            <AjoraChatConfigurationProvider
              labels={{ chatInputPlaceholder: "Inner placeholder" }}
            >
              {children}
            </AjoraChatConfigurationProvider>
          </AjoraChatConfigurationProvider>
        ),
      });

      expect(result.current?.labels.chatInputPlaceholder).toBe(
        "Inner placeholder"
      );
      expect(
        result.current?.labels.assistantMessageToolbarCopyMessageLabel
      ).toBe("Outer copy");
    });

    it("should inherit parent modal state in nested child", () => {
      const { result } = renderHook(() => useAjoraChatConfiguration(), {
        wrapper: ({ children }) => (
          <AjoraChatConfigurationProvider
            threadId='outer'
            isModalDefaultOpen={false}
          >
            <AjoraChatConfigurationProvider threadId='inner'>
              {children}
            </AjoraChatConfigurationProvider>
          </AjoraChatConfigurationProvider>
        ),
      });

      expect(result.current?.isModalOpen).toBe(false);
    });
  });
});
