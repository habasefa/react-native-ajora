// @ts-nocheck
import * as React from "react";
import {
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";

export interface AjoraChatSuggestionPillColorsOverride {
  background?: string;
  border?: string;
  text?: string;
  icon?: string;
  pressedBackground?: string;
  loader?: string;
}

interface AjoraChatSuggestionPillColors {
  background: string;
  border: string;
  text: string;
  icon: string;
  pressedBackground: string;
  loader: string;
}

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
  /** Custom colors override */
  colors?: AjoraChatSuggestionPillColorsOverride;
}

export const AjoraChatSuggestionPill = React.forwardRef<
  any,
  AjoraChatSuggestionPillProps
>((props, ref) => {
  const {
    children,
    isLoading,
    icon,
    onPress,
    style,
    textStyle,
    disabled,
    colors: colorOverrides,
  } = props;

  const theme = useAjoraTheme();

  const colors: AjoraChatSuggestionPillColors = React.useMemo(
    () => ({
      background: colorOverrides?.background ?? theme.colors.surface,
      border: colorOverrides?.border ?? theme.colors.border,
      text: colorOverrides?.text ?? theme.colors.text,
      icon: colorOverrides?.icon ?? theme.colors.textSecondary,
      pressedBackground:
        colorOverrides?.pressedBackground ?? theme.colors.itemSelected,
      loader: colorOverrides?.loader ?? theme.colors.textSecondary,
    }),
    [theme, colorOverrides],
  );

  const showIcon = !isLoading && icon;

  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      disabled={isLoading || disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
        pressed && { backgroundColor: colors.pressedBackground },
        (isLoading || disabled) && styles.disabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={colors.loader}
          style={styles.loader}
        />
      ) : (
        showIcon && (
          <Text style={[styles.icon, { color: colors.icon }]}>{icon}</Text>
        )
      )}
      {/* @ts-ignore */}
      <Text style={[styles.label, { color: colors.text }, textStyle]}>
        {children}
      </Text>
    </Pressable>
  );
});

AjoraChatSuggestionPill.displayName = "AjoraChatSuggestionPill";

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  loader: {
    marginRight: 8,
    transform: [{ scale: 0.9 }],
  },
  icon: {
    marginRight: 8,
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default AjoraChatSuggestionPill;
