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
  ActivityIndicator,
  Text,
} from "react-native";
import { FlashList, FlashListRef } from "@shopify/flash-list";
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
import AjoraChatMessageView, {
  dedupeMessagesById,
  useRenderMessage,
} from "./AjoraChatMessageView";
import AjoraChatThinkingIndicator from "./AjoraChatThinkingIndicator";
import AjoraChatEmptyState from "./AjoraChatEmptyState";
import AjoraChatLoadingState from "./AjoraChatLoadingState";
import AjoraChatErrorMessage, {
  AjoraChatErrorMessageProps,
} from "./AjoraChatErrorMessage";
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
    errorMessage: typeof AjoraChatErrorMessage;
  },
  {
    messages?: Message[];
    inputProps?: Partial<Omit<AjoraChatInputProps, "children">>;
    error?: string | null;
    /** Callback to retry the agent run upon an error */
    onRetryError?: () => void;
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

    onMessageLongPress?: (message: Message) => void;
    /** Renderer applied to both user and assistant messages unless a
        side-specific renderer is provided. */
    textRenderer?: (props: { content: string }) => React.ReactNode;
    /** Overrides `textRenderer` for user messages only. */
    userTextRenderer?: (props: { content: string }) => React.ReactNode;
    /** Overrides `textRenderer` for assistant messages only. */
    assistantTextRenderer?: (props: { content: string }) => React.ReactNode;
    style?: StyleProp<ViewStyle>;

    // ========================================================================
    // History Pagination
    // ========================================================================

    /** True while a "load earlier" page is in flight. */
    isLoadingEarlier?: boolean;
    /** Whether there are older messages available beyond the current page. */
    hasEarlierMessages?: boolean;
    /** Called when the user taps the "Load earlier" affordance. */
    onLoadEarlier?: () => void;
    /** Error from the history load (initial or reload). When set, the view
     *  surfaces a retry affordance: as a full card replacing the empty state
     *  when the thread is empty, or as a banner above the message list when
     *  messages are already shown. */
    historyError?: Error | string | null;
    /** Called when the user taps "Try again" on a history error. Typically
     *  wired to `useHistory.reload`. */
    onRetryHistory?: () => void;
    /** Active thread id. When provided, the scroll view auto-pages
     *  `onLoadEarlier` on scroll-to-top and remembers per-thread scroll
     *  position across thread switches. */
    threadId?: string;

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
    /** Custom error message component */
    ErrorMessage?: (props: AjoraChatErrorMessageProps) => React.ReactNode;
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
  /** Threshold (in pixels) from the top that triggers `onScrolledToTop`.
   *  Defaults to 200 — wide enough that fast scroll gestures still fire
   *  before the user hits the edge. */
  topThreshold?: number;
  /** Fired once each time the user crosses into the top threshold.
   *  Edge-triggered so `loadMore` doesn't get spammed while idle at top. */
  onScrolledToTop?: () => void;
  /** When set, scroll position (offset + atBottom) is remembered per
   *  threadId across switches. Switching to a known thread restores the
   *  saved position; brand-new threads default to bottom. */
  threadId?: string;
}

interface UseAutoScrollReturn {
  // Ref points to a FlashList<Message> in the FlashList code path. Typed as
  // any here to keep this hook usable from both the FlashList scrollview
  // (default) and a fallback ScrollView if a consumer overrides the slot.
  scrollViewRef: React.RefObject<any>;
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
  topThreshold = 200,
  onScrolledToTop,
  threadId,
}: UseAutoScrollOptions): UseAutoScrollReturn {
  const scrollViewRef = useRef<any>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const contentHeight = useRef(0);
  const scrollViewHeight = useRef(0);
  const currentScrollY = useRef(0);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Edge-trigger for scroll-to-top: only fire `onScrolledToTop` once per
  // entry into the threshold zone. Otherwise the callback would re-fire on
  // every scroll event while the user idled at the top.
  const wasNearTopRef = useRef(false);
  const onScrolledToTopRef = useRef(onScrolledToTop);
  onScrolledToTopRef.current = onScrolledToTop;

  // Per-thread scroll position memory. Saving on every scroll would thrash
  // the Map, so we save (a) on each visible scroll event (cheap) and (b) on
  // threadId change. Restore happens once the new thread's content has
  // measured — see `pendingRestoreRef` + `handleContentSizeChange`.
  const scrollPositionsRef = useRef<
    Map<string, { offset: number; atBottom: boolean }>
  >(new Map());
  const previousThreadIdRef = useRef<string | undefined>(threadId);
  const pendingRestoreRef = useRef<{
    threadId: string;
    offset: number;
  } | null>(null);

  // Track content changes to trigger scroll
  const lastMessageId = useMemo(() => {
    return messages[messages.length - 1]?.id;
  }, [messages]);

  const lastMessageContent = useMemo(() => {
    const lastMsg = messages[messages.length - 1];
    return lastMsg?.role === "assistant" ? lastMsg.content : null;
  }, [messages]);

  // Scroll to bottom helper. Both FlashList and ScrollView accept the same
  // `{ animated }` shape, so this works for either underlying implementation.
  const scrollToBottom = useCallback((animated = true) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd?.({ animated });
    }
  }, []);

  // Check if we're at the bottom
  const checkIfAtBottom = useCallback(() => {
    const maxScroll = contentHeight.current - scrollViewHeight.current;
    const distanceFromBottom = maxScroll - currentScrollY.current;
    return distanceFromBottom <= bottomThreshold;
  }, [bottomThreshold]);

  // On threadId change: snapshot the outgoing thread's scroll position and
  // mark a pending restore for the incoming one. The actual scroll happens
  // in `handleContentSizeChange` once the new thread's messages have laid
  // out — scrolling earlier is a no-op because the new content has zero
  // height.
  useEffect(() => {
    const previous = previousThreadIdRef.current;
    if (previous && previous !== threadId) {
      scrollPositionsRef.current.set(previous, {
        offset: currentScrollY.current,
        atBottom: isAtBottom,
      });
    }
    if (threadId && previous !== threadId) {
      const saved = scrollPositionsRef.current.get(threadId);
      if (saved && !saved.atBottom) {
        pendingRestoreRef.current = { threadId, offset: saved.offset };
      } else {
        // Brand-new thread, or the user was at the bottom — just default to
        // bottom (the existing auto-scroll logic will keep it pinned).
        pendingRestoreRef.current = null;
      }
      // Reset top-edge tracking so a fresh top reveal in the new thread
      // can trigger pagination again.
      wasNearTopRef.current = false;
    }
    previousThreadIdRef.current = threadId;
  }, [threadId, isAtBottom]);

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

      // Edge-triggered top detection. We only fire when we *enter* the
      // top zone — staying there shouldn't repeat the call. The
      // `contentSize.height > layoutMeasurement.height` guard prevents
      // false positives on threads that don't yet fill the viewport.
      const isNearTop =
        contentOffset.y <= topThreshold &&
        contentSize.height > layoutMeasurement.height;
      if (isNearTop && !wasNearTopRef.current) {
        wasNearTopRef.current = true;
        onScrolledToTopRef.current?.();
      } else if (!isNearTop && wasNearTopRef.current) {
        wasNearTopRef.current = false;
      }

      // Persist position for the active thread on every scroll. This is
      // cheap (Map.set on a single string key) and means a thread switch
      // captures the freshest offset, not whatever the last `useEffect`
      // happened to see.
      if (threadId) {
        scrollPositionsRef.current.set(threadId, {
          offset: contentOffset.y,
          atBottom,
        });
      }
    },
    [checkIfAtBottom, threadId, topThreshold],
  );

  // Handle content size changes (triggered when content updates)
  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      contentHeight.current = height;

      // Restore saved scroll position when the incoming thread has laid
      // out enough content to honor the offset. If the saved offset is
      // taller than the current content (e.g. only a partial page has
      // loaded), defer to the next size change.
      const pending = pendingRestoreRef.current;
      if (
        pending &&
        pending.threadId === threadId &&
        height >= pending.offset + scrollViewHeight.current
      ) {
        // FlashListRef uses `scrollToOffset({offset, animated})`. ScrollView
        // uses `scrollTo({y, animated})`. Try the FlashList API first since
        // that's the default underlying scrollable; fall back for the
        // override-slot ScrollView case.
        const ref = scrollViewRef.current;
        if (ref?.scrollToOffset) {
          ref.scrollToOffset({ offset: pending.offset, animated: false });
        } else if (ref?.scrollTo) {
          ref.scrollTo({ y: pending.offset, animated: false });
        }
        pendingRestoreRef.current = null;
        return;
      }

      // If auto-scroll is enabled and we were at bottom, scroll to new bottom
      if (enabled && isAtBottom && !isUserScrolling.current) {
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          scrollToBottom(true);
        });
      }
    },
    [enabled, isAtBottom, scrollToBottom, threadId],
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
  autoScroll?: boolean;
  isStreaming?: boolean;
  /** The full message array. Used for FlashList virtualization (`data`)
   *  and for streaming/last-message change detection in `useAutoScroll`. */
  messages?: Message[];
  /** Per-message render function. Receives one already-deduped message
   *  plus its index and returns the cell content. The default callsite
   *  produces this via `useRenderMessage` from `AjoraChatMessageView`. */
  renderMessage?: (
    message: Message,
    index: number,
  ) => React.ReactElement | null;
  /** Rendered above the virtualized message list (banners: history error,
   *  load-earlier). Stays visible during scroll like a non-sticky header. */
  listHeaderComponent?: React.ReactElement | null;
  /** Rendered below the virtualized message list (thinking indicator,
   *  run-error, suggestions). */
  listFooterComponent?: React.ReactElement | null;
  scrollToBottomButton?: React.ReactElement | null;
  showScrollToBottomButton?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Fired when the user scrolls into the top threshold. Wired by the
   *  parent to `loadEarlierMessages` so pagination is automatic. */
  onScrolledToTop?: () => void;
  /** Active thread id. Enables per-thread scroll-position memory. */
  threadId?: string;
}

export function AjoraChatScrollView({
  autoScroll = true,
  isStreaming = false,
  messages = [],
  renderMessage,
  listHeaderComponent,
  listFooterComponent,
  scrollToBottomButton,
  showScrollToBottomButton = true,
  style,
  contentContainerStyle,
  onScrolledToTop,
  threadId,
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
    onScrolledToTop,
    threadId,
  });

  const shouldShowButton = showScrollToBottomButton && !isAtBottom;

  // FlashList requires a stable per-item key. Message ids are unique after
  // dedup at the callsite, but we guard with the index fallback in case a
  // consumer's renderMessage handles non-Message data.
  const keyExtractor = useCallback(
    (item: Message, index: number) =>
      (item && (item.id as string)) ?? `idx-${index}`,
    [],
  );

  // FlashList's renderItem unwraps the `{item, index}` wrapper for the
  // upstream renderMessage signature. Returns null if no renderer is wired
  // — defensive, since AjoraChatViewInner always provides one.
  const renderItem = useCallback(
    ({ item, index }: { item: Message; index: number }) =>
      renderMessage ? renderMessage(item, index) : null,
    [renderMessage],
  );

  return (
    <View style={[styles.scrollViewWrapper, style]}>
      <FlashList
        ref={scrollViewRef as React.RefObject<FlashListRef<Message>>}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeaderComponent ?? undefined}
        ListFooterComponent={listFooterComponent ?? undefined}
        contentContainerStyle={contentContainerStyle as any}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        scrollEventThrottle={16}
        // FlashList's chat-mode anchoring. `startRenderingFromBottom`
        // pins fresh threads to the latest message; `autoscrollToBottomThreshold`
        // keeps the view glued to the bottom while streaming if the user
        // is already there. The top threshold preserves the visible message
        // when older pages prepend (replaces the RN ScrollView prop we used
        // before).
        maintainVisibleContentPosition={{
          startRenderingFromBottom: true,
          autoscrollToBottomThreshold: 0.2,
          autoscrollToTopThreshold: 100,
          animateAutoScrollToBottom: true,
        }}
      />

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
  errorMessage,
  messages = [],
  inputProps,
  isRunning = false,
  isLoading = false,
  error,
  showThinkingIndicator = true,
  showEmptyState = true,
  showLoadingState = true,
  autoScroll = true,
  starterSuggestions,
  suggestions,
  suggestionLoadingIndexes,
  onSelectSuggestion,
  onRetryError,
  isLoadingEarlier = false,
  hasEarlierMessages = false,
  onLoadEarlier,
  historyError,
  onRetryHistory,
  threadId,

  onRegenerate,
  onMessageLongPress,
  textRenderer,
  userTextRenderer,
  assistantTextRenderer,
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

  // Determine if chat is empty (no messages)
  const isEmpty = messages.length === 0;

  // History-load error takes priority over the loading and empty states:
  //   - empty + error → replace the empty state with a retry card so the
  //     user isn't left staring at "How can I help you today?" after a
  //     failed history fetch
  //   - !empty + error → surface a top banner above the message list so the
  //     partial content is still usable and the retry stays out of the way
  const hasHistoryError = !!historyError && !isLoading;

  // Should show loading state (suppressed when a history error takes the
  // empty slot — "loading" and "failed to load" shouldn't both claim it).
  const shouldShowLoading =
    showLoadingState && isLoading && isEmpty && !hasHistoryError;

  // Should show empty state (when not loading, not errored, no messages)
  const shouldShowEmpty =
    showEmptyState && isEmpty && !isLoading && !hasHistoryError;

  // Should show a non-blocking "refreshing" indicator: a reload is in
  // flight but we already have messages to show. The full-screen loading
  // state only fires on empty threads, so without this the UI looks frozen
  // during a reload of a populated thread.
  const shouldShowRefreshing = isLoading && !isEmpty;

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

  // Render history error card (centered when empty, banner when not).
  // Normalize Error → string since AjoraChatErrorMessage accepts
  // `string | AjoraChatError` but useHistory returns raw Error objects.
  const historyErrorMessage =
    historyError instanceof Error ? historyError.message : historyError ?? "";
  const historyErrorNode = hasHistoryError
    ? renderSlot(errorMessage, AjoraChatErrorMessage, {
        message: historyErrorMessage,
        onRetry: onRetryHistory,
      })
    : null;

  const RefreshingIndicator = shouldShowRefreshing ? (
    <View style={styles.refreshingIndicator} pointerEvents="none">
      <ActivityIndicator size="small" color={theme.colors.iconDefault} />
    </View>
  ) : null;

  // Deduplicate messages once for the FlashList path. FlashList requires
  // unique keyExtractor outputs and streaming can briefly emit the same id
  // before settling. Dedup at this level so both `data` and the
  // last-message-content tracking inside `useAutoScroll` see the same array.
  const dedupedMessages = useMemo(() => dedupeMessagesById(messages), [messages]);

  // Single-message renderer used by FlashList. The hook captures the
  // ag-ui custom-message + activity-message render context plus the
  // textRenderer/onRegenerate callbacks. Keeping this as a hook (not a
  // closure inline) lets renderItem stay referentially stable across
  // renders that don't change its deps.
  const renderMessage = useRenderMessage({
    messages: dedupedMessages,
    isRunning,
    onRegenerate,
    onMessageLongPress,
    textRenderer,
    userTextRenderer,
    assistantTextRenderer,
  });

  // Last message drives both the streaming flag and the thinking-indicator
  // gate. `isStreaming` was inlined here from the top of the function so
  // `lastMessage` only gets declared once after dedup.
  const lastMessage = dedupedMessages[dedupedMessages.length - 1];
  const isStreaming =
    isRunning && lastMessage?.role === "assistant" && !!lastMessage.content;

  // Thinking indicator gets lifted out of `AjoraChatMessageView` and into
  // FlashList's footer so it doesn't have to live inside an unvirtualized
  // wrapper. Same conditions as before: running + last message isn't a
  // pending tool call.
  const isToolCall =
    lastMessage?.role === "assistant" &&
    Array.isArray((lastMessage as any).toolCalls) &&
    (lastMessage as any).toolCalls.length > 0;
  const shouldShowThinking =
    showThinkingIndicator && isRunning && !isToolCall;
  const BoundThinkingIndicator = shouldShowThinking
    ? renderSlot(thinkingIndicator, AjoraChatThinkingIndicator, {
        isThinking: true,
      })
    : null;

  // Run-error message (the "agent failed mid-stream" case) — also footer
  // content, after the thinking indicator's slot. `historyError` is a
  // separate concept rendered as a header banner.
  const BoundRunErrorMessage = error
    ? renderSlot(errorMessage, AjoraChatErrorMessage, {
        message: error,
        onRetry: onRetryError,
      })
    : null;

  // Legacy slot for the function-children API path. Kept so consumers that
  // pass a `children` render-fn still receive a `messageView` element.
  // The default rendered output (FlashList) doesn't use this.
  const BoundMessageView = renderSlot(messageView, AjoraChatMessageView, {
    messages,
    isRunning,
    error,
    onRetryError,
    showThinkingIndicator,
    thinkingIndicator,
    errorMessage,

    onRegenerate,
    onMessageLongPress,
    textRenderer,
    userTextRenderer,
    assistantTextRenderer,
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

  // "Load earlier messages" banner — only shown when there are older
  // persisted messages beyond the current page AND we're not in the empty/
  // loading/error states (those replace or override the message list).
  const showLoadEarlier =
    !shouldShowLoading &&
    !shouldShowEmpty &&
    !hasHistoryError &&
    hasEarlierMessages &&
    !!onLoadEarlier;

  const LoadEarlierBanner = showLoadEarlier ? (
    <Pressable
      onPress={isLoadingEarlier ? undefined : onLoadEarlier}
      disabled={isLoadingEarlier}
      style={[
        styles.loadEarlierButton,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: isLoadingEarlier ? 0.6 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Load earlier messages"
    >
      {isLoadingEarlier ? (
        <ActivityIndicator size="small" color={theme.colors.iconDefault} />
      ) : (
        <Text style={[styles.loadEarlierText, { color: theme.colors.text }]}>
          Load earlier messages
        </Text>
      )}
    </Pressable>
  ) : null;

  // History error banner for non-empty threads — rendered above the
  // message list so partial content stays usable.
  const HistoryErrorBanner =
    hasHistoryError && !isEmpty ? (
      <View style={styles.historyErrorBanner}>{historyErrorNode}</View>
    ) : null;

  // Auto-page earlier messages when the user scrolls near the top. Only
  // wire the callback when a page actually exists and no load is in flight
  // — otherwise the edge-trigger would fire `onLoadEarlier` as an empty
  // no-op and silently re-arm on every top visit.
  const autoPageOnTop =
    hasEarlierMessages && !isLoadingEarlier && onLoadEarlier
      ? onLoadEarlier
      : undefined;

  // FlashList header: history-error banner + load-earlier affordance.
  // Wrapped in a Fragment so passing `null` for either branch produces no
  // DOM node — FlashList accepts a single ReactElement here.
  const ListHeader = (
    <>
      {HistoryErrorBanner}
      {LoadEarlierBanner}
    </>
  );

  // FlashList footer: thinking indicator → run-error → suggestions.
  // Order matches the previous DOM order inside `AjoraChatMessageView` so
  // visual behavior is unchanged.
  const ListFooter = (
    <>
      {BoundThinkingIndicator}
      {BoundRunErrorMessage}
      {BoundSuggestionView}
    </>
  );

  // Render the scroll view with auto-scroll capability
  const BoundScrollView = renderSlot(scrollView, AjoraChatScrollView, {
    autoScroll,
    isStreaming,
    messages: dedupedMessages,
    renderMessage,
    listHeaderComponent: ListHeader,
    listFooterComponent: ListFooter,
    scrollToBottomButton: BoundScrollToBottomButton,
    showScrollToBottomButton: true,
    contentContainerStyle: styles.scrollViewContent,
    onScrolledToTop: autoPageOnTop,
    threadId,
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
        {shouldShowLoading ? (
          <View style={styles.loadingContainer}>{BoundLoadingState}</View>
        ) : hasHistoryError && isEmpty ? (
          <View style={styles.loadingContainer}>{historyErrorNode}</View>
        ) : shouldShowEmpty ? (
          // Wrapper must not use alignItems: "center" — would collapse
          // children that rely on width: "100%" to their intrinsic width.
          <View style={styles.emptyStateContainer}>{BoundEmptyState}</View>
        ) : (
          <View style={styles.scrollViewHost}>
            {BoundScrollView}
            {RefreshingIndicator}
          </View>
        )}
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
    paddingBottom: 12,
  },
  animatedContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateContainer: {
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
  loadEarlierButton: {
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 32,
    minWidth: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  loadEarlierText: {
    fontSize: 13,
    fontWeight: "500",
  },
  scrollViewHost: {
    flex: 1,
    position: "relative",
  },
  refreshingIndicator: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  historyErrorBanner: {
    paddingTop: 4,
    paddingBottom: 4,
  },
});

export default AjoraChatView;
