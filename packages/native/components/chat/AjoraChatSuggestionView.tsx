// @ts-nocheck
import * as React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Suggestion } from "../../../core";
import { renderSlot, WithSlots } from "../../lib/slots";
import AjoraChatSuggestionPill, {
  AjoraChatSuggestionPillProps,
} from "./AjoraChatSuggestionPill";
import AjoraChatSuggestionShimmer, {
  AjoraChatSuggestionShimmerProps,
} from "./AjoraChatSuggestionShimmer";

// Widths are deliberately varied so a shimmer row looks more like candidate
// suggestions (which have varying lengths) than a uniform stripe.
const SHIMMER_PLACEHOLDER_WIDTHS = [88, 132, 104] as const;

const DefaultContainer = React.forwardRef<
  any,
  { children: React.ReactNode; style?: StyleProp<ViewStyle> }
>(({ children, style, ...props }, ref) => {
  return (
    <View ref={ref} style={[styles.container, style]} {...props}>
      {/* @ts-ignore */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {children}
      </ScrollView>
    </View>
  );
});

export type AjoraChatSuggestionViewProps = WithSlots<
  {
    container: typeof DefaultContainer;
    suggestion: typeof AjoraChatSuggestionPill;
    shimmer: typeof AjoraChatSuggestionShimmer;
  },
  {
    suggestions: Suggestion[];
    onSelectSuggestion?: (suggestion: Suggestion, index: number) => void;
    loadingIndexes?: ReadonlyArray<number>;
    /**
     * When true and no suggestions have arrived yet, the view renders
     * shimmer placeholders instead of an empty row. The existing per-pill
     * `loadingIndexes` / `suggestion.isLoading` spinner still handles the
     * "user clicked this pill" case independently.
     */
    isLoading?: boolean;
    style?: StyleProp<ViewStyle>;
  }
>;

export const AjoraChatSuggestionView = React.forwardRef<
  any,
  AjoraChatSuggestionViewProps
>((props, ref) => {
  const {
    suggestions,
    onSelectSuggestion,
    loadingIndexes,
    isLoading,
    container,
    suggestion: suggestionSlot,
    shimmer: shimmerSlot,
    children,
    style,
    ...restProps
  } = props;

  const loadingSet = React.useMemo(() => {
    if (!loadingIndexes || loadingIndexes.length === 0) {
      return new Set<number>();
    }
    return new Set(loadingIndexes);
  }, [loadingIndexes]);

  const ContainerElement = renderSlot(container, DefaultContainer, {
    ref,
    style,
    ...restProps,
  });

  const showShimmers = isLoading === true && suggestions.length === 0;

  const suggestionElements = showShimmers
    ? SHIMMER_PLACEHOLDER_WIDTHS.map((width, index) => {
        const placeholder = renderSlot<
          typeof AjoraChatSuggestionShimmer,
          AjoraChatSuggestionShimmerProps
        >(shimmerSlot, AjoraChatSuggestionShimmer, { width });
        return React.cloneElement(placeholder as React.ReactElement, {
          key: `shimmer-${index}`,
        });
      })
    : suggestions.map((suggestion, index) => {
        const pillIsLoading =
          loadingSet.has(index) || suggestion.isLoading === true;
        const pill = renderSlot<
          typeof AjoraChatSuggestionPill,
          AjoraChatSuggestionPillProps
        >(suggestionSlot, AjoraChatSuggestionPill, {
          children: suggestion.title,
          isLoading: pillIsLoading,
          onPress: () => onSelectSuggestion?.(suggestion, index),
        });

        return React.cloneElement(pill as React.ReactElement, {
          key: `${suggestion.title}-${index}`,
        });
      });

  const boundContainer = React.cloneElement(
    ContainerElement as React.ReactElement,
    undefined,
    suggestionElements,
  );

  if (typeof children === "function") {
    const sampleSuggestion = renderSlot<
      typeof AjoraChatSuggestionPill,
      AjoraChatSuggestionPillProps
    >(suggestionSlot, AjoraChatSuggestionPill, {
      children: suggestions[0]?.title ?? "",
      isLoading:
        suggestions.length > 0
          ? loadingSet.has(0) || suggestions[0]?.isLoading === true
          : false,
    });

    return (
      <React.Fragment>
        {/* @ts-ignore */}
        {children({
          container: boundContainer,
          suggestion: sampleSuggestion,
          suggestions,
          onSelectSuggestion,
          loadingIndexes,
          style,
          ...restProps,
        })}
      </React.Fragment>
    );
  }

  if (children) {
    return (
      <React.Fragment>
        {boundContainer}
        {children as React.ReactNode}
      </React.Fragment>
    );
  }

  return boundContainer;
});

AjoraChatSuggestionView.displayName = "AjoraChatSuggestionView";

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  scrollContent: {
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
  },
});

export default AjoraChatSuggestionView;
