import React, { memo, useCallback } from "react";
import { View } from "react-native";
import isEqual from "lodash.isequal";

import Bubble from "../Bubble";

import { isSameUser } from "../utils";
import { IMessage } from "../types";
import { MessageProps } from "./types";
import styles from "./styles";
import MessageActions from "../MessageActions";

export * from "./types";

let Message: React.FC<MessageProps<IMessage>> = (
  props: MessageProps<IMessage>
) => {
  const {
    currentMessage,
    renderBubble,
    onMessageLayout,
    nextMessage,
    position,
    containerStyle,
    renderMessageActions,
    tools,
  } = props;

  const renderBubbleComponent = useCallback(() => {
    const {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      containerStyle,
      onMessageLayout,
      /* eslint-enable @typescript-eslint/no-unused-vars */
      ...rest
    } = props;

    if (renderBubble) return renderBubble(rest);

    return (
      <View>
        <Bubble {...rest} />
        <MessageActions
          message={currentMessage}
          renderMessageActions={renderMessageActions}
          position={position}
        />
      </View>
    );
  }, [props]);

  if (!currentMessage) return null;

  const sameUser = isSameUser(currentMessage, nextMessage!);

  return (
    <View onLayout={onMessageLayout}>
      <View
        style={[
          styles[position].container,
          { marginBottom: sameUser ? 2 : 10 },
          containerStyle?.[position],
        ]}
      >
        {renderBubbleComponent()}
      </View>
    </View>
  );
};

Message = memo(Message, (props, nextProps) => {
  const shouldUpdate =
    props.shouldUpdateMessage?.(props, nextProps) ||
    !isEqual(props.currentMessage!, nextProps.currentMessage!) ||
    !isEqual(props.previousMessage, nextProps.previousMessage) ||
    !isEqual(props.nextMessage, nextProps.nextMessage);

  if (shouldUpdate) return false;

  return true;
});

export default Message;
