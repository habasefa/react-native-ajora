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
import { LoadEarlier } from "../LoadEarlier";
import Message from "../Message";
import MessageContainer, { AnimatedList } from "../MessageContainer";
import { MessageImage } from "../MessageImage";
import { MessageText } from "../MessageText";
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
declare const setTimeout: (
  handler: (...args: any[]) => void,
  timeout?: number
) => any;
declare const clearTimeout: (handle?: any) => void;

function Ajora<TMessage extends IMessage = IMessage>(
  props: AjoraProps<TMessage>
) {
  const {
    initialText = "",
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
  } = props;

  const { ajora } = useChatContext();
  const { submitQuery, clearAttachement } = ajora;

  const actionSheetRef = useRef<ActionSheetProviderRef>(null);

  const messageContainerRef = useMemo(
    () => props.messageContainerRef || createRef<AnimatedList<TMessage>>(),
    [props.messageContainerRef]
  ) as RefObject<AnimatedList<TMessage>>;

  const textInputRef = useMemo(
    () => props.textInputRef || createRef<TextInput>(),
    [props.textInputRef]
  );

  const isTextInputWasFocused = useRef(false);

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [composerHeight, setComposerHeight] = useState<number>(
    minComposerHeight!
  );
  const [text, setText] = useState<string | undefined>(() => props.text || "");
  const [isThinkingDisabled, setIsThinkingDisabled] = useState<boolean>(false);

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
        textInputRef.current?.isFocused?.() || false;
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

  const notifyInputTextReset = useCallback(() => {
    onInputTextChanged?.("");
  }, [onInputTextChanged]);

  const resetInputToolbar = useCallback(() => {
    textInputRef.current?.clear();

    notifyInputTextReset();

    clearAttachement();

    setComposerHeight(minComposerHeight!);
    setText(getTextFromProp(""));
    enableThinking();
  }, [
    minComposerHeight,
    getTextFromProp,
    textInputRef,
    notifyInputTextReset,
    enableThinking,
    clearAttachement,
  ]);

  const _onSend = useCallback(
    (
      messages: IMessage | IMessage[] = [],
      shouldResetInputToolbar: boolean = false
    ) => {
      if (shouldResetInputToolbar === true) {
        disableThinking();
        resetInputToolbar();
      }

      // Normalize messages to array
      const messagesArray = Array.isArray(messages) ? messages : [messages];

      // Send the message to the server
      if (messagesArray.length > 0) {
        submitQuery({
          type: "text",
          message: messagesArray[0],
        });
      }

      onSend?.(messagesArray as TMessage[]);

      setTimeout(() => scrollToBottom(), 10);
    },
    [onSend, resetInputToolbar, disableThinking, scrollToBottom, submitQuery]
  );

  const renderMessages = useMemo(() => {
    if (!isInitialized) return null;

    const { messagesContainerStyle, ...messagesContainerProps } = props;

    return (
      <View style={[stylesCommon.fill, messagesContainerStyle]}>
        <MessageContainer<TMessage>
          {...messagesContainerProps}
          invertibleScrollViewProps={{
            keyboardShouldPersistTaps,
          }}
          forwardRef={messageContainerRef}
          onSend={_onSend}
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
    _onSend,
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
    (value: number, prevValue: number) => {
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
