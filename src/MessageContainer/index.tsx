import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Platform,
  LayoutChangeEvent,
  ListRenderItemInfo,
  FlatList,
  CellRendererProps,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Color from "../Color";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes";
import Item from "./components/Item";

import { LoadEarlier } from "../LoadEarlier";
import { IMessage } from "../types";
import ThinkingIndicator from "../ThinkingIndicator";
import { MessageContainerProps, DaysPositions } from "./types";
import { ItemProps } from "./components/Item/types";

import { error, warning } from "../logging";
import stylesCommon from "../styles";
import styles from "./styles";
import { isSameDay } from "../utils";
import { MaterialIcons } from "@expo/vector-icons";
import { useChatContext } from "../AjoraContext";

export * from "./types";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

function MessageContainer<TMessage extends IMessage = IMessage>(
  props: MessageContainerProps<TMessage>
) {
  const {
    renderChatEmpty: renderChatEmptyProp,
    onLoadEarlier,
    loadEarlier = false,
    listViewProps,
    invertibleScrollViewProps,
    extraData = null,
    isScrollToBottomEnabled = false,
    scrollToBottomOffset = 200,
    alignTop = false,
    scrollToBottomStyle,
    infiniteScroll = false,
    isLoadingEarlier = false,
    renderThinkingIndicator: renderThinkingIndicatorProp,
    renderFooter: renderFooterProp,
    renderLoadEarlier: renderLoadEarlierProp,
    forwardRef,
    handleOnScroll: handleOnScrollProp,
    scrollToBottomComponent: scrollToBottomComponentProp,
    renderDay: renderDayProp,
    renderSuggestedQuestions,
    onSend,
  } = props;

  // Ajora context
  const { ajora } = useChatContext();
  const {
    activeThreadId,
    messagesByThread,
    submitQuery,
    isLoadingMessages,
    isThinking,
  } = ajora;

  // Role
  const scrollToBottomOpacity = useSharedValue(0);
  const [isScrollToBottomVisible, setIsScrollToBottomVisible] = useState(false);
  const scrollToBottomStyleAnim = useAnimatedStyle(
    () => ({
      opacity: scrollToBottomOpacity.value,
    }),
    [scrollToBottomOpacity]
  );

  const daysPositions = useSharedValue<DaysPositions>({});
  const listHeight = useSharedValue(0);
  const scrolledY = useSharedValue(0);

  const renderThinkingIndicator = useCallback(() => {
    if (renderThinkingIndicatorProp) return renderThinkingIndicatorProp();

    return <ThinkingIndicator isThinking={isThinking} />;
  }, [isThinking, renderThinkingIndicatorProp]);

  const ListFooterComponent = useMemo(() => {
    if (renderFooterProp) return renderFooterProp(props);

    return renderThinkingIndicator();
  }, [renderFooterProp, renderThinkingIndicator, props]);

  const renderLoadEarlier = useCallback(() => {
    if (loadEarlier) {
      if (renderLoadEarlierProp) return renderLoadEarlierProp(props);

      return <LoadEarlier {...props} />;
    }

    return null;
  }, [loadEarlier, renderLoadEarlierProp, props]);

  const scrollTo = useCallback(
    (
      options: { animated?: boolean; offset: number } = {
        animated: true,
        offset: 0,
      }
    ) => {
      if (forwardRef?.current && options)
        forwardRef.current.scrollToOffset(options);
    },
    [forwardRef]
  );

  // const doScrollToBottom = useCallback(
  //   (animated: boolean = true) => {
  //     scrollTo({ offset: 0, animated });
  //   },
  //   [scrollTo]
  // );

  const handleOnScroll = useCallback(
    (event: ReanimatedScrollEvent) => {
      handleOnScrollProp?.(event);

      const {
        contentOffset: { y: contentOffsetY },
        contentSize: { height: contentSizeHeight },
        layoutMeasurement: { height: layoutMeasurementHeight },
      } = event;

      const duration = 250;

      const makeScrollToBottomVisible = () => {
        setIsScrollToBottomVisible(true);
        scrollToBottomOpacity.value = withTiming(1, { duration });
      };

      const makeScrollToBottomHidden = () => {
        scrollToBottomOpacity.value = withTiming(
          0,
          { duration },
          (isFinished) => {
            if (isFinished) runOnJS(setIsScrollToBottomVisible)(false);
          }
        );
      };

      if (contentOffsetY > scrollToBottomOffset!) makeScrollToBottomVisible();
      else makeScrollToBottomHidden();
    },
    [handleOnScrollProp, scrollToBottomOffset, scrollToBottomOpacity]
  );

  const renderItem = useCallback(
    ({
      item,
      index,
    }: ListRenderItemInfo<unknown>): React.ReactElement | null => {
      const messageItem = item as TMessage;

      if (!messageItem._id)
        error("Ajora: `_id` is missing for message", JSON.stringify(item));

      if (!messageItem.role) {
        error(
          "Ajora: `role` is missing for message",
          JSON.stringify(messageItem)
        );
      }

      const { ...restProps } = props;

      if (messagesByThread) {
        const previousMessage = messagesByThread[index + 1] || {};
        const nextMessage = messagesByThread[index - 1] || {};

        const messageProps: ItemProps<TMessage> = {
          ...restProps,
          currentMessage: messageItem,
          previousMessage: previousMessage as TMessage,
          nextMessage: nextMessage as TMessage,
          position: messageItem.role === "user" ? "right" : "left",
          scrolledY,
          daysPositions,
          listHeight,
        };

        return <Item<TMessage> {...messageProps} />;
      }

      return (
        <View style={styles.emptyChatContainer}>
          <View style={styles.emptyChatContainerInverted}>
            <MaterialIcons
              name="chat-bubble-outline"
              size={70}
              color={Color.gray500}
              style={styles.emptyChatIcon}
            />
            <Text style={styles.emptyChatTitle}>
              No messages found in this thread
            </Text>
          </View>
        </View>
      );
    },
    [props, scrolledY, daysPositions, listHeight]
  );

  const renderChatEmpty = useCallback(() => {
    if (isLoadingMessages) {
      return (
        <View
          style={[styles.emptyChatContainer, styles.emptyChatContainerInverted]}
        >
          <View style={styles.emptyChatContent}>
            <ActivityIndicator size="small" color={Color.gray500} />
            <Text style={[styles.emptyChatSubtitle, { marginTop: 8 }]}>
              Loading messages…
            </Text>
          </View>
        </View>
      );
    }
    if (renderSuggestedQuestions) return renderSuggestedQuestions();

    const suggestedQuestions: {
      title: string;
      question: string;
      icon?: keyof typeof MaterialIcons.glyphMap;
    }[] = [
      {
        title: "Get started",
        question: "Where is Ajora Falls located?",
        icon: "water",
      },
      {
        title: "Philosophy",
        question: "What is the chief end of life?",
        icon: "public",
      },
      {
        title: "Democracy",
        question: "Famous quote from the Declaration of Independence",
        icon: "history",
      },
      {
        title: "Science",
        question: "How is the speed of light measured?",
        icon: "science",
      },
    ];

    const handleQuestionPress = (questionItem: {
      title: string;
      question: string;
      icon?: string;
    }) => {
      const newMessage: IMessage = {
        _id: Math.round(Math.random() * 1000000).toString(),
        role: "user",
        thread_id: activeThreadId || "",
        parts: [{ text: questionItem.question }],
        createdAt: new Date().toISOString(),
      };

      if (onSend) {
        onSend([newMessage], true);
      } else {
        warning("[MessageContainer]: `onSend` is not provided");
      }
    };

    if (renderChatEmptyProp)
      return (
        <View
          style={[styles.emptyChatContainer, styles.emptyChatContainerInverted]}
        >
          {renderChatEmptyProp()}
        </View>
      );

    return (
      <View
        style={[styles.emptyChatContainer, styles.emptyChatContainerInverted]}
      >
        <View style={styles.emptyChatContent}>
          <MaterialIcons
            name="chat-bubble-outline"
            size={70}
            color={Color.gray500}
            style={styles.emptyChatIcon}
          />
          <Text style={styles.emptyChatTitle}>Welcome to Ajora!</Text>
          <Text style={styles.emptyChatSubtitle}>
            Start a conversation by typing a message or select a topic below
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {suggestedQuestions.map((questionItem, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestedQuestionCard}
              onPress={() => handleQuestionPress(questionItem)}
              activeOpacity={0.7}
            >
              {questionItem.icon ? (
                <MaterialIcons
                  name={questionItem.icon as any}
                  size={24}
                  color={Color.gray500}
                  style={{ marginBottom: 6 }}
                />
              ) : null}
              <Text style={styles.suggestedQuestionTitle}>
                {questionItem.title}
              </Text>
              <Text style={styles.suggestedQuestionText}>
                {questionItem.question}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }, [
    activeThreadId,
    submitQuery,
    onSend,
    renderChatEmptyProp,
    messagesByThread,
    isLoadingMessages,
  ]);

  const ListHeaderComponent = useMemo(() => {
    const content = renderLoadEarlier();

    if (!content) return null;

    return <View style={stylesCommon.fill}>{content}</View>;
  }, [renderLoadEarlier]);

  const renderScrollBottomComponent = useCallback(() => {
    if (scrollToBottomComponentProp) return scrollToBottomComponentProp();

    return (
      <MaterialIcons
        name="arrow-downward"
        size={24}
        style={styles.scrollToBottomIcon}
        color={Color.gray500}
      />
    );
  }, [scrollToBottomComponentProp]);

  const renderScrollToBottomWrapper = useCallback(() => {
    if (!isScrollToBottomVisible) return null;

    return (
      <TouchableOpacity onPress={() => scrollTo()}>
        <Animated.View
          style={[
            stylesCommon.centerItems,
            styles.scrollToBottomStyle,
            scrollToBottomStyle,
            scrollToBottomStyleAnim,
          ]}
        >
          {renderScrollBottomComponent()}
        </Animated.View>
      </TouchableOpacity>
    );
  }, [
    scrollToBottomStyle,
    renderScrollBottomComponent,
    scrollTo,
    scrollToBottomStyleAnim,
    isScrollToBottomVisible,
  ]);

  const onLayoutList = useCallback(
    (event: LayoutChangeEvent) => {
      listHeight.value = event.nativeEvent.layout.height;

      // Always scroll to bottom when messages are loaded
      if (activeThreadId)
        setTimeout(() => {
          scrollTo({ animated: false, offset: 0 });
        }, 500);

      listViewProps?.onLayout?.(event);
    },
    [activeThreadId, scrollTo, listHeight, listViewProps]
  );

  const onEndReached = useCallback(() => {
    if (
      infiniteScroll &&
      loadEarlier &&
      onLoadEarlier &&
      !isLoadingEarlier &&
      Platform.OS !== "web"
    )
      onLoadEarlier();
  }, [infiniteScroll, loadEarlier, onLoadEarlier, isLoadingEarlier]);

  const keyExtractor = useCallback(
    (item: IMessage, _index: number) => item._id.toString(),
    []
  );

  const renderCell = useCallback(
    (props: CellRendererProps<IMessage>) => {
      const handleOnLayout = (event: LayoutChangeEvent) => {
        props.onLayout?.(event);

        const { y, height } = event.nativeEvent.layout;

        const newValue = {
          y,
          height,
          createdAt: new Date(props.item.createdAt || new Date()).getTime(),
        };

        daysPositions.modify((value) => {
          "worklet";

          const isSameDay = (date1: number, date2: number) => {
            const d1 = new Date(date1);
            const d2 = new Date(date2);

            return (
              d1.getDate() === d2.getDate() &&
              d1.getMonth() === d2.getMonth() &&
              d1.getFullYear() === d2.getFullYear()
            );
          };

          for (const [key, item] of Object.entries(value))
            if (
              isSameDay(newValue.createdAt, item.createdAt) &&
              item.y <= newValue.y
            ) {
              delete value[key];
              break;
            }

          // @ts-expect-error: https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue#remarks
          value[props.item._id] = newValue;
          return value;
        });
      };

      return (
        <View {...props} onLayout={handleOnLayout}>
          {props.children}
        </View>
      );
    },
    [daysPositions]
  );

  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        scrolledY.value = event.contentOffset.y;

        runOnJS(handleOnScroll)(event);
      },
    },
    [handleOnScroll]
  );

  // removes unrendered days positions when messages are added/removed
  useEffect(() => {
    Object.keys(daysPositions.value).forEach((key) => {
      const messageIndex = messagesByThread.findIndex(
        (m) => m._id.toString() === key
      );
      let shouldRemove = messageIndex === -1;

      if (!shouldRemove) {
        const prevMessage = messagesByThread[messageIndex + 1];
        const message = messagesByThread[messageIndex];
        shouldRemove = !!prevMessage && isSameDay(message, prevMessage);
      }

      if (shouldRemove)
        daysPositions.modify((value) => {
          "worklet";

          delete value[key];
          return value;
        });
    });
  }, [messagesByThread, daysPositions]);

  return (
    <View
      style={[
        styles.contentContainerStyle,
        alignTop ? styles.containerAlignTop : stylesCommon.fill,
      ]}
    >
      <AnimatedFlatList
        extraData={extraData}
        ref={forwardRef as React.Ref<FlatList<unknown>>}
        keyExtractor={keyExtractor}
        data={messagesByThread}
        renderItem={renderItem}
        inverted={true}
        automaticallyAdjustContentInsets={false}
        style={stylesCommon.fill}
        {...(invertibleScrollViewProps as any)}
        ListEmptyComponent={renderChatEmpty}
        ListFooterComponent={ListHeaderComponent}
        ListHeaderComponent={ListFooterComponent}
        onScroll={scrollHandler}
        scrollEventThrottle={1}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        {...listViewProps}
        onLayout={onLayoutList}
        CellRendererComponent={renderCell as any}
      />
      {isScrollToBottomEnabled ? renderScrollToBottomWrapper() : null}
    </View>
  );
}

export default MessageContainer;
