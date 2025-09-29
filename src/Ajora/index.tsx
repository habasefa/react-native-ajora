import React, {
  createRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  RefObject,
} from "react";
import {
  ActionSheetProvider,
  ActionSheetProviderRef,
} from "@expo/react-native-action-sheet";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Platform, TextInput, View, LayoutChangeEvent } from "react-native";
import { Actions } from "../Actions";
import Bubble from "../Bubble";
import { Composer } from "../Composer";
import { MAX_COMPOSER_HEIGHT, MIN_COMPOSER_HEIGHT, TEST_ID } from "../Constant";
import { AjoraContext, useChatContext } from "../AjoraContext";
import { Header } from "../Header";
import { LoadEarlier } from "../LoadEarlier";
import Message from "../Message";
import MessageContainer, { AnimatedList } from "../MessageContainer";
import { MessageImage } from "../MessageImage";
import { MessageText } from "../MessageText";
import { Thread } from "../Thread";
import type { Thread as ThreadType } from "../Thread/types";
import { IMessage } from "../types";
import { Send } from "../Send";
import * as utils from "../utils";
import Animated, {
  useAnimatedStyle,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import {
  KeyboardProvider,
  useReanimatedKeyboardAnimation,
} from "react-native-keyboard-controller";
import { AjoraProps } from "./types";

import stylesCommon from "../styles";
import styles from "./styles";
import { InputToolbar } from "../InputToolbar";

dayjs.extend(localizedFormat);

function Ajora<TMessage extends IMessage = IMessage>(
  props: AjoraProps<TMessage>
) {
  const {
    initialText = "",

    // "random" function from here: https://stackoverflow.com/a/8084248/3452513
    // we do not use uuid since it would add extra native dependency (https://www.npmjs.com/package/react-native-get-random-values)
    // lib's user can decide which algorithm to use and pass it as a prop
    messageIdGenerator = () => (Math.random() + 1).toString(36).substring(7),

    role = "user",
    onSend,
    locale = "en",
    renderLoading,
    actionSheet = null,
    textInputProps,
    renderChatFooter = null,
    renderInputToolbar = null,
    bottomOffset = 0,
    focusOnInputWhenOpeningKeyboard = true,
    keyboardShouldPersistTaps = Platform.select({
      ios: "never",
      android: "always",
      default: "never",
    }),
    onInputTextChanged = null,
    maxInputLength = null,
    minComposerHeight = MIN_COMPOSER_HEIGHT,
    maxComposerHeight = MAX_COMPOSER_HEIGHT,
    isKeyboardInternallyHandled = true,

    // Header and Thread props
    showHeader = true,
    headerProps = {},
    showThreads = true,
    threadProps = {},
    onThreadSelect,
    onNewThread,
    onHeaderMenuPress,
    onHeaderPlusPress,
    onPressActionButton,
  } = props;

  const { ajora } = useChatContext();
  const { activeThreadId, threads, addNewThread, switchThread, submitQuery } =
    ajora;

  const currentThread = threads.find((thread) => thread.id === activeThreadId);

  const actionSheetRef = useRef<ActionSheetProviderRef>(null);

  const messageContainerRef = useMemo(
    () => props.messageContainerRef || createRef<AnimatedList<TMessage>>(),
    [props.messageContainerRef]
  ) as RefObject<AnimatedList<TMessage>>;

  const textInputRef = useMemo(
    () => props.textInputRef || createRef<TextInput>(),
    [props.textInputRef]
  );

  const isTextInputWasFocused: RefObject<boolean> = useRef(false);

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [composerHeight, setComposerHeight] = useState<number>(
    minComposerHeight!
  );
  const [text, setText] = useState<string | undefined>(() => props.text || "");
  const [isThinkingDisabled, setIsThinkingDisabled] = useState<boolean>(false);
  const [isThreadDrawerOpen, setIsThreadDrawerOpen] = useState<boolean>(false);

  const keyboard = useReanimatedKeyboardAnimation();
  const trackingKeyboardMovement = useSharedValue(false);
  const debounceEnableThinkingTimeoutId =
    useRef<ReturnType<typeof setTimeout>>(undefined);
  const keyboardOffsetBottom = useSharedValue(0);

  const contentStyleAnim = useAnimatedStyle(
    () => ({
      transform: [
        { translateY: keyboard.height.value - keyboardOffsetBottom.value },
      ],
    }),
    [keyboard, keyboardOffsetBottom]
  );

  const getTextFromProp = useCallback(
    (fallback: string) => {
      if (props.text === undefined) return fallback;

      return props.text;
    },
    [props.text]
  );

  /**
   * Store text input focus status when keyboard hide to retrieve
   * it afterwards if needed.
   * `onKeyboardWillHide` may be called twice in sequence so we
   * make a guard condition (eg. showing image picker)
   */
  const handleTextInputFocusWhenKeyboardHide = useCallback(() => {
    if (!isTextInputWasFocused.current)
      isTextInputWasFocused.current =
        textInputRef.current?.isFocused() || false;
  }, [textInputRef]);

  /**
   * Refocus the text input only if it was focused before showing keyboard.
   * This is needed in some cases (eg. showing image picker).
   */
  const handleTextInputFocusWhenKeyboardShow = useCallback(() => {
    if (
      textInputRef.current &&
      isTextInputWasFocused.current &&
      !textInputRef.current.isFocused()
    )
      textInputRef.current.focus();

    // Reset the indicator since the keyboard is shown
    isTextInputWasFocused.current = false;
  }, [textInputRef]);

  const disableThinking = useCallback(() => {
    clearTimeout(debounceEnableThinkingTimeoutId.current);
    setIsThinkingDisabled(true);
  }, []);

  const enableThinking = useCallback(() => {
    clearTimeout(debounceEnableThinkingTimeoutId.current);
    setIsThinkingDisabled(false);
  }, []);

  const debounceEnableThinking = useCallback(() => {
    clearTimeout(debounceEnableThinkingTimeoutId.current);
    debounceEnableThinkingTimeoutId.current = setTimeout(() => {
      enableThinking();
    }, 50);
  }, [enableThinking]);

  const scrollToBottom = useCallback(
    (isAnimated = true) => {
      if (!messageContainerRef?.current) return;

      messageContainerRef.current.scrollToOffset({
        offset: 0,
        animated: isAnimated,
      });
      return;
    },
    [messageContainerRef]
  );

  // Header and Thread handlers
  const handleHeaderMenuPress = useCallback(() => {
    if (showThreads) {
      setIsThreadDrawerOpen(true);
    }
    if (onHeaderMenuPress) {
      onHeaderMenuPress();
    }
  }, [showThreads, onHeaderMenuPress]);

  const handleHeaderPlusPress = useCallback(() => {
    if (onHeaderPlusPress) {
      onHeaderPlusPress();
    } else {
      addNewThread();
    }
  }, [onHeaderPlusPress, addNewThread]);

  const handleThreadSelect = useCallback(
    (thread: ThreadType) => {
      setIsThreadDrawerOpen(false);

      if (onThreadSelect) {
        onThreadSelect(thread);
      } else {
        switchThread(thread.id);
      }
    },
    [onThreadSelect, switchThread]
  );

  const handleNewThread = useCallback(() => {
    setIsThreadDrawerOpen(false);
    if (onNewThread) {
      onNewThread();
    } else {
      addNewThread();
    }
  }, [onNewThread, addNewThread]);

  const notifyInputTextReset = useCallback(() => {
    onInputTextChanged?.("");
  }, [onInputTextChanged]);

  const resetInputToolbar = useCallback(() => {
    textInputRef.current?.clear();

    notifyInputTextReset();

    setComposerHeight(minComposerHeight!);
    setText(getTextFromProp(""));
    enableThinking();
  }, [
    minComposerHeight,
    getTextFromProp,
    textInputRef,
    notifyInputTextReset,
    enableThinking,
  ]);

  const _onSend = useCallback(
    (messages: TMessage[] = [], shouldResetInputToolbar = false) => {
      if (!Array.isArray(messages)) messages = [messages];

      const newMessages: TMessage[] = messages.map((message) => {
        return {
          ...message,
          role: "user",
          createdAt: new Date(),
          _id: messageIdGenerator?.(),
        };
      });

      if (shouldResetInputToolbar === true) {
        disableThinking();

        resetInputToolbar();
      }

      // Send the message to the server
      if (newMessages.length > 0) {
        submitQuery({
          type: "text",
          message: newMessages[0],
        });
      }

      onSend?.(newMessages);

      setTimeout(() => scrollToBottom(), 10);
    },
    [
      messageIdGenerator,
      onSend,
      role,
      resetInputToolbar,
      disableThinking,
      scrollToBottom,
      submitQuery,
      activeThreadId,
    ]
  );

  const handleMessageContainerSend = useCallback(
    (messages: IMessage | IMessage[], shouldResetInputToolbar?: boolean) => {
      const messageArray = Array.isArray(messages) ? messages : [messages];
      _onSend(messageArray as TMessage[], shouldResetInputToolbar);
    },
    [_onSend]
  );

  const renderMessages = useMemo(() => {
    if (!isInitialized) return null;

    const { messagesContainerStyle, ...messagesContainerProps } = props;

    return (
      <View style={[stylesCommon.fill, messagesContainerStyle]}>
        {showHeader && (
          <Header
            onMenuPress={handleHeaderMenuPress}
            onPlusPress={handleHeaderPlusPress}
            {...headerProps}
          />
        )}
        <MessageContainer<TMessage>
          {...messagesContainerProps}
          invertibleScrollViewProps={{
            keyboardShouldPersistTaps,
          }}
          forwardRef={messageContainerRef}
          onSend={handleMessageContainerSend}
        />
        {renderChatFooter?.()}
      </View>
    );
  }, [
    isInitialized,
    ajora.isThinking,
    props,
    keyboardShouldPersistTaps,
    messageContainerRef,
    renderChatFooter,
    showHeader,
    currentThread,
    handleHeaderMenuPress,
    handleHeaderPlusPress,
    headerProps,
    handleMessageContainerSend,
  ]);

  const onInputSizeChanged = useCallback(
    (size: { height: number }) => {
      const newComposerHeight = Math.max(
        minComposerHeight!,
        Math.min(maxComposerHeight!, size.height)
      );

      setComposerHeight(newComposerHeight);
    },
    [maxComposerHeight, minComposerHeight]
  );

  const _onInputTextChanged = useCallback(
    (_text: string) => {
      if (isThinkingDisabled) return;

      onInputTextChanged?.(_text);

      // Only set state if it's not being overridden by a prop.
      if (props.text === undefined) setText(_text);
    },
    [onInputTextChanged, isThinkingDisabled, props.text]
  );

  const onInitialLayoutViewLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (isInitialized) return;

      const { layout } = e.nativeEvent;

      if (layout.height <= 0) return;

      notifyInputTextReset();

      setIsInitialized(true);
      setComposerHeight(minComposerHeight!);
      setText(getTextFromProp(initialText));
    },
    [
      isInitialized,
      initialText,
      minComposerHeight,
      notifyInputTextReset,
      getTextFromProp,
    ]
  );

  const inputToolbarFragment = useMemo(() => {
    if (!isInitialized) return null;

    const inputToolbarProps = {
      ...props,
      text: getTextFromProp(text!),
      composerHeight: Math.max(minComposerHeight!, composerHeight),
      onSend: _onSend,
      onInputSizeChanged,
      onTextChanged: _onInputTextChanged,
      textInputProps: {
        ...textInputProps,
        ref: textInputRef,
        maxLength: isThinkingDisabled ? 0 : maxInputLength,
      },
    };

    if (renderInputToolbar) return renderInputToolbar(inputToolbarProps);

    return <InputToolbar {...inputToolbarProps} />;
  }, [
    isInitialized,
    _onSend,
    getTextFromProp,
    maxInputLength,
    minComposerHeight,
    onInputSizeChanged,
    props,
    text,
    renderInputToolbar,
    composerHeight,
    isThinkingDisabled,
    textInputRef,
    textInputProps,
    _onInputTextChanged,
  ]);

  const contextValues = useMemo(
    () => ({
      actionSheet:
        actionSheet ||
        (() => ({
          showActionSheetWithOptions:
            actionSheetRef.current!.showActionSheetWithOptions,
        })),
      getLocale: () => locale,
      ajora,
    }),
    [actionSheet, locale, ajora]
  );

  useEffect(() => {
    if (props.text != null) setText(props.text);
  }, [props.text]);

  useAnimatedReaction(
    () => -keyboard.height.value,
    (value, prevValue) => {
      if (prevValue !== null && value !== prevValue) {
        const isKeyboardMovingUp = value > prevValue;
        if (isKeyboardMovingUp !== trackingKeyboardMovement.value) {
          trackingKeyboardMovement.value = isKeyboardMovingUp;
          keyboardOffsetBottom.value = withTiming(
            isKeyboardMovingUp ? bottomOffset : 0,
            {
              // If `bottomOffset` exists, we change the duration to a smaller value to fix the delay in the keyboard animation speed
              duration: bottomOffset ? 150 : 400,
            }
          );

          if (focusOnInputWhenOpeningKeyboard)
            if (isKeyboardMovingUp)
              runOnJS(handleTextInputFocusWhenKeyboardShow)();
            else runOnJS(handleTextInputFocusWhenKeyboardHide)();

          if (value === 0) {
            runOnJS(enableThinking)();
          } else {
            runOnJS(disableThinking)();
            runOnJS(debounceEnableThinking)();
          }
        }
      }
    },
    [
      keyboard,
      trackingKeyboardMovement,
      focusOnInputWhenOpeningKeyboard,
      handleTextInputFocusWhenKeyboardHide,
      handleTextInputFocusWhenKeyboardShow,
      enableThinking,
      disableThinking,
      debounceEnableThinking,
      bottomOffset,
    ]
  );

  return (
    <AjoraContext.Provider value={contextValues}>
      <ActionSheetProvider ref={actionSheetRef}>
        <View style={stylesCommon.fill}>
          <View
            testID={TEST_ID.WRAPPER}
            style={[stylesCommon.fill, styles.contentContainer]}
            onLayout={onInitialLayoutViewLayout}
          >
            {isInitialized ? (
              <Animated.View
                style={[
                  stylesCommon.fill,
                  isKeyboardInternallyHandled && contentStyleAnim,
                ]}
              >
                {renderMessages}
                {inputToolbarFragment}
              </Animated.View>
            ) : (
              renderLoading?.()
            )}
          </View>
          {showThreads && (
            <Thread
              isOpen={isThreadDrawerOpen}
              onClose={() => setIsThreadDrawerOpen(false)}
              onThreadSelect={handleThreadSelect}
              onNewThread={handleNewThread}
              {...threadProps}
            />
          )}
        </View>
      </ActionSheetProvider>
    </AjoraContext.Provider>
  );
}

function AjoraWrapper<TMessage extends IMessage = IMessage>(
  props: AjoraProps<TMessage>
) {
  return (
    <KeyboardProvider>
      <Ajora<TMessage> {...props} />
    </KeyboardProvider>
  );
}

AjoraWrapper.append = <TMessage extends IMessage>(
  currentMessages: TMessage[] = [],
  messages: TMessage[]
) => {
  if (!Array.isArray(messages)) messages = [messages];

  return messages.concat(currentMessages);
};

AjoraWrapper.prepend = <TMessage extends IMessage>(
  currentMessages: TMessage[] = [],
  messages: TMessage[]
) => {
  if (!Array.isArray(messages)) messages = [messages];

  return currentMessages.concat(messages);
};

export * from "../types";

export {
  AjoraWrapper as Ajora,
  Actions,
  Bubble,
  MessageImage,
  MessageText,
  Composer,
  InputToolbar,
  LoadEarlier,
  Message,
  MessageContainer,
  Send,
  utils,
};
