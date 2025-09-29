import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
} from "react-native-reanimated";

interface LoadingAnimationProps {
  containerStyle?: any;
  dotColor?: string;
  dotSize?: number;
  gap?: number;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  containerStyle,
  dotColor = "#000000",
  dotSize = 6,
  gap = 4,
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

  const styles = StyleSheet.create({
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
    <View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.dot, dot1Style]} />
      <Animated.View style={[styles.dot, dot2Style]} />
      <Animated.View style={[styles.dot, dot3Style]} />
    </View>
  );
};

export default LoadingAnimation;
