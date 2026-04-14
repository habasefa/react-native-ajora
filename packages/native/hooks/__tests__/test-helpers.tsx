/**
 * Test helpers for native hook tests.
 *
 * Provides a lightweight renderWithAjora wrapper that creates a real
 * AjoraCoreReact instance and injects it via context, avoiding heavy
 * React Native provider setup.
 */
import React, { ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { AjoraCoreReact } from "../../lib/react-core";
import { AjoraContextValue } from "../../providers/AjoraProvider";
import { AjoraCoreRuntimeConnectionStatus } from "../../../core";
import { AbstractAgent } from "@ag-ui/client";

// Re-export the mock agent from core tests for reuse
export { MockAgent } from "../../../core/__tests__/test-utils";

/**
 * Minimal AjoraContext reproduction for testing hooks outside of
 * AjoraProvider (which pulls in React Native modules we can't load in jsdom).
 */
const AjoraContext = React.createContext<AjoraContextValue>({
  ajora: null!,
  executingToolCallIds: new Set(),
  runtimeConnectionStatus: AjoraCoreRuntimeConnectionStatus.Disconnected,
});

/** Re-export so hooks can resolve via the same reference. */
export { AjoraContext };

interface RenderWithAjoraOptions {
  agents?: Record<string, AbstractAgent>;
  runtimeUrl?: string;
  executingToolCallIds?: ReadonlySet<string>;
  renderOptions?: Omit<RenderOptions, "wrapper">;
}

/**
 * Creates a real AjoraCoreReact and wraps children with a context provider.
 */
export function renderWithAjora(
  ui: React.ReactElement,
  options: RenderWithAjoraOptions = {},
) {
  const ajora = new AjoraCoreReact({
    runtimeUrl: options.runtimeUrl,
    agents__unsafe_dev_only: options.agents ?? {},
  });

  const executingToolCallIds = options.executingToolCallIds ?? new Set<string>();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AjoraContext.Provider
        value={{
          ajora,
          executingToolCallIds,
          runtimeConnectionStatus: ajora.runtimeConnectionStatus,
        }}
      >
        {children}
      </AjoraContext.Provider>
    );
  }

  const result = render(ui, { wrapper: Wrapper, ...options.renderOptions });
  return { ...result, ajora };
}
