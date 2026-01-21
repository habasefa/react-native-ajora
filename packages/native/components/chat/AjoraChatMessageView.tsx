// @ts-nocheck
import * as React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { renderSlot, WithSlots } from "../../lib/slots";
import AjoraChatAssistantMessage from "./AjoraChatAssistantMessage";
import AjoraChatUserMessage from "./AjoraChatUserMessage";
import AjoraChatThinkingIndicator from "./AjoraChatThinkingIndicator";
import {
  ActivityMessage,
  AssistantMessage,
  Message,
  UserMessage,
} from "@ag-ui/core";
import { useRenderActivityMessage, useRenderCustomMessages } from "../../hooks";

const MemoizedAssistantMessage = React.memo(
  function MemoizedAssistantMessage({
    message,
    messages,
    isRunning,
    onRegenerate,
    AssistantMessageComponent,
  }: {
    message: AssistantMessage;
    messages: Message[];
    isRunning: boolean;
    onRegenerate?: (message: AssistantMessage) => void;
    AssistantMessageComponent: typeof AjoraChatAssistantMessage;
  }) {
    return (
      <AssistantMessageComponent
        message={message}
        messages={messages}
        isRunning={isRunning}
        onRegenerate={onRegenerate}
      />
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.message.content !== nextProps.message.content) return false;

    const prevToolCalls = prevProps.message.toolCalls;
    const nextToolCalls = nextProps.message.toolCalls;
    if (prevToolCalls?.length !== nextToolCalls?.length) return false;

    if (prevToolCalls && nextToolCalls) {
      for (let i = 0; i < prevToolCalls.length; i++) {
        const prevTc = prevToolCalls[i];
        const nextTc = nextToolCalls[i];
        if (!prevTc || !nextTc) return false;
        if (prevTc.id !== nextTc.id) return false;
        if (prevTc.function.arguments !== nextTc.function.arguments)
          return false;
      }
    }

    if (prevToolCalls && prevToolCalls.length > 0) {
      const toolCallIds = new Set(prevToolCalls.map((tc) => tc.id));

      const prevToolResults = prevProps.messages.filter(
        (m) => m.role === "tool" && toolCallIds.has((m as any).toolCallId),
      );
      const nextToolResults = nextProps.messages.filter(
        (m) => m.role === "tool" && toolCallIds.has((m as any).toolCallId),
      );

      if (prevToolResults.length !== nextToolResults.length) return false;

      for (let i = 0; i < prevToolResults.length; i++) {
        if (
          (prevToolResults[i] as any).content !==
          (nextToolResults[i] as any).content
        )
          return false;
      }
    }

    const nextIsLatest =
      nextProps.messages[nextProps.messages.length - 1]?.id ===
      nextProps.message.id;
    if (nextIsLatest && prevProps.isRunning !== nextProps.isRunning)
      return false;

    if (
      prevProps.AssistantMessageComponent !==
      nextProps.AssistantMessageComponent
    )
      return false;

    return true;
  },
);

const MemoizedUserMessage = React.memo(
  function MemoizedUserMessage({
    message,
    UserMessageComponent,
    onLongPress,
  }: {
    message: UserMessage;
    UserMessageComponent: typeof AjoraChatUserMessage;
    onLongPress?: (message: UserMessage) => void;
  }) {
    return (
      <UserMessageComponent
        message={message}
        onLongPress={onLongPress ? () => onLongPress(message) : undefined}
      />
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.message.content !== nextProps.message.content) return false;
    if (prevProps.UserMessageComponent !== nextProps.UserMessageComponent)
      return false;
    return true;
  },
);

const MemoizedActivityMessage = React.memo(
  function MemoizedActivityMessage({
    message,
    renderActivityMessage,
  }: {
    message: ActivityMessage;
    renderActivityMessage: (
      message: ActivityMessage,
    ) => React.ReactElement | null;
  }) {
    return renderActivityMessage(message);
  },
  (prevProps, nextProps) => {
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.message.activityType !== nextProps.message.activityType)
      return false;
    if (
      JSON.stringify(prevProps.message.content) !==
      JSON.stringify(nextProps.message.content)
    )
      return false;
    return true;
  },
);

const MemoizedCustomMessage = React.memo(
  function MemoizedCustomMessage({
    message,
    position,
    renderCustomMessage,
  }: {
    message: Message;
    position: "before" | "after";
    renderCustomMessage: (params: {
      message: Message;
      position: "before" | "after";
    }) => React.ReactElement | null;
  }) {
    return renderCustomMessage({ message, position });
  },
  (prevProps, nextProps) => {
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.position !== nextProps.position) return false;
    if (prevProps.message.content !== nextProps.message.content) return false;
    if (prevProps.message.role !== nextProps.message.role) return false;
    return true;
  },
);

export type AjoraChatMessageViewProps = Omit<
  WithSlots<
    {
      assistantMessage: typeof AjoraChatAssistantMessage;
      userMessage: typeof AjoraChatUserMessage;
      thinkingIndicator: typeof AjoraChatThinkingIndicator;
    },
    {
      isRunning?: boolean;
      messages?: Message[];
      onRegenerate?: (message: AssistantMessage) => void;
      onMessageLongPress?: (message: Message) => void;
      /** Whether to show the thinking indicator when isRunning is true */
      showThinkingIndicator?: boolean;
      style?: StyleProp<ViewStyle>;
    }
  >,
  "children"
> & {
  children?: (props: {
    isRunning: boolean;
    messages: Message[];
    messageElements: React.ReactElement[];
    thinkingIndicator: React.ReactElement | null;
  }) => React.ReactElement;
};

export function AjoraChatMessageView({
  messages = [],
  assistantMessage,
  userMessage,
  thinkingIndicator,
  isRunning = false,
  showThinkingIndicator = true,

  onRegenerate,
  onMessageLongPress,
  children,
  style,
  ...props
}: AjoraChatMessageViewProps) {
  const renderCustomMessage = useRenderCustomMessages();
  const renderActivityMessage = useRenderActivityMessage();

  // Determine if we should show the thinking indicator
  // Show when running AND the latest message is from the user (waiting for assistant response)
  // OR when running and there are no messages yet
  const lastMessage = messages[messages.length - 1];
  const shouldShowThinking =
    showThinkingIndicator &&
    isRunning &&
    (messages.length === 0 || lastMessage?.role === "user");

  // Render the thinking indicator using the slot system
  const boundThinkingIndicator = shouldShowThinking
    ? renderSlot(thinkingIndicator, AjoraChatThinkingIndicator, {
        isThinking: true,
      })
    : null;

  const messageElements: React.ReactElement[] = messages
    .flatMap((message) => {
      const elements: (React.ReactElement | null | undefined)[] = [];

      if (renderCustomMessage) {
        elements.push(
          <MemoizedCustomMessage
            key={`${message.id}-custom-before`}
            message={message}
            position="before"
            renderCustomMessage={renderCustomMessage}
          />,
        );
      }

      if (message.role === "assistant") {
        const AssistantComponent = (
          typeof assistantMessage === "function"
            ? assistantMessage
            : AjoraChatAssistantMessage
        ) as typeof AjoraChatAssistantMessage;

        elements.push(
          <MemoizedAssistantMessage
            key={message.id}
            message={message as AssistantMessage}
            messages={messages}
            isRunning={isRunning}
            onRegenerate={onRegenerate}
            AssistantMessageComponent={AssistantComponent}
          />,
        );
      } else if (message.role === "user") {
        const UserComponent = (
          typeof userMessage === "function" ? userMessage : AjoraChatUserMessage
        ) as typeof AjoraChatUserMessage;

        elements.push(
          <MemoizedUserMessage
            key={message.id}
            message={message as UserMessage}
            UserMessageComponent={UserComponent}
            onLongPress={onMessageLongPress}
          />,
        );
      } else if (message.role === "activity") {
        elements.push(
          <MemoizedActivityMessage
            key={message.id}
            message={message as ActivityMessage}
            renderActivityMessage={renderActivityMessage}
          />,
        );
      }

      if (renderCustomMessage) {
        elements.push(
          <MemoizedCustomMessage
            key={`${message.id}-custom-after`}
            message={message}
            position="after"
            renderCustomMessage={renderCustomMessage}
          />,
        );
      }

      return elements;
    })
    .filter(Boolean) as React.ReactElement[];

  if (children) {
    return children({
      messageElements,
      messages,
      isRunning,
      thinkingIndicator: boundThinkingIndicator,
    });
  }

  return (
    <View style={[styles.container, style]} {...props}>
      {messageElements}
      {boundThinkingIndicator}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
  },
});

export default AjoraChatMessageView;
