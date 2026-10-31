/**
 * Single acquisition point for the optional `expo-haptics` native module.
 *
 * `expo-haptics` is an optional peer: the library must degrade silently when
 * a consumer hasn't installed it, so it can't be a static `import`. Funnelling
 * the guarded `require` through this one module (instead of an inline
 * try/catch at each call site) gives a clean, mockable seam — tests
 * `vi.mock` this module rather than the unresolvable `expo-haptics`
 * specifier — without changing runtime behaviour.
 */
export interface OptionalHaptics {
  impactAsync?: (style: string) => Promise<void>;
  notificationAsync?: (type: string) => Promise<void>;
  ImpactFeedbackStyle?: { Light: string; Medium: string; Heavy: string };
  NotificationFeedbackType?: {
    Success: string;
    Warning: string;
    Error: string;
  };
}

let resolved: OptionalHaptics = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  resolved = require("expo-haptics");
} catch {
  // expo-haptics not installed — haptics are optional, stay silent.
}

/** The resolved module, or `{}` when expo-haptics is unavailable. */
export const haptics: OptionalHaptics = resolved;
