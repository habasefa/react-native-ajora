// @ts-nocheck
import * as React from "react";
import { Text, Pressable, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from "react-native";

export interface AjoraChatSuggestionPillProps {
  /** The content to display inside the pill. */
  children: React.ReactNode;
  /** Whether the pill should display a loading spinner. */
  isLoading?: boolean;
  /** Optional icon to render on the left side when not loading. */
  icon?: React.ReactNode;
  /** Callback when the pill is pressed. */
  onPress?: () => void;
  /** Optional style override for the container. */
  style?: StyleProp<ViewStyle>;
  /** Optional style override for the text. */
  textStyle?: StyleProp<TextStyle>;
  /** Whether the button is disabled. */
  disabled?: boolean;
}

export const AjoraChatSuggestionPill = React.forwardRef<any, AjoraChatSuggestionPillProps>(
  (props, ref) => {
    const { children, isLoading, icon, onPress, style, textStyle, disabled } = props;

    const showIcon = !isLoading && icon;

    return (
       
      <Pressable
        ref={ref}
        onPress={onPress}
        disabled={isLoading || disabled}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
          (isLoading || disabled) && styles.disabled,
          style,
        ]}
      >
        {isLoading ? (
           
          <ActivityIndicator size="small" color="#8E8E93" style={styles.loader} />
        ) : (
          showIcon && (
             
            <Text style={styles.icon}>{icon}</Text>
          )
        )}
        {/* @ts-ignore */}
        <Text style={[styles.label, textStyle]}>{children}</Text>
      </Pressable>
    );
  }
);

AjoraChatSuggestionPill.displayName = "AjoraChatSuggestionPill";

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E7",
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    marginBottom: 8,
  },
  pressed: {
    backgroundColor: "#F2F2F7",
  },
  disabled: {
    opacity: 0.6,
  },
  loader: {
    marginRight: 6,
    transform: [{ scale: 0.8 }],
  },
  icon: {
    marginRight: 6,
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1C1C1E",
  },
});

export default AjoraChatSuggestionPill;
