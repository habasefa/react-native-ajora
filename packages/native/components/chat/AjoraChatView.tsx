// @ts-nocheck
import React from "react";
import {
  View,
  ScrollView,
  StyleProp,
  ViewStyle,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { WithSlots, renderSlot } from "../../lib/slots";
import AjoraChatInput, { AjoraChatInputProps } from "./AjoraChatInput";
import { Suggestion } from "@ajora-ai/core";
import { Message } from "@ag-ui/core";
import AjoraChatSuggestionView, {
  AjoraChatSuggestionViewProps,
} from "./AjoraChatSuggestionView";
import { useKeyboardHeight } from "../../hooks/use-keyboard-height";
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
    style?: StyleProp<ViewStyle>;
  }
>;

export function AjoraChatView({
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
  children,
  style,
  ...props
}: AjoraChatViewProps) {
  const keyboardHeight = useKeyboardHeight();

  const BoundMessageView = renderSlot(messageView, AjoraChatMessageView, {
    messages,
    isRunning,
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
    children: <View>{BoundMessageView}</View>,
  });

  const content = (
    <View style={[{ flex: 1 }, style]} {...props}>
      {BoundScrollView}
      <View style={styles.bottomContainer}>
        {BoundSuggestionView}
        {BoundInput}
      </View>
    </View>
  );

  if (children) {
    return children({
      messageView: BoundMessageView,
      input: BoundInput,
      scrollView: BoundScrollView,
      suggestionView: BoundSuggestionView ?? <></>,
    });
  }

  // Use KeyboardAvoidingView for iOS, Android handles standard adjustResize usually
  if (Platform.OS === "ios") {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0} // Adjust based on header height if needed
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  messageList: {
    paddingBottom: 20,
  },
  bottomContainer: {
    paddingBottom: 10,
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
