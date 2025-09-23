import { ViewStyle, LayoutChangeEvent } from "react-native";
import { DayProps } from "../Day";
import { IMessage, LeftRightStyle } from "../types";
import { BubbleProps } from "../Bubble";
import { MessageActionsProps } from "../MessageActions";

export interface MessageProps<TMessage extends IMessage> {
  showUserAvatar?: boolean;
  position: "left" | "right";
  currentMessage: TMessage;
  nextMessage?: TMessage;
  previousMessage?: TMessage;
  containerStyle?: LeftRightStyle<ViewStyle>;
  renderBubble?(props: BubbleProps<TMessage>): React.ReactNode;
  renderMessageActions?(props: MessageActionsProps): React.ReactNode;
  renderDay?(props: DayProps): React.ReactNode;
  tools?(): any[];
  shouldUpdateMessage?(
    props: MessageProps<IMessage>,
    nextProps: MessageProps<IMessage>
  ): boolean;
  onMessageLayout?(event: LayoutChangeEvent): void;
}
