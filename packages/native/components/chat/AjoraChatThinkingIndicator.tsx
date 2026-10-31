import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  interpolate,
} from "react-native-reanimated";
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";

// ============================================================================
// Types
// ============================================================================

export interface AjoraChatThinkingIndicatorProps {
  /** Whether the assistant is currently thinking/running */
  isThinking?: boolean;
  /** Optional title from THINKING_START (e.g., "Planning"). Renders bold
   *  above the streamed text. */
  title?: string;
  /** Optional live thinking text. Only the last non-empty line is shown,
   *  truncated to a single line so the indicator stays compact. */
  text?: string;
  /** Custom dot color */
  dotColor?: string;
  /** Size of each dot */
  dotSize?: number;
  /** Gap between dots */
  gap?: number;
  /** Container style override */
  style?: StyleProp<ViewStyle>;
  /** Custom colors override */
  colors?: {
    background?: string;
    dotDefault?: string;
    title?: string;
    text?: string;
  };
}

// ============================================================================
// Loading Dots Animation Component
// ============================================================================

interface LoadingDotsProps {
  dotColor?: string;
  dotSize?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({
  dotColor,
  dotSize = 6,
  gap = 6,
  style,
}) => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animateDots = () => {
      dot1.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 200 }),
      );
      dot2.value = withSequence(
        withTiming(0, { duration: 200 }),
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 200 }),
      );
      dot3.value = withSequence(
        withTiming(0, { duration: 400 }),
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 200 }),
      );
    };

    animateDots();
    const interval = setInterval(animateDots, 600);
    return () => clearInterval(interval);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot1.value, [0, 1], [0.3, 1]),
    transform: [{ scale: interpolate(dot1.value, [0, 1], [0.8, 1.2]) }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot2.value, [0, 1], [0.3, 1]),
    transform: [{ scale: interpolate(dot2.value, [0, 1], [0.8, 1.2]) }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot3.value, [0, 1], [0.3, 1]),
    transform: [{ scale: interpolate(dot3.value, [0, 1], [0.8, 1.2]) }],
  }));

  const dotStyles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: gap,
    },
    dot: {
      width: dotSize,
      height: dotSize,
      borderRadius: dotSize / 2,
      backgroundColor: dotColor,
    },
  });

  return (
    <View style={[dotStyles.container, style]}>
      <Animated.View style={[dotStyles.dot, dot1Style]} />
      <Animated.View style={[dotStyles.dot, dot2Style]} />
      <Animated.View style={[dotStyles.dot, dot3Style]} />
    </View>
  );
};

// ============================================================================
// Helpers
// ============================================================================

// Surface only the most recent non-empty line. Streaming reasoning often
// arrives as multiple short lines, and showing the whole buffer would make
// the indicator jump. The last line is what's actively being written.
function lastLine(text: string | undefined): string {
  if (!text) return "";
  const trimmed = text.replace(/\s+$/g, "");
  if (!trimmed) return "";
  const idx = trimmed.lastIndexOf("\n");
  return idx === -1 ? trimmed : trimmed.slice(idx + 1);
}

// ============================================================================
// Main Component
// ============================================================================

const COMPACT_HEIGHT = 35;
const EXPANDED_HEIGHT = 56;
const COMPACT_WIDTH = 52;

export function AjoraChatThinkingIndicator({
  isThinking = false,
  title,
  text,
  dotColor,
  dotSize = 6,
  gap = 6,
  style,
  colors: colorOverrides,
}: AjoraChatThinkingIndicatorProps) {
  const theme = useAjoraTheme();

  const colors = {
    background: colorOverrides?.background ?? theme.colors.assistantBubble,
    dotDefault: colorOverrides?.dotDefault ?? theme.colors.textSecondary,
    title: colorOverrides?.title ?? theme.colors.text,
    text: colorOverrides?.text ?? theme.colors.textSecondary,
  };

  const resolvedDotColor = dotColor ?? colors.dotDefault;
  const liveText = lastLine(text);
  const hasContent = !!(title || liveText);
  const targetHeight = hasContent ? EXPANDED_HEIGHT : COMPACT_HEIGHT;

  const yCoords = useSharedValue(200);
  const heightScale = useSharedValue(0);
  const marginScale = useSharedValue(0);

  const [isVisible, setIsVisible] = useState(isThinking);

  const containerStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY: yCoords.value,
        },
      ],
      height: heightScale.value,
      marginBottom: marginScale.value,
    }),
    [yCoords, heightScale, marginScale],
  );

  const slideIn = useCallback(() => {
    const duration = 250;

    yCoords.value = withTiming(0, { duration });
    heightScale.value = withTiming(targetHeight, { duration });
    marginScale.value = withTiming(8, { duration });
  }, [yCoords, heightScale, marginScale, targetHeight]);

  const slideOut = useCallback(() => {
    const duration = 250;

    yCoords.value = withTiming(200, { duration }, (isFinished) => {
      if (isFinished) runOnJS(setIsVisible)(false);
    });
    heightScale.value = withTiming(0, { duration });
    marginScale.value = withTiming(0, { duration });
  }, [yCoords, heightScale, marginScale]);

  useEffect(() => {
    if (isVisible) {
      if (isThinking) {
        slideIn();
      } else {
        slideOut();
      }
    }
  }, [isVisible, isThinking, slideIn, slideOut]);

  // Re-run slideIn when the target height shifts mid-stream (e.g. content
  // arrives after the indicator was already in compact dot mode).
  useEffect(() => {
    if (isVisible && isThinking) {
      heightScale.value = withTiming(targetHeight, { duration: 200 });
    }
  }, [isVisible, isThinking, targetHeight, heightScale]);

  useEffect(() => {
    if (isThinking) {
      setIsVisible(true);
    }
  }, [isThinking]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        hasContent ? styles.containerExpanded : styles.containerCompact,
        { backgroundColor: colors.background },
        containerStyle,
        style,
      ]}
    >
      {hasContent ? (
        <View style={styles.row}>
          <LoadingDots
            dotColor={resolvedDotColor}
            dotSize={dotSize}
            gap={gap}
            style={styles.dotsLeading}
          />
          <View style={styles.textColumn}>
            {title ? (
              <Text
                style={[styles.title, { color: colors.title }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
            ) : null}
            {liveText ? (
              <Text
                style={[styles.text, { color: colors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {liveText}
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <LoadingDots
          dotColor={resolvedDotColor}
          dotSize={dotSize}
          gap={gap}
          style={styles.dots}
        />
      )}
    </Animated.View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    marginLeft: 12,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: "hidden",
  },
  containerCompact: {
    width: COMPACT_WIDTH,
  },
  containerExpanded: {
    alignSelf: "stretch",
    marginRight: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dotsLeading: {
    marginRight: 10,
  },
  textColumn: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
  },
  text: {
    fontSize: 12,
    marginTop: 2,
  },
  dots: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AjoraChatThinkingIndicator;
