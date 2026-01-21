// @ts-nocheck
import * as React from "react";
import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Animated,
  Easing,
} from "react-native";
import { renderSlot, WithSlots } from "../../lib/slots";
import {
  useAjoraChatConfiguration,
  AjoraChatDefaultLabels,
} from "../../providers/AjoraChatConfigurationProvider";
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";

// ============================================================================
// Types
// ============================================================================

/**
 * Theme configuration for the loading state
 */
export interface AjoraChatLoadingStateTheme {
  /** Background color */
  backgroundColor?: string;
  /** Spinner/dot color */
  spinnerColor?: string;
  /** Text color */
  textColor?: string;
  /** Dot size */
  dotSize?: number;
}

/**
 * Default light theme - uses consistent project colors
 * @deprecated Use useAjoraTheme() instead
 */
export const DEFAULT_LOADING_STATE_LIGHT_THEME: AjoraChatLoadingStateTheme = {
  backgroundColor: "transparent",
  spinnerColor: "#3B82F6", // primary
  textColor: "#6B7280", // textSecondary
  dotSize: 8,
};

/**
 * Default dark theme - uses consistent project colors
 * @deprecated Use useAjoraTheme() instead
 */
export const DEFAULT_LOADING_STATE_DARK_THEME: AjoraChatLoadingStateTheme = {
  backgroundColor: "transparent",
  spinnerColor: "#60A5FA", // primary dark
  textColor: "#9CA3AF", // textSecondary
  dotSize: 8,
};

// ============================================================================
// Loading State Types
// ============================================================================

export type AjoraChatLoadingStateType =
  | "connecting"
  | "loading"
  | "thinking"
  | "reconnecting";

// ============================================================================
// Sub-component Types
// ============================================================================

export interface AjoraChatLoadingStateDotsProps {
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export interface AjoraChatLoadingStateTextProps {
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

// ============================================================================
// Slot Types
// ============================================================================

type LoadingStateSlots = {
  dots: typeof AjoraChatLoadingState.Dots;
  text: typeof AjoraChatLoadingState.Text;
};

type LoadingStateRestProps = {
  /** Type of loading state */
  type?: AjoraChatLoadingStateType;
  /** Custom loading text */
  text?: string;
  /** Whether to show the loading text */
  showText?: boolean;
  /** Theme configuration */
  theme?: AjoraChatLoadingStateTheme;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Layout direction */
  layout?: "horizontal" | "vertical";
};

export type AjoraChatLoadingStateProps = WithSlots<
  LoadingStateSlots,
  LoadingStateRestProps
>;

// ============================================================================
// Animated Dots Component
// ============================================================================

function AnimatedDots({
  color = "#6B7280",
  size = 8,
  style,
}: AjoraChatLoadingStateDotsProps) {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createDotAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const animations = [
      createDotAnimation(dot1Anim, 0),
      createDotAnimation(dot2Anim, 150),
      createDotAnimation(dot3Anim, 300),
    ];

    animations.forEach((anim) => anim.start());

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [dot1Anim, dot2Anim, dot3Anim]);

  const dotStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    marginHorizontal: size / 4,
  };

  return (
    <View style={[styles.dotsContainer, style]}>
      <Animated.View
        style={[
          dotStyle,
          {
            opacity: dot1Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
            transform: [
              {
                scale: dot1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          dotStyle,
          {
            opacity: dot2Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
            transform: [
              {
                scale: dot2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          dotStyle,
          {
            opacity: dot3Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
            transform: [
              {
                scale: dot3Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AjoraChatLoadingState({
  type = "connecting",
  text,
  showText = true,
  theme: customTheme,
  style,
  layout = "vertical",
  dots,
  text: textSlot,
  children,
  ...rest
}: AjoraChatLoadingStateProps) {
  const configuration = useAjoraChatConfiguration();
  const globalTheme = useAjoraTheme();

  const theme: AjoraChatLoadingStateTheme = React.useMemo(
    () => ({
      backgroundColor: customTheme?.backgroundColor ?? "transparent",
      spinnerColor: customTheme?.spinnerColor ?? globalTheme.colors.primary,
      textColor: customTheme?.textColor ?? globalTheme.colors.textSecondary,
      dotSize: customTheme?.dotSize ?? 8,
    }),
    [customTheme, globalTheme],
  );

  // Resolve loading text based on type
  const getDefaultText = (): string => {
    switch (type) {
      case "connecting":
        return (
          configuration?.labels.chatLoadingConnecting ??
          AjoraChatDefaultLabels.chatLoadingConnecting ??
          "Connecting..."
        );
      case "loading":
        return (
          configuration?.labels.chatLoadingMessages ??
          AjoraChatDefaultLabels.chatLoadingMessages ??
          "Loading messages..."
        );
      case "thinking":
        return (
          configuration?.labels.chatLoadingThinking ??
          AjoraChatDefaultLabels.chatLoadingThinking ??
          "Thinking..."
        );
      case "reconnecting":
        return (
          configuration?.labels.chatLoadingReconnecting ??
          AjoraChatDefaultLabels.chatLoadingReconnecting ??
          "Reconnecting..."
        );
      default:
        return "Loading...";
    }
  };

  const resolvedText = text ?? getDefaultText();

  // Render slots
  const BoundDots = renderSlot(dots, AjoraChatLoadingState.Dots, {
    color: theme.spinnerColor,
    size: theme.dotSize,
  });

  const BoundText =
    showText && resolvedText
      ? renderSlot(textSlot, AjoraChatLoadingState.Text, {
          children: resolvedText,
          style: { color: theme.textColor },
        })
      : null;

  // Render function children pattern
  if (children) {
    return (
      <React.Fragment>
        {children({
          dots: BoundDots,
          text: BoundText ?? <></>,
          ...rest,
        })}
      </React.Fragment>
    );
  }

  const containerStyle = [
    styles.container,
    layout === "horizontal" && styles.containerHorizontal,
    { backgroundColor: theme.backgroundColor },
    style,
  ];

  return (
    <View
      style={containerStyle}
      accessibilityRole="progressbar"
      accessibilityLabel={resolvedText}
      {...rest}
    >
      {BoundDots}
      {BoundText}
    </View>
  );
}

// ============================================================================
// Namespace Sub-components
// ============================================================================

export namespace AjoraChatLoadingState {
  export const Dots: React.FC<AjoraChatLoadingStateDotsProps> = AnimatedDots;

  export const Text: React.FC<AjoraChatLoadingStateTextProps> = ({
    children,
    style,
  }) => <Text style={[styles.text, style]}>{children}</Text>;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  containerHorizontal: {
    flexDirection: "row",
    paddingVertical: 16,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default AjoraChatLoadingState;
