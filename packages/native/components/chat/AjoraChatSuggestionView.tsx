// @ts-nocheck
import * as React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Suggestion } from "@ajora-ai/core";
import { renderSlot, WithSlots } from "../../lib/slots";
import AjoraChatSuggestionPill, {
  AjoraChatSuggestionPillProps,
} from "./AjoraChatSuggestionPill";

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
  },
  {
    suggestions: Suggestion[];
    onSelectSuggestion?: (suggestion: Suggestion, index: number) => void;
    loadingIndexes?: ReadonlyArray<number>;
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
    container,
    suggestion: suggestionSlot,
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

  const suggestionElements = suggestions.map((suggestion, index) => {
    const isLoading = loadingSet.has(index) || suggestion.isLoading === true;
    const pill = renderSlot<
      typeof AjoraChatSuggestionPill,
      AjoraChatSuggestionPillProps
    >(suggestionSlot, AjoraChatSuggestionPill, {
      children: suggestion.title,
      isLoading,
      onPress: () => onSelectSuggestion?.(suggestion, index),
    });

    return React.cloneElement(pill as React.ReactElement, {
      key: `${suggestion.title}-${index}`,
    });
  });

  const boundContainer = React.cloneElement(
    ContainerElement as React.ReactElement,
    undefined,
    suggestionElements
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
