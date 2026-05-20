import { useCallback, useRef } from "react";
import { useAjoraPreferences } from "../providers/ajora-preferences";
import { haptics as Haptics } from "../lib/optional-haptics";

// expo-haptics is itself a no-op on web, so no react-native Platform check is
// needed (and importing react-native here would break the node-env tests).

// Swallow rejections: expo-haptics rejects on platforms where the effect is
// unavailable (e.g. web, some emulators). A buzz failing must never surface.
const safe = (p: Promise<void> | undefined) => {
  p?.catch(() => {});
};

export interface AjoraHaptics {
  /** Light tap — streaming ticks, toolbar button presses, regenerate. */
  impactLight: () => void;
  /** Medium tap — discrete affirmative actions (thumbs up/down). */
  impactMedium: () => void;
  /** Success notification — e.g. copy succeeded. */
  notifySuccess: () => void;
  /** Error notification — e.g. copy failed. */
  notifyError: () => void;
}

/**
 * Single gate for every haptic in the library. Returns referentially-stable
 * callbacks that no-op unless the consumer opted in via
 * `<AjoraProvider preferences={{ hapticsEnabled }} />` (default is OFF — see
 * {@link DEFAULT_AJORA_PREFERENCES}) and `expo-haptics` is installed.
 *
 * The enabled flag is read through a ref so callbacks captured in long-lived
 * subscriptions (e.g. `useAgent`'s message subscription) always observe the
 * current preference without forcing a re-subscribe when it toggles.
 */
export function useAjoraHaptics(): AjoraHaptics {
  const { hapticsEnabled } = useAjoraPreferences();

  const enabledRef = useRef(hapticsEnabled);
  enabledRef.current = hapticsEnabled;

  const impactLight = useCallback(() => {
    if (!enabledRef.current || !Haptics.impactAsync || !Haptics.ImpactFeedbackStyle) {
      return;
    }
    safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  }, []);

  const impactMedium = useCallback(() => {
    if (!enabledRef.current || !Haptics.impactAsync || !Haptics.ImpactFeedbackStyle) {
      return;
    }
    safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  }, []);

  const notifySuccess = useCallback(() => {
    if (
      !enabledRef.current ||
      !Haptics.notificationAsync ||
      !Haptics.NotificationFeedbackType
    ) {
      return;
    }
    safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  }, []);

  const notifyError = useCallback(() => {
    if (
      !enabledRef.current ||
      !Haptics.notificationAsync ||
      !Haptics.NotificationFeedbackType
    ) {
      return;
    }
    safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  }, []);

  return { impactLight, impactMedium, notifySuccess, notifyError };
}
