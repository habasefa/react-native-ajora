import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  interpolate,
} from "react-native-reanimated";

// ============================================================================
// Types
// ============================================================================

export interface AjoraChatThinkingIndicatorProps {
  /** Whether the assistant is currently thinking/running */
  isThinking?: boolean;
  /** Custom dot color */
  dotColor?: string;
  /** Size of each dot */
  dotSize?: number;
  /** Gap between dots */
  gap?: number;
  /** Container style override */
  style?: StyleProp<ViewStyle>;
}

// ============================================================================
// Theme Colors (matching AjoraChatAssistantMessage)
// ============================================================================

const COLORS = {
  dotDefault: "#6B7280", // mutedForeground
  background: "#F3F4F6", // secondary background
};

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
  dotColor = COLORS.dotDefault,
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
        withTiming(0, { duration: 200 })
      );
      dot2.value = withSequence(
        withTiming(0, { duration: 200 }),
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 200 })
      );
      dot3.value = withSequence(
        withTiming(0, { duration: 400 }),
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 200 })
      );
    };

    animateDots();
    const interval = setInterval(animateDots, 600);
    return () => clearInterval(interval);
  }, [dot1, dot2, dot3]);

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
// Main Component
// ============================================================================

export function AjoraChatThinkingIndicator({
  isThinking = false,
  dotColor = COLORS.dotDefault,
  dotSize = 6,
  gap = 6,
  style,
}: AjoraChatThinkingIndicatorProps) {
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
    [yCoords, heightScale, marginScale]
  );

  const slideIn = useCallback(() => {
    const duration = 250;

    yCoords.value = withTiming(0, { duration });
    heightScale.value = withTiming(35, { duration });
    marginScale.value = withTiming(8, { duration });
  }, [yCoords, heightScale, marginScale]);

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

  useEffect(() => {
    if (isThinking) {
      setIsVisible(true);
    }
  }, [isThinking]);

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, containerStyle, style]}>
      <LoadingDots
        dotColor={dotColor}
        dotSize={dotSize}
        gap={gap}
        style={styles.dots}
      />
    </Animated.View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    marginLeft: 12,
    width: 52,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: "hidden",
  },
  dots: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AjoraChatThinkingIndicator;
