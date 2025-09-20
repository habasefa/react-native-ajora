import React from "react";
import { StyleProp, ViewStyle, TextStyle } from "react-native";
import { MessageTextProps } from "../MessageText";
import { MessageImageProps } from "../MessageImage";
import {
  IMessage,
  LeftRightStyle,
  Omit,
  MessageVideoProps,
  MessageAudioProps,
} from "../types";
import { MessageFileProps } from "../MessageFile";

/* eslint-disable no-use-before-define */
export type RenderMessageImageProps<TMessage extends IMessage> = Omit<
  BubbleProps<TMessage>,
  "containerStyle" | "wrapperStyle"
> &
  MessageImageProps<TMessage>;

export type RenderMessageVideoProps<TMessage extends IMessage> = Omit<
  BubbleProps<TMessage>,
  "containerStyle" | "wrapperStyle"
> &
  MessageVideoProps<TMessage>;

export type RenderMessageAudioProps<TMessage extends IMessage> = Omit<
  BubbleProps<TMessage>,
  "containerStyle" | "wrapperStyle"
> &
  MessageAudioProps<TMessage>;

export type RenderMessageTextProps<TMessage extends IMessage> = Omit<
  BubbleProps<TMessage>,
  "containerStyle" | "wrapperStyle"
> &
  MessageTextProps<TMessage>;

export type RenderMessageFileProps<TMessage extends IMessage> = Omit<
  BubbleProps<TMessage>,
  "containerStyle" | "wrapperStyle"
> &
  MessageFileProps<TMessage>;
/* eslint-enable no-use-before-define */

export interface BubbleProps<TMessage extends IMessage> {
  touchableProps?: object;
  renderUsernameOnMessage?: boolean;
  isCustomViewBottom?: boolean;
  position: "left" | "right";
  currentMessage: TMessage;
  nextMessage?: TMessage;
  previousMessage?: TMessage;
  optionTitles?: string[];
  containerStyle?: LeftRightStyle<ViewStyle>;
  wrapperStyle?: LeftRightStyle<ViewStyle>;
  textStyle?: LeftRightStyle<TextStyle>;
  bottomContainerStyle?: LeftRightStyle<ViewStyle>;
  tickStyle?: StyleProp<TextStyle>;
  containerToNextStyle?: LeftRightStyle<ViewStyle>;
  containerToPreviousStyle?: LeftRightStyle<ViewStyle>;
  usernameStyle?: TextStyle;
  quickReplyStyle?: StyleProp<ViewStyle>;
  quickReplyTextStyle?: StyleProp<TextStyle>;
  quickReplyContainerStyle?: StyleProp<ViewStyle>;
  onPress?(context?: unknown, message?: unknown): void;
  onLongPress?(context?: unknown, message?: unknown): void;
  renderMessageImage?(
    props: RenderMessageImageProps<TMessage>
  ): React.ReactNode;

  renderMessageAudio?(
    props: RenderMessageAudioProps<TMessage>
  ): React.ReactNode;
  renderMessageFile?(props: RenderMessageFileProps<TMessage>): React.ReactNode;
  renderMessageText?(props: RenderMessageTextProps<TMessage>): React.ReactNode;
  renderMessageToolCall?(props: any): React.ReactNode;
  renderTools?(): any[];
  renderTicks?(currentMessage: TMessage): React.ReactNode;
}
