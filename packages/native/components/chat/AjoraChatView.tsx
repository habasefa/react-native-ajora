// @ts-nocheck
import React from "react";
import {
  View,
  ScrollView,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import {
  KeyboardProvider,
  useReanimatedKeyboardAnimation,
} from "react-native-keyboard-controller";
import { WithSlots, renderSlot } from "../../lib/slots";
import AjoraChatInput, { AjoraChatInputProps } from "./AjoraChatInput";
import { Suggestion } from "@ajora-ai/core";
import { AssistantMessage, Message } from "@ag-ui/core";
import AjoraChatSuggestionView, {
  AjoraChatSuggestionViewProps,
} from "./AjoraChatSuggestionView";
import AjoraChatMessageView from "./AjoraChatMessageView";

export type AjoraChatViewProps = WithSlots<
  {
    messageView: typeof AjoraChatMessageView;
    scrollView: typeof ScrollView;
    input: typeof AjoraChatInput;
    suggestionView: typeof AjoraChatSuggestionView;
  },
  {
    messages?: Message[];
    inputProps?: Partial<Omit<AjoraChatInputProps, "children">>;
    isRunning?: boolean;
    suggestions?: Suggestion[];
    suggestionLoadingIndexes?: ReadonlyArray<number>;
    onSelectSuggestion?: (suggestion: Suggestion, index: number) => void;
    onRegenerate?: (message: AssistantMessage) => void;
    style?: StyleProp<ViewStyle>;
  }
>;

/**
 * Inner component that uses keyboard animation
 * Must be used within KeyboardProvider
 */
function AjoraChatViewInner({
  messageView,
  input,
  scrollView,
  suggestionView,
  messages = [],
  inputProps,
  isRunning = false,
  suggestions,
  suggestionLoadingIndexes,
  onSelectSuggestion,
  onRegenerate,
  children,
  style,
  ...props
}: AjoraChatViewProps) {
  // Keyboard animation using react-native-keyboard-controller
  const keyboard = useReanimatedKeyboardAnimation();

  // Animated style that translates content up when keyboard appears
  const keyboardAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: keyboard.height.value }],
    }),
    [keyboard]
  );

  const BoundMessageView = renderSlot(messageView, AjoraChatMessageView, {
    messages,
    isRunning,
    onRegenerate,
  });

  const BoundInput = renderSlot(input, AjoraChatInput, {
    ...(inputProps ?? {}),
  } as AjoraChatInputProps);

  const hasSuggestions = Array.isArray(suggestions) && suggestions.length > 0;

  // Note: AjoraChatSuggestionView expects an array of suggestions
  const BoundSuggestionView = hasSuggestions
    ? renderSlot(suggestionView, AjoraChatSuggestionView, {
        suggestions,
        onSelectSuggestion,
        loadingIndexes: suggestionLoadingIndexes,
      })
    : null;

  const BoundScrollView = renderSlot(scrollView, ScrollView, {
    style: { flex: 1 },
    contentContainerStyle: { padding: 16 },
    keyboardShouldPersistTaps: "handled",
    children: <View>{BoundMessageView}</View>,
  });

  if (children) {
    return children({
      messageView: BoundMessageView,
      input: BoundInput,
      scrollView: BoundScrollView,
      suggestionView: BoundSuggestionView ?? <></>,
    });
  }

  return (
    <View style={[styles.container, style]} {...props}>
      <Animated.View style={[styles.animatedContainer, keyboardAnimatedStyle]}>
        {BoundScrollView}
        <View style={styles.bottomContainer}>
          {BoundSuggestionView}
          {BoundInput}
        </View>
      </Animated.View>
    </View>
  );
}

/**
 * Main AjoraChatView component with keyboard handling
 * Wraps content in KeyboardProvider for proper keyboard animation
 */
export function AjoraChatView(props: AjoraChatViewProps) {
  return (
    <KeyboardProvider>
      <AjoraChatViewInner {...props} />
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  animatedContainer: {
    flex: 1,
  },
  messageList: {
    paddingBottom: 20,
  },
  bottomContainer: {
    backgroundColor: "transparent",
  },
  suggestionList: {
    maxHeight: 60,
    marginBottom: 8,
  },
  suggestionListContent: {
    paddingHorizontal: 16,
  },
});

export default AjoraChatView;
