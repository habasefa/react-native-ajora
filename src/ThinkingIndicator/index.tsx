import React, { useCallback, useEffect, useState } from "react";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { TypingIndicatorProps } from "./types";
import LoadingAnimation from "../LoadingAnimation";
import Color from "../Color";

import stylesCommon from "../styles";
import styles from "./styles";

export * from "./types";

const TypingIndicator = ({ isThinking }: TypingIndicatorProps) => {
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
    if (isVisible)
      if (isThinking) slideIn();
      else slideOut();
  }, [isVisible, isThinking, slideIn, slideOut]);

  useEffect(() => {
    if (isThinking) setIsVisible(true);
  }, [isThinking]);

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LoadingAnimation
        containerStyle={[
          stylesCommon.fill,
          stylesCommon.centerItems,
          styles.dots,
        ]}
        dotColor={Color.mutedForeground}
        dotSize={6}
        gap={6}
      />
    </Animated.View>
  );
};

export default TypingIndicator;
