import { StyleProp, ViewStyle } from "react-native";
import { LightboxProps } from "react-native-lightbox-v2";

export { ActionsProps } from "./Actions";
export {
  BubbleProps,
  RenderMessageImageProps,
  RenderMessageVideoProps,
  RenderMessageAudioProps,
  RenderMessageTextProps,
} from "./Bubble";
export { ComposerProps } from "./Composer";
export { DayProps } from "./Day";
export { HeaderProps } from "./Header";
export { InputToolbarProps } from "./InputToolbar";
export { LoadEarlierProps } from "./LoadEarlier";
export { ThreadProps, ThreadItem } from "./Thread";
export { MessageProps } from "./Message";
export { MessageContainerProps } from "./MessageContainer";
export { MessageImageProps } from "./MessageImage";
export { MessageTextProps } from "./MessageText";
export { SendProps } from "./Send";

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

export interface LeftRightStyle<T> {
  left?: StyleProp<T>;
  right?: StyleProp<T>;
}

export interface IMessage {
  _id: string | number;
  role: "user" | "model";
  parts: Part[];

  // Detail
  feedback?: "like" | "dislike";
  createdAt: Date | number;
  pending?: boolean;
}

/** A function call. */
export interface FunctionCall {
  id?: string;
  args?: Record<string, unknown>;
  name?: string;
  response?: any; // Response data when merged with functionResponse
}

/** A function response. */
export interface FunctionResponse {
  id?: string;
  name?: string;
  response?: Record<string, unknown>;
}
export interface Part {
  thought?: boolean;
  functionCall?: FunctionCall;
  functionResponse?: FunctionResponse;
  text?: string;

  // Additional properties
  audio?: {
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
  };
  image?: string;
  file?: {
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
  };
}

export type IChatMessage = IMessage;

export interface MessageVideoProps<TMessage extends IMessage> {
  currentMessage: TMessage;
  containerStyle?: StyleProp<ViewStyle>;
  videoStyle?: StyleProp<ViewStyle>;
  videoProps?: object;
  lightboxProps?: LightboxProps;
}

export interface MessageAudioProps<TMessage extends IMessage> {
  currentMessage: TMessage;
  containerStyle?: StyleProp<ViewStyle>;
  audioStyle?: StyleProp<ViewStyle>;
  audioProps?: object;
}
