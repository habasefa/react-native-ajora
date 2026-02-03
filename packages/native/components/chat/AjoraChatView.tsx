// @ts-nocheck
import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import {
  View,
  ScrollView,
  StyleProp,
  ViewStyle,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  Pressable,
} from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import {
  KeyboardProvider,
  useReanimatedKeyboardAnimation,
} from "react-native-keyboard-controller";
import { Ionicons } from "@expo/vector-icons";
import { WithSlots, renderSlot } from "../../lib/slots";
import AjoraChatInput, { AjoraChatInputProps } from "./AjoraChatInput";
import { Suggestion } from "../../../core";
import { AssistantMessage, Message } from "@ag-ui/core";
import AjoraChatSuggestionView, {
  AjoraChatSuggestionViewProps,
} from "./AjoraChatSuggestionView";
import AjoraChatMessageView from "./AjoraChatMessageView";
import AjoraChatThinkingIndicator from "./AjoraChatThinkingIndicator";
import AjoraChatEmptyState from "./AjoraChatEmptyState";
import AjoraChatLoadingState from "./AjoraChatLoadingState";
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";

// ============================================================================
// Types
// ============================================================================

export type AjoraChatViewProps = WithSlots<
  {
    messageView: typeof AjoraChatMessageView;
    scrollView: typeof AjoraChatScrollView;
    input: typeof AjoraChatInput;
    suggestionView: typeof AjoraChatSuggestionView;
    thinkingIndicator: typeof AjoraChatThinkingIndicator;
    scrollToBottomButton: typeof AjoraChatScrollToBottomButton;
    emptyState: typeof AjoraChatEmptyState;
    loadingState: typeof AjoraChatLoadingState;
  },
  {
    messages?: Message[];
    inputProps?: Partial<Omit<AjoraChatInputProps, "children">>;
    isRunning?: boolean;
    /** Whether the chat is in a loading state (e.g., connecting, loading history) */
    isLoading?: boolean;
    /** Whether to show the thinking indicator when isRunning is true */
    showThinkingIndicator?: boolean;
    /** Whether to show the empty state when there are no messages */
    showEmptyState?: boolean;
    /** Whether to show the loading state when isLoading is true */
    showLoadingState?: boolean;
    /** Whether to auto-scroll to bottom when new messages arrive or content is streaming */
    autoScroll?: boolean;
    /** Starter suggestions to show in the empty state */
    starterSuggestions?: Suggestion[];
    suggestions?: Suggestion[];
    suggestionLoadingIndexes?: ReadonlyArray<number>;
    onSelectSuggestion?: (suggestion: Suggestion, index: number) => void;
    onRegenerate?: (message: AssistantMessage) => void;
    textRenderer?: (props: {
      content: string;
      style?: any;
      isUser?: boolean;
    }) => React.ReactNode;

    onMessageLongPress?: (message: Message) => void;
    style?: StyleProp<ViewStyle>;

    // ========================================================================
    // Style Props for Direct Customization
    // ========================================================================

    /** Style override for the main container */
    containerStyle?: StyleProp<ViewStyle>;
    /** Style override for the message list area */
    messageListStyle?: StyleProp<ViewStyle>;
    /** Style override for the input container at the bottom */
    inputContainerStyle?: StyleProp<ViewStyle>;
    /** Style override for user message bubbles */
    userBubbleStyle?: StyleProp<ViewStyle>;
    /** Style override for assistant message bubbles */
    assistantBubbleStyle?: StyleProp<ViewStyle>;
    /** Style override for the suggestions container */
    suggestionContainerStyle?: StyleProp<ViewStyle>;
    /** Style override for the scroll view content */
    scrollContentStyle?: StyleProp<ViewStyle>;

    // ========================================================================
    // Component Override Props
    // ========================================================================

    /** Custom message component */
    Message?: (props: { message: Message; index: number }) => React.ReactNode;
    /** Custom bubble wrapper component */
    Bubble?: (props: {
      message: Message;
      isUser: boolean;
      children: React.ReactNode;
    }) => React.ReactNode;
    /** Custom avatar component */
    Avatar?: (props: {
      role: "user" | "assistant";
      size?: number;
    }) => React.ReactNode;
    /** Custom empty state component */
    EmptyState?: () => React.ReactNode;
    /** Custom loading state component */
    LoadingState?: () => React.ReactNode;
    /** Custom thinking indicator component */
    ThinkingIndicator?: () => React.ReactNode;
    /** Custom suggestion component */
    Suggestion?: (props: {
      suggestion: Suggestion;
      onPress: () => void;
    }) => React.ReactNode;
  }
>;

// ============================================================================
// Auto-Scroll Hook
// ============================================================================

interface UseAutoScrollOptions {
  /** Enable/disable auto-scroll behavior */
  enabled: boolean;
  /** Whether content is currently being streamed/updated */
  isStreaming: boolean;
  /** Messages array to track changes */
  messages: Message[];
  /** Threshold (in pixels) to consider "at bottom" */
  bottomThreshold?: number;
}

interface UseAutoScrollReturn {
  scrollViewRef: React.RefObject<ScrollView>;
  isAtBottom: boolean;
  scrollToBottom: (animated?: boolean) => void;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleContentSizeChange: (width: number, height: number) => void;
  handleLayout: (event: LayoutChangeEvent) => void;
}

function useAutoScroll({
  enabled,
  isStreaming,
  messages,
  bottomThreshold = 100,
}: UseAutoScrollOptions): UseAutoScrollReturn {
  const scrollViewRef = useRef<ScrollView>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const contentHeight = useRef(0);
  const scrollViewHeight = useRef(0);
  const currentScrollY = useRef(0);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Track content changes to trigger scroll
  const lastMessageId = useMemo(() => {
    return messages[messages.length - 1]?.id;
  }, [messages]);

  const lastMessageContent = useMemo(() => {
    const lastMsg = messages[messages.length - 1];
    return lastMsg?.role === "assistant" ? lastMsg.content : null;
  }, [messages]);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((animated = true) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated });
    }
  }, []);

  // Check if we're at the bottom
  const checkIfAtBottom = useCallback(() => {
    const maxScroll = contentHeight.current - scrollViewHeight.current;
    const distanceFromBottom = maxScroll - currentScrollY.current;
    return distanceFromBottom <= bottomThreshold;
  }, [bottomThreshold]);

  // Handle scroll events
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      currentScrollY.current = contentOffset.y;
      contentHeight.current = contentSize.height;
      scrollViewHeight.current = layoutMeasurement.height;

      // Mark as user scrolling
      isUserScrolling.current = true;

      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Reset user scrolling flag after a delay
      scrollTimeout.current = setTimeout(() => {
        isUserScrolling.current = false;
      }, 150);

      // Update isAtBottom state
      const atBottom = checkIfAtBottom();
      setIsAtBottom(atBottom);
    },
    [checkIfAtBottom],
  );

  // Handle content size changes (triggered when content updates)
  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      const previousHeight = contentHeight.current;
      contentHeight.current = height;

      // If auto-scroll is enabled and we were at bottom, scroll to new bottom
      if (enabled && isAtBottom && !isUserScrolling.current) {
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          scrollToBottom(true);
        });
      }
    },
    [enabled, isAtBottom, scrollToBottom],
  );

  // Handle layout changes
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    scrollViewHeight.current = event.nativeEvent.layout.height;
  }, []);

  // Auto-scroll when streaming content
  useEffect(() => {
    if (enabled && isStreaming && isAtBottom && !isUserScrolling.current) {
      // Scroll on a short delay to ensure content has rendered
      const timer = setTimeout(() => {
        scrollToBottom(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [enabled, isStreaming, isAtBottom, lastMessageContent, scrollToBottom]);

  // Auto-scroll when new message arrives
  useEffect(() => {
    if (enabled && isAtBottom && !isUserScrolling.current) {
      // Small delay to ensure the new message has rendered
      const timer = setTimeout(() => {
        scrollToBottom(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [enabled, isAtBottom, lastMessageId, scrollToBottom]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  return {
    scrollViewRef,
    isAtBottom,
    scrollToBottom,
    handleScroll,
    handleContentSizeChange,
    handleLayout,
  };
}

// ============================================================================
// Scroll To Bottom Button Component
// ============================================================================

interface AjoraChatScrollToBottomButtonProps {
  onPress: () => void;
  visible: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AjoraChatScrollToBottomButton({
  onPress,
  visible,
  style,
}: AjoraChatScrollToBottomButtonProps) {
  const theme = useAjoraTheme();

  if (!visible) return null;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.scrollToBottomButton,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        style,
      ]}
      accessibilityLabel="Scroll to bottom"
      accessibilityRole="button"
    >
      <Ionicons
        name="chevron-down"
        size={20}
        color={theme.colors.iconDefault}
      />
    </Pressable>
  );
}

// ============================================================================
// Auto-Scroll ScrollView Component
// ============================================================================

interface AjoraChatScrollViewProps {
  children: React.ReactNode;
  autoScroll?: boolean;
  isStreaming?: boolean;
  messages?: Message[];
  scrollToBottomButton?: React.ReactElement | null;
  showScrollToBottomButton?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function AjoraChatScrollView({
  children,
  autoScroll = true,
  isStreaming = false,
  messages = [],
  scrollToBottomButton,
  showScrollToBottomButton = true,
  style,
  contentContainerStyle,
}: AjoraChatScrollViewProps) {
  const {
    scrollViewRef,
    isAtBottom,
    scrollToBottom,
    handleScroll,
    handleContentSizeChange,
    handleLayout,
  } = useAutoScroll({
    enabled: autoScroll,
    isStreaming,
    messages,
    bottomThreshold: 100,
  });

  const shouldShowButton = showScrollToBottomButton && !isAtBottom;

  return (
    <View style={[styles.scrollViewWrapper, style]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollViewContent,
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>

      {/* Scroll to bottom button */}
      {scrollToBottomButton ? (
        React.cloneElement(scrollToBottomButton as React.ReactElement, {
          onPress: () => scrollToBottom(true),
          visible: shouldShowButton,
        })
      ) : (
        <AjoraChatScrollToBottomButton
          onPress={() => scrollToBottom(true)}
          visible={shouldShowButton}
        />
      )}
    </View>
  );
}

// ============================================================================
// Inner Component (with keyboard animation)
// ============================================================================

/**
 * Inner component that uses keyboard animation
 * Must be used within KeyboardProvider
 */
function AjoraChatViewInner({
  messageView,
  input,
  scrollView,
  suggestionView,
  thinkingIndicator,
  scrollToBottomButton,
  emptyState,
  loadingState,
  messages = [],
  inputProps,
  isRunning = false,
  isLoading = false,
  showThinkingIndicator = true,
  showEmptyState = true,
  showLoadingState = true,
  autoScroll = true,
  starterSuggestions,
  suggestions,
  suggestionLoadingIndexes,
  onSelectSuggestion,

  onRegenerate,
  onMessageLongPress,
  children,
  style,
  ...props
}: AjoraChatViewProps) {
  // Get theme colors
  const theme = useAjoraTheme();

  // Keyboard animation using react-native-keyboard-controller
  const keyboard = useReanimatedKeyboardAnimation();

  // Animated style that translates content up when keyboard appears
  const keyboardAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: keyboard.height.value }],
    }),
    [keyboard],
  );

  // Determine if content is actively streaming
  // (assistant is running AND last message is from assistant with content)
  const lastMessage = messages[messages.length - 1];
  const isStreaming =
    isRunning && lastMessage?.role === "assistant" && !!lastMessage.content;

  // Determine if chat is empty (no messages)
  const isEmpty = messages.length === 0;

  // Should show loading state
  const shouldShowLoading = showLoadingState && isLoading && isEmpty;

  // Should show empty state (when not loading and no messages)
  const shouldShowEmpty = showEmptyState && isEmpty && !isLoading;

  // Render empty state
  const BoundEmptyState = shouldShowEmpty
    ? renderSlot(emptyState, AjoraChatEmptyState, {
        suggestions: starterSuggestions,
        onSelectSuggestion: onSelectSuggestion
          ? (suggestion) => onSelectSuggestion(suggestion, -1)
          : undefined,
      })
    : null;

  // Render loading state
  const BoundLoadingState = shouldShowLoading
    ? renderSlot(loadingState, AjoraChatLoadingState, {
        type: "connecting",
      })
    : null;

  const BoundMessageView = renderSlot(messageView, AjoraChatMessageView, {
    messages,
    isRunning,
    showThinkingIndicator,
    thinkingIndicator,

    onRegenerate,
    onMessageLongPress,
    textRenderer: props.textRenderer,
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

  // Render scroll to bottom button slot
  const BoundScrollToBottomButton = scrollToBottomButton
    ? renderSlot(scrollToBottomButton, AjoraChatScrollToBottomButton, {
        onPress: () => {},
        visible: false,
      })
    : null;

  // Render the scroll view with auto-scroll capability
  const BoundScrollView = renderSlot(scrollView, AjoraChatScrollView, {
    autoScroll,
    isStreaming,
    messages,
    scrollToBottomButton: BoundScrollToBottomButton,
    showScrollToBottomButton: true,
    contentContainerStyle: styles.scrollViewContent,
    children: (
      <View>
        {/* Show empty or loading state when appropriate */}
        {BoundLoadingState}
        {BoundEmptyState}
        {/* Only show messages when not in loading/empty state */}
        {!shouldShowLoading && !shouldShowEmpty && BoundMessageView}
        {BoundSuggestionView}
      </View>
    ),
  });

  if (children) {
    return children({
      messageView: BoundMessageView,
      input: BoundInput,
      scrollView: BoundScrollView,
      suggestionView: BoundSuggestionView ?? <></>,
      emptyState: BoundEmptyState ?? <></>,
      loadingState: BoundLoadingState ?? <></>,
    });
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        style,
      ]}
      {...props}
    >
      <Animated.View style={[styles.animatedContainer, keyboardAnimatedStyle]}>
        {BoundScrollView}
        <View style={[styles.bottomContainer]}>{BoundInput}</View>
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

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  animatedContainer: {
    flex: 1,
  },
  scrollViewWrapper: {
    flex: 1,
    position: "relative",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 16,
  },
  messageList: {
    paddingBottom: 20,
  },
  bottomContainer: {
    backgroundColor: "transparent",
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  suggestionList: {
    maxHeight: 60,
    marginBottom: 8,
  },
  suggestionListContent: {
    paddingHorizontal: 16,
  },
  scrollToBottomButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
  },
});

export default AjoraChatView;
