/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, waitFor, cleanup, renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import type { ReactFrontendTool } from "../../types";
import type { ReactHumanInTheLoop } from "../../types";

// ---------------------------------------------------------------------------
// Mock AjoraCoreReact — vi.hoisted runs before vi.mock hoisting
// ---------------------------------------------------------------------------

const {
  MockAjoraCoreReact,
  mockSubscribe,
  getLastConstructorArgs,
  resetLastConstructorArgs,
} = vi.hoisted(() => {
  const _mockSubscribe = vi.fn(() => ({ unsubscribe: vi.fn() }));
  let _lastArgs: Record<string, unknown> | null = null;

  class _MockAjoraCoreReact {
    tools: unknown[] = [];
    renderToolCalls: unknown[] = [];

    constructor(config: Record<string, unknown>) {
      _lastArgs = config;
      this.tools = (config.tools as unknown[]) ?? [];
      this.renderToolCalls = (config.renderToolCalls as unknown[]) ?? [];
    }

    subscribe = _mockSubscribe;
    setRuntimeUrl = vi.fn();
    setRuntimeTransport = vi.fn();
    setHeaders = vi.fn();
    setProperties = vi.fn();
    setAgents__unsafe_dev_only = vi.fn();
    addTool = vi.fn();
    removeTool = vi.fn();
    getTool = vi.fn(() => undefined);
    setRenderToolCalls = vi.fn();
  }

  return {
    MockAjoraCoreReact: _MockAjoraCoreReact,
    mockSubscribe: _mockSubscribe,
    getLastConstructorArgs: () => _lastArgs,
    resetLastConstructorArgs: () => { _lastArgs = null; },
  };
});

vi.mock("../../lib/react-core", () => ({
  AjoraCoreReact: MockAjoraCoreReact,
}));

vi.mock("@ag-ui/client", () => ({
  AbstractAgent: class {},
}));

import { AjoraProvider, useAjora } from "../AjoraProvider";

describe("AjoraProvider", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    resetLastConstructorArgs();
  });

  afterEach(() => {
    cleanup();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe("Basic functionality", () => {
    it("provides context to children", () => {
      const { result } = renderHook(() => useAjora(), {
        wrapper: ({ children }) => (
          <AjoraProvider runtimeUrl='http://localhost:3000'>
            {children}
          </AjoraProvider>
        ),
      });

      expect(result.current).toBeDefined();
      expect(result.current.ajora).toBeDefined();
      expect(result.current.ajora).toBeInstanceOf(MockAjoraCoreReact);
    });

    it("throws when useAjora is used outside provider", () => {
      // The context default has `ajora: null!`, so the hook errors when it
      // tries to call methods on the null core instance.
      consoleErrorSpy.mockRestore();
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAjora());
      }).toThrow();

      errorSpy.mockRestore();
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("provides an empty executingToolCallIds set", () => {
      const { result } = renderHook(() => useAjora(), {
        wrapper: ({ children }) => (
          <AjoraProvider runtimeUrl='http://localhost:3000'>
            {children}
          </AjoraProvider>
        ),
      });

      expect(result.current.executingToolCallIds).toBeDefined();
      expect(result.current.executingToolCallIds.size).toBe(0);
    });
  });

  describe("Validation", () => {
    it("warns when neither runtimeUrl nor agents__unsafe_dev_only is provided", () => {
      render(
        <AjoraProvider>
          <span />
        </AjoraProvider>
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Missing required prop: 'runtimeUrl' or 'agents__unsafe_dev_only'"
      );
    });

    it("does not warn when runtimeUrl is provided", () => {
      render(
        <AjoraProvider runtimeUrl='http://localhost:3000'>
          <span />
        </AjoraProvider>
      );

      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("Missing required prop")
      );
    });

    it("does not warn when agents__unsafe_dev_only is provided", () => {
      const mockAgent = { agentId: "default" };

      render(
        <AjoraProvider
          agents__unsafe_dev_only={{ default: mockAgent as never }}
        >
          <span />
        </AjoraProvider>
      );

      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("Missing required prop")
      );
    });
  });

  describe("frontendTools prop", () => {
    it("passes frontend tools to AjoraCoreReact", () => {
      const frontendTools: ReactFrontendTool[] = [
        {
          name: "testTool",
          description: "A test tool",
          parameters: z.object({ input: z.string() }),
          handler: vi.fn(),
        },
      ];

      renderHook(() => useAjora(), {
        wrapper: ({ children }) => (
          <AjoraProvider
            runtimeUrl='http://localhost:3000'
            frontendTools={frontendTools}
          >
            {children}
          </AjoraProvider>
        ),
      });

      const args = getLastConstructorArgs();
      expect(args?.tools).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "testTool" }),
        ])
      );
    });

    it("includes render components from frontend tools", () => {
      const TestComponent: React.FC = () => null;
      const frontendTools: ReactFrontendTool[] = [
        {
          name: "renderTool",
          description: "A tool with render",
          parameters: z.object({ input: z.string() }),
          render: TestComponent,
        },
      ];

      renderHook(() => useAjora(), {
        wrapper: ({ children }) => (
          <AjoraProvider
            runtimeUrl='http://localhost:3000'
            frontendTools={frontendTools}
          >
            {children}
          </AjoraProvider>
        ),
      });

      const args = getLastConstructorArgs();
      const renderToolCalls = args?.renderToolCalls as Array<{ name: string; render: unknown }>;
      const match = renderToolCalls.find(rc => rc.name === "renderTool");
      expect(match).toBeDefined();
      expect(match?.render).toBe(TestComponent);
    });

    it("warns when frontendTools prop changes", async () => {
      const initialTools: ReactFrontendTool[] = [
        { name: "tool1", description: "Tool 1" },
      ];

      const { rerender } = render(
        <AjoraProvider
          runtimeUrl='http://localhost:3000'
          frontendTools={initialTools}
        >
          <span />
        </AjoraProvider>
      );

      const newTools: ReactFrontendTool[] = [
        { name: "tool2", description: "Tool 2" },
      ];

      rerender(
        <AjoraProvider
          runtimeUrl='http://localhost:3000'
          frontendTools={newTools}
        >
          <span />
        </AjoraProvider>
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining("frontendTools must be a stable array")
        );
      });
    });
  });

  describe("humanInTheLoop prop", () => {
    it("processes humanInTheLoop tools into frontend tools", () => {
      const TestComponent: React.FC = () => null;
      const humanInTheLoopTools: ReactHumanInTheLoop[] = [
        {
          name: "approvalTool",
          description: "Requires human approval",
          parameters: z.object({ question: z.string() }),
          render: TestComponent,
        },
      ];

      renderHook(() => useAjora(), {
        wrapper: ({ children }) => (
          <AjoraProvider
            runtimeUrl='http://localhost:3000'
            humanInTheLoop={humanInTheLoopTools}
          >
            {children}
          </AjoraProvider>
        ),
      });

      const args = getLastConstructorArgs();
      const tools = args?.tools as Array<{ name: string; handler?: unknown }>;
      const tool = tools.find(t => t.name === "approvalTool");
      expect(tool).toBeDefined();
      expect(tool?.handler).toBeDefined();

      const renderToolCalls = args?.renderToolCalls as Array<{ name: string; render: unknown }>;
      const match = renderToolCalls.find(rc => rc.name === "approvalTool");
      expect(match).toBeDefined();
      expect(match?.render).toBe(TestComponent);
    });

    it("creates placeholder handlers that warn on invocation", async () => {
      const TestComponent: React.FC = () => null;
      const humanInTheLoopTools: ReactHumanInTheLoop[] = [
        {
          name: "interactiveTool",
          description: "Interactive tool",
          parameters: z.object({ data: z.string() }),
          render: TestComponent,
        },
      ];

      renderHook(() => useAjora(), {
        wrapper: ({ children }) => (
          <AjoraProvider
            runtimeUrl='http://localhost:3000'
            humanInTheLoop={humanInTheLoopTools}
          >
            {children}
          </AjoraProvider>
        ),
      });

      const args = getLastConstructorArgs();
      const tools = args?.tools as Array<{ name: string; handler: (a: unknown) => Promise<unknown> }>;
      const tool = tools.find(t => t.name === "interactiveTool");

      await tool!.handler({ data: "test" });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Human-in-the-loop tool 'interactiveTool' called"
        )
      );
    });

    it("warns when humanInTheLoop prop changes", async () => {
      const TestComponent: React.FC = () => null;
      const initialTools: ReactHumanInTheLoop[] = [
        { name: "tool1", description: "Tool 1", render: TestComponent },
      ];

      const { rerender } = render(
        <AjoraProvider
          runtimeUrl='http://localhost:3000'
          humanInTheLoop={initialTools}
        >
          <span />
        </AjoraProvider>
      );

      const newTools: ReactHumanInTheLoop[] = [
        { name: "tool2", description: "Tool 2", render: TestComponent },
      ];

      rerender(
        <AjoraProvider
          runtimeUrl='http://localhost:3000'
          humanInTheLoop={newTools}
        >
          <span />
        </AjoraProvider>
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining("humanInTheLoop must be a stable array")
        );
      });
    });
  });

  describe("Combined tools functionality", () => {
    it("registers both frontendTools and humanInTheLoop tools", () => {
      const TestComponent: React.FC = () => null;
      const frontendTools: ReactFrontendTool[] = [
        { name: "frontendTool", description: "Frontend tool", handler: vi.fn() },
      ];
      const humanInTheLoopTools: ReactHumanInTheLoop[] = [
        { name: "humanTool", description: "Human tool", render: TestComponent },
      ];

      renderHook(() => useAjora(), {
        wrapper: ({ children }) => (
          <AjoraProvider
            runtimeUrl='http://localhost:3000'
            frontendTools={frontendTools}
            humanInTheLoop={humanInTheLoopTools}
          >
            {children}
          </AjoraProvider>
        ),
      });

      const args = getLastConstructorArgs();
      const tools = args?.tools as Array<{ name: string }>;
      expect(tools.find(t => t.name === "frontendTool")).toBeDefined();
      expect(tools.find(t => t.name === "humanTool")).toBeDefined();
    });
  });

  describe("Edge cases", () => {
    it("handles empty arrays for tools", () => {
      renderHook(() => useAjora(), {
        wrapper: ({ children }) => (
          <AjoraProvider
            runtimeUrl='http://localhost:3000'
            frontendTools={[]}
            humanInTheLoop={[]}
          >
            {children}
          </AjoraProvider>
        ),
      });

      const args = getLastConstructorArgs();
      expect(args?.tools).toHaveLength(0);
      expect(args?.renderToolCalls).toHaveLength(0);
    });

    it("handles tools without render components", () => {
      const frontendTools: ReactFrontendTool[] = [
        { name: "noRenderTool", description: "Tool without render", handler: vi.fn() },
      ];

      renderHook(() => useAjora(), {
        wrapper: ({ children }) => (
          <AjoraProvider
            runtimeUrl='http://localhost:3000'
            frontendTools={frontendTools}
          >
            {children}
          </AjoraProvider>
        ),
      });

      const args = getLastConstructorArgs();
      const tools = args?.tools as Array<{ name: string }>;
      expect(tools.find(t => t.name === "noRenderTool")).toBeDefined();

      const renderToolCalls = args?.renderToolCalls as Array<{ name: string }>;
      expect(renderToolCalls.find(rc => rc.name === "noRenderTool")).toBeUndefined();
    });

    it("passes runtimeUrl to AjoraCoreReact", () => {
      renderHook(() => useAjora(), {
        wrapper: ({ children }) => (
          <AjoraProvider runtimeUrl='http://my-runtime.com/api'>
            {children}
          </AjoraProvider>
        ),
      });

      expect(getLastConstructorArgs()?.runtimeUrl).toBe(
        "http://my-runtime.com/api"
      );
    });

    it("passes useSingleEndpoint as transport type", () => {
      renderHook(() => useAjora(), {
        wrapper: ({ children }) => (
          <AjoraProvider runtimeUrl='http://localhost:3000' useSingleEndpoint>
            {children}
          </AjoraProvider>
        ),
      });

      expect(getLastConstructorArgs()?.runtimeTransport).toBe("single");
    });

    it("defaults transport to rest", () => {
      renderHook(() => useAjora(), {
        wrapper: ({ children }) => (
          <AjoraProvider runtimeUrl='http://localhost:3000'>
            {children}
          </AjoraProvider>
        ),
      });

      expect(getLastConstructorArgs()?.runtimeTransport).toBe("rest");
    });

    it("passes custom headers", () => {
      const headers = { Authorization: "Bearer token123" };

      renderHook(() => useAjora(), {
        wrapper: ({ children }) => (
          <AjoraProvider runtimeUrl='http://localhost:3000' headers={headers}>
            {children}
          </AjoraProvider>
        ),
      });

      expect(getLastConstructorArgs()?.headers).toBe(headers);
    });

    it("passes custom properties", () => {
      const properties = { userId: "abc", feature: true };

      renderHook(() => useAjora(), {
        wrapper: ({ children }) => (
          <AjoraProvider
            runtimeUrl='http://localhost:3000'
            properties={properties}
          >
            {children}
          </AjoraProvider>
        ),
      });

      expect(getLastConstructorArgs()?.properties).toBe(properties);
    });
  });

  describe("Config sync", () => {
    it("subscribes to core on mount and unsubscribes on unmount", () => {
      const unsubscribe = vi.fn();
      mockSubscribe.mockReturnValue({ unsubscribe });

      const { unmount } = render(
        <AjoraProvider runtimeUrl='http://localhost:3000'>
          <span />
        </AjoraProvider>
      );

      expect(mockSubscribe).toHaveBeenCalled();

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
