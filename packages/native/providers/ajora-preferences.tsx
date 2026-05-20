import React, { createContext, useContext, ReactNode } from "react";

/**
 * Client-side runtime preferences that influence on-device behaviour but are
 * never sent to the runtime/backend. Consumer-controlled and safe-by-default:
 * anything not opted into stays off.
 *
 * Deliberately kept in its own module with **no** heavy imports (no
 * react-native, no core). `useAjoraHaptics` reads preferences through here so
 * the many hook tests that `vi.mock("../../providers/AjoraProvider")` don't
 * clobber preference resolution — and so haptic call sites degrade to "off"
 * (rather than crash) when used outside a provider.
 */
export interface AjoraRuntimePreferences {
  /**
   * When `false` (the default) the library performs no haptic feedback at
   * all — not during streaming, not on toolbar/copy/feedback actions. Apps
   * must explicitly opt in (typically wired to a user setting).
   */
  hapticsEnabled: boolean;
}

/** Frozen so the stable default identity can't be mutated. */
export const DEFAULT_AJORA_PREFERENCES: AjoraRuntimePreferences = Object.freeze(
  {
    hapticsEnabled: false,
  },
);

// Default value is the safe default itself, so `useAjoraPreferences()` used
// without a provider resolves to "everything off" instead of throwing.
const AjoraPreferencesContext = createContext<AjoraRuntimePreferences>(
  DEFAULT_AJORA_PREFERENCES,
);

export const AjoraPreferencesProvider: React.FC<{
  value: AjoraRuntimePreferences;
  children: ReactNode;
}> = ({ value, children }) => (
  <AjoraPreferencesContext.Provider value={value}>
    {children}
  </AjoraPreferencesContext.Provider>
);

/** Resolved client-side preferences (always fully populated). */
export const useAjoraPreferences = (): AjoraRuntimePreferences =>
  useContext(AjoraPreferencesContext);
