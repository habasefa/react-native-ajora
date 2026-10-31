import * as React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Skeleton } from "moti/skeleton";
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";

// Pill dimensions deliberately mirror AjoraChatSuggestionPill so the shimmer
// placeholder occupies the same layout slot — swapping to a real pill when
// the suggestion arrives doesn't jump.
const PILL_HEIGHT = 40;
const PILL_RADIUS = 20;

export interface AjoraChatSuggestionShimmerProps {
  /** Width of the shimmer placeholder. Varying widths across placeholders
   *  reads more naturally than a uniform row. */
  width?: number;
  /** Override the base + highlight colors. Defaults derive from theme. */
  colors?: readonly [string, string];
  /** Override the skeleton color mode — otherwise inferred from theme. */
  colorMode?: "light" | "dark";
  style?: StyleProp<ViewStyle>;
}

export const AjoraChatSuggestionShimmer = React.forwardRef<
  View,
  AjoraChatSuggestionShimmerProps
>(({ width = 104, colors, colorMode, style }, ref) => {
  const theme = useAjoraTheme();

  const inferredMode: "light" | "dark" =
    colorMode ?? (theme.name === "dark" ? "dark" : "light");

  // moti's Skeleton accepts a 2-color tuple and animates between them.
  // Falling back to theme surfaces keeps this consistent with the real pill.
  const colorTuple = colors ?? [
    theme.colors.surface,
    theme.colors.border,
  ];

  return (
    <View ref={ref} style={[styles.wrapper, style]}>
      <Skeleton
        width={width}
        height={PILL_HEIGHT}
        radius={PILL_RADIUS}
        colorMode={inferredMode}
        colors={colorTuple as unknown as string[]}
      />
    </View>
  );
});

AjoraChatSuggestionShimmer.displayName = "AjoraChatSuggestionShimmer";

const styles = StyleSheet.create({
  // Match the margins of AjoraChatSuggestionPill so shimmers sit on the
  // same horizontal rhythm as real pills.
  wrapper: {
    marginRight: 8,
    marginBottom: 8,
  },
});

export default AjoraChatSuggestionShimmer;
