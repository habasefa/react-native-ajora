// @ts-nocheck
import * as React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { renderSlot, SlotValue } from "../../lib/slots";
import {
  AjoraChatDefaultLabels,
  useAjoraChatConfiguration,
} from "../../providers/AjoraChatConfigurationProvider";

const DefaultOpenIcon: React.FC = () => (
  <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
);

const DefaultCloseIcon: React.FC = () => (
  <Ionicons name="close" size={24} color="#FFFFFF" />
);

export interface AjoraChatToggleButtonProps {
  /** Optional slot override for the chat (closed) icon. */
  openIcon?: SlotValue<typeof DefaultOpenIcon>;
  /** Optional slot override for the close icon. */
  closeIcon?: SlotValue<typeof DefaultCloseIcon>;
  /** Optional style override for the button. */
  style?: StyleProp<ViewStyle>;
  /** Whether the button is disabled. */
  disabled?: boolean;
}

export const AjoraChatToggleButton = React.forwardRef<
  any,
  AjoraChatToggleButtonProps
>(({ openIcon, closeIcon, style, disabled }, ref) => {
  const configuration = useAjoraChatConfiguration();
  const labels = configuration?.labels ?? AjoraChatDefaultLabels;

  const [fallbackOpen, setFallbackOpen] = React.useState(false);
  const isOpen = configuration?.isModalOpen ?? fallbackOpen;
  const setModalOpen = configuration?.setModalOpen ?? setFallbackOpen;

  const rotation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(rotation, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [isOpen]);

  const handlePress = () => {
    if (disabled) return;
    setModalOpen(!isOpen);
  };

  const renderedOpenIcon = renderSlot(openIcon, DefaultOpenIcon, {});
  const renderedCloseIcon = renderSlot(closeIcon, DefaultCloseIcon, {});

  const openIconRotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  const closeIconRotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["-90deg", "0deg"],
  });

  const openIconOpacity = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const closeIconOpacity = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Pressable
      ref={ref}
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      accessibilityLabel={
        isOpen ? labels.chatToggleCloseLabel : labels.chatToggleOpenLabel
      }
    >
      {/* @ts-ignore */}
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            opacity: openIconOpacity,
            transform: [
              { rotate: openIconRotate },
              {
                scale: openIconOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.75, 1],
                }),
              },
            ],
          },
        ]}
      >
        {renderedOpenIcon}
      </Animated.View>
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            opacity: closeIconOpacity,
            transform: [
              { rotate: closeIconRotate },
              {
                scale: closeIconOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.75, 1],
                }),
              },
            ],
          },
        ]}
      >
        {renderedCloseIcon}
      </Animated.View>
    </Pressable>
  );
});

AjoraChatToggleButton.displayName = "AjoraChatToggleButton";

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
  iconWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AjoraChatToggleButton;
