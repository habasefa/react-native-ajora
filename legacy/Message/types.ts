import { ViewStyle, LayoutChangeEvent } from "react-native";
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
  shouldUpdateMessage?(
    props: MessageProps<IMessage>,
    nextProps: MessageProps<IMessage>
  ): boolean;
  onMessageLayout?(event: LayoutChangeEvent): void;
}
