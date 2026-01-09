// @ts-nocheck
import * as React from "react";
import { useState } from "react";
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle, TextStyle } from "react-native";
import { AssistantMessage, Message } from "@ag-ui/core";
import {
  useAjoraChatConfiguration,
  AjoraChatDefaultLabels,
} from "../../providers/AjoraChatConfigurationProvider";
import { renderSlot, WithSlots } from "../../lib/slots";
import AjoraChatToolCallsView from "./AjoraChatToolCallsView";

export type AjoraChatAssistantMessageProps = WithSlots<
  {
    markdownRenderer: typeof AjoraChatAssistantMessage.MarkdownRenderer;
    toolbar: typeof AjoraChatAssistantMessage.Toolbar;
    copyButton: typeof AjoraChatAssistantMessage.CopyButton;
    thumbsUpButton: typeof AjoraChatAssistantMessage.ThumbsUpButton;
    thumbsDownButton: typeof AjoraChatAssistantMessage.ThumbsDownButton;
    readAloudButton: typeof AjoraChatAssistantMessage.ReadAloudButton;
    regenerateButton: typeof AjoraChatAssistantMessage.RegenerateButton;
    toolCallsView: typeof AjoraChatToolCallsView;
  },
  {
    onThumbsUp?: (message: AssistantMessage) => void;
    onThumbsDown?: (message: AssistantMessage) => void;
    onReadAloud?: (message: AssistantMessage) => void;
    onRegenerate?: (message: AssistantMessage) => void;
    message: AssistantMessage;
    messages?: Message[];
    isRunning?: boolean;
    additionalToolbarItems?: React.ReactNode;
    toolbarVisible?: boolean;
    style?: StyleProp<ViewStyle>;
  }
>;

export function AjoraChatAssistantMessage({
  message,
  messages,
  isRunning,
  onThumbsUp,
  onThumbsDown,
  onReadAloud,
  onRegenerate,
  additionalToolbarItems,
  toolbarVisible = true,
  markdownRenderer,
  toolbar,
  copyButton,
  thumbsUpButton,
  thumbsDownButton,
  readAloudButton,
  regenerateButton,
  toolCallsView,
  children,
  style,
  ...props
}: AjoraChatAssistantMessageProps) {
  const boundMarkdownRenderer = renderSlot(
    markdownRenderer,
    AjoraChatAssistantMessage.MarkdownRenderer,
    {
      content: message.content || "",
    }
  );

  const boundCopyButton = renderSlot(
    copyButton,
    AjoraChatAssistantMessage.CopyButton,
    {
      onClick: () => {
        console.log("Copy clicked (TODO: implement native clipboard)");
      },
    }
  );

  const boundThumbsUpButton = renderSlot(
    thumbsUpButton,
    AjoraChatAssistantMessage.ThumbsUpButton,
    {
      onClick: () => onThumbsUp?.(message),
    }
  );

  const boundThumbsDownButton = renderSlot(
    thumbsDownButton,
    AjoraChatAssistantMessage.ThumbsDownButton,
    {
      onClick: () => onThumbsDown?.(message),
    }
  );

  const boundReadAloudButton = renderSlot(
    readAloudButton,
    AjoraChatAssistantMessage.ReadAloudButton,
    {
      onClick: () => onReadAloud?.(message),
    }
  );

  const boundRegenerateButton = renderSlot(
    regenerateButton,
    AjoraChatAssistantMessage.RegenerateButton,
    {
      onClick: () => onRegenerate?.(message),
    }
  );

  const boundToolbar = renderSlot(
    toolbar,
    AjoraChatAssistantMessage.Toolbar,
    {
      children: (
         
        <View style={styles.toolbarInner}>
          {boundCopyButton}
          {(onThumbsUp || thumbsUpButton) && boundThumbsUpButton}
          {(onThumbsDown || thumbsDownButton) && boundThumbsDownButton}
          {(onReadAloud || readAloudButton) && boundReadAloudButton}
          {(onRegenerate || regenerateButton) && boundRegenerateButton}
          {additionalToolbarItems}
        </View>
      ),
    }
  );

  const boundToolCallsView = renderSlot(
    toolCallsView,
    AjoraChatToolCallsView,
    {
      message,
      messages,
    }
  );

  const hasContent = !!(message.content && message.content.trim().length > 0);
  const isLatestAssistantMessage =
    message.role === "assistant" && messages?.[messages.length - 1]?.id === message.id;
  const shouldShowToolbar = toolbarVisible && hasContent && !(isRunning && isLatestAssistantMessage);

  if (children) {
    return (
      <React.Fragment>
        {children({
          markdownRenderer: boundMarkdownRenderer,
          toolbar: boundToolbar,
          toolCallsView: boundToolCallsView,
          copyButton: boundCopyButton,
          thumbsUpButton: boundThumbsUpButton,
          thumbsDownButton: boundThumbsDownButton,
          readAloudButton: boundReadAloudButton,
          regenerateButton: boundRegenerateButton,
          message,
          messages,
          isRunning,
          onThumbsUp,
          onThumbsDown,
          onReadAloud,
          onRegenerate,
          additionalToolbarItems,
          toolbarVisible: shouldShowToolbar,
        })}
      </React.Fragment>
    );
  }

  return (
    <View style={[styles.container, style]} {...props}>
      {boundMarkdownRenderer}
      {boundToolCallsView}
      {shouldShowToolbar && boundToolbar}
    </View>
  );
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AjoraChatAssistantMessage {
  export const MarkdownRenderer: React.FC<{
    content: string;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
  }> = ({ content, style, textStyle }) => (
     
    <View style={[styles.markdownContainer, style]}>
      {/* @ts-ignore */}
      <Text style={[styles.markdownText, textStyle]}>
        {content}
      </Text>
    </View>
  );

  export const Toolbar: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({
    style,
    children,
    ...props
  }) => (
     
    <View
      style={[styles.toolbar, style]}
      {...props}
    >
      {children}
    </View>
  );

  export const ToolbarButton: React.FC<{
    title: string;
    onPress?: () => void;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
  }> = ({ title, children, onPress, style, ...props }) => {
    return (
       
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.toolbarButton,
          pressed && styles.pressed,
          style
        ]}
        {...props}
      >
        {children}
      </Pressable>
    );
  };

  export const CopyButton: React.FC<{ onClick?: () => void; style?: StyleProp<ViewStyle> }> = ({ style, onClick, ...props }) => {
    const config = useAjoraChatConfiguration();
    const labels = config?.labels ?? AjoraChatDefaultLabels;
    const [copied, setCopied] = useState(false);

    const handlePress = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onClick) onClick();
    };

    return (
      <ToolbarButton
        title={labels.assistantMessageToolbarCopyMessageLabel}
        onPress={handlePress}
        style={style}
        {...props}
      >
        <Text style={styles.buttonText}>{copied ? "✓" : "Copy"}</Text>
      </ToolbarButton>
    );
  };

  export const ThumbsUpButton: React.FC<{ onClick?: () => void; style?: StyleProp<ViewStyle> }> = ({ onClick, style, ...props }) => {
    const config = useAjoraChatConfiguration();
    const labels = config?.labels ?? AjoraChatDefaultLabels;
    return (
      <ToolbarButton
        title={labels.assistantMessageToolbarThumbsUpLabel}
        onPress={onClick}
        style={style}
        {...props}
      >
        <Text style={styles.buttonText}>👍</Text>
      </ToolbarButton>
    );
  };

  export const ThumbsDownButton: React.FC<{ onClick?: () => void; style?: StyleProp<ViewStyle> }> = ({ onClick, style, ...props }) => {
    const config = useAjoraChatConfiguration();
    const labels = config?.labels ?? AjoraChatDefaultLabels;
    return (
      <ToolbarButton
        title={labels.assistantMessageToolbarThumbsDownLabel}
        onPress={onClick}
        style={style}
        {...props}
      >
        <Text style={styles.buttonText}>👎</Text>
      </ToolbarButton>
    );
  };

  export const ReadAloudButton: React.FC<{ onClick?: () => void; style?: StyleProp<ViewStyle> }> = ({ onClick, style, ...props }) => {
    const config = useAjoraChatConfiguration();
    const labels = config?.labels ?? AjoraChatDefaultLabels;
    return (
      <ToolbarButton
        title={labels.assistantMessageToolbarReadAloudLabel}
        onPress={onClick}
        style={style}
        {...props}
      >
        <Text style={styles.buttonText}>🔊</Text>
      </ToolbarButton>
    );
  };

  export const RegenerateButton: React.FC<{ onClick?: () => void; style?: StyleProp<ViewStyle> }> = ({ onClick, style, ...props }) => {
    const config = useAjoraChatConfiguration();
    const labels = config?.labels ?? AjoraChatDefaultLabels;
    return (
      <ToolbarButton
        title={labels.assistantMessageToolbarRegenerateLabel}
        onPress={onClick}
        style={style}
        {...props}
      >
        <Text style={styles.buttonText}>🔄</Text>
      </ToolbarButton>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  markdownContainer: {
    paddingVertical: 4,
  },
  markdownText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#000000",
  },
  toolbar: {
    width: "100%",
    marginTop: 8,
  },
  toolbarInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  toolbarButton: {
    padding: 6,
    marginRight: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
  },
  buttonText: {
    fontSize: 12,
    color: "#444",
  },
  pressed: {
    opacity: 0.5,
  },
});

export default AjoraChatAssistantMessage;
