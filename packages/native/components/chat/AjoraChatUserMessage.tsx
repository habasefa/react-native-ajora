// @ts-nocheck
import * as React from "react";
import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import {
  useAjoraChatConfiguration,
  AjoraChatDefaultLabels,
} from "../../providers/AjoraChatConfigurationProvider";
import { UserMessage } from "@ag-ui/core";
import { renderSlot, WithSlots } from "../../lib/slots";
import RichText from "../../../markdown/RichText";

function flattenUserMessageContent(content?: UserMessage["content"]): string {
  if (!content) {
    return "";
  }

  if (typeof content === "string") {
    return content;
  }

  return content
    .map((part) => {
      if (
        part &&
        typeof part === "object" &&
        "type" in part &&
        (part as { type?: unknown }).type === "text" &&
        typeof (part as { text?: unknown }).text === "string"
      ) {
        return (part as { text: string }).text;
      }
      return "";
    })
    .filter((text) => text.length > 0)
    .join("\n");
}

export interface AjoraChatUserMessageOnEditMessageProps {
  message: UserMessage;
}

export interface AjoraChatUserMessageOnSwitchToBranchProps {
  message: UserMessage;
  branchIndex: number;
  numberOfBranches: number;
}

export type AjoraChatUserMessageProps = WithSlots<
  {
    messageRenderer: typeof AjoraChatUserMessage.MessageRenderer;
    toolbar: typeof AjoraChatUserMessage.Toolbar;
    copyButton: typeof AjoraChatUserMessage.CopyButton;
    editButton: typeof AjoraChatUserMessage.EditButton;
    branchNavigation: typeof AjoraChatUserMessage.BranchNavigation;
  },
  {
    onEditMessage?: (props: AjoraChatUserMessageOnEditMessageProps) => void;
    onSwitchToBranch?: (
      props: AjoraChatUserMessageOnSwitchToBranchProps
    ) => void;
    message: UserMessage;
    branchIndex?: number;
    numberOfBranches?: number;
    additionalToolbarItems?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
  }
>;

export function AjoraChatUserMessage({
  message,
  onEditMessage,
  branchIndex,
  numberOfBranches,
  onSwitchToBranch,
  additionalToolbarItems,
  messageRenderer,
  toolbar,
  copyButton,
  editButton,
  branchNavigation,
  children,
  style,
  ...props
}: AjoraChatUserMessageProps) {
  const flattenedContent = useMemo(
    () => flattenUserMessageContent(message.content),
    [message.content]
  );

  const BoundMessageRenderer = renderSlot(
    messageRenderer,
    AjoraChatUserMessage.MessageRenderer,
    {
      content: flattenedContent,
    }
  );

  const BoundCopyButton = renderSlot(
    copyButton,
    AjoraChatUserMessage.CopyButton,
    {
      onClick: async () => {
        console.log("Copy clicked (TODO: implement native clipboard)");
      },
    }
  );

  const BoundEditButton = renderSlot(
    editButton,
    AjoraChatUserMessage.EditButton,
    {
      onClick: () => onEditMessage?.({ message }),
    }
  );

  const BoundBranchNavigation = renderSlot(
    branchNavigation,
    AjoraChatUserMessage.BranchNavigation,
    {
      currentBranch: branchIndex,
      numberOfBranches,
      onSwitchToBranch,
      message,
    }
  );

  const showBranchNavigation =
    numberOfBranches && numberOfBranches > 1 && onSwitchToBranch;

  const BoundToolbar = renderSlot(toolbar, AjoraChatUserMessage.Toolbar, {
    children: (
      <View style={styles.toolbarInner}>
        {additionalToolbarItems}
        {BoundCopyButton}
        {onEditMessage && BoundEditButton}
        {showBranchNavigation && BoundBranchNavigation}
      </View>
    ),
  });

  if (children) {
    return (
      <React.Fragment>
        {children({
          messageRenderer: BoundMessageRenderer,
          toolbar: BoundToolbar,
          copyButton: BoundCopyButton,
          editButton: BoundEditButton,
          branchNavigation: BoundBranchNavigation,
          message,
          branchIndex,
          numberOfBranches,
          additionalToolbarItems,
        })}
      </React.Fragment>
    );
  }

  return (
    <View style={[styles.container, style]} {...props}>
      {BoundMessageRenderer}
      {BoundToolbar}
    </View>
  );
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AjoraChatUserMessage {
  export const Container: React.FC<
    React.PropsWithChildren<{ style?: StyleProp<ViewStyle> }>
  > = ({ children, style, ...props }) => (
    <View style={[styles.container, style]} {...props}>
      {children}
    </View>
  );

  export const MessageRenderer: React.FC<{
    content: string;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    textColor?: string;
    fontSize?: number;
    lineHeight?: number;
  }> = ({
    content,
    style,
    textColor = "#FFFFFF",
    fontSize = 16,
    lineHeight = 22,
  }) => (
    <View style={[styles.messageBubble, style]}>
      <RichText
        text={content}
        textColor={textColor}
        fontSize={fontSize}
        lineHeight={lineHeight}
      />
    </View>
  );

  export const Toolbar: React.FC<{
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
  }> = ({ style, children, ...props }) => (
    <View style={[styles.toolbar, style]} {...props}>
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
          style,
        ]}
        {...props}
      >
        {children}
      </Pressable>
    );
  };

  export const CopyButton: React.FC<{
    onClick?: () => void;
    style?: StyleProp<ViewStyle>;
  }> = ({ style, onClick, ...props }) => {
    const config = useAjoraChatConfiguration();
    const labels = config?.labels ?? AjoraChatDefaultLabels;
    const [copied, setCopied] = useState(false);

    const handlePress = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onClick) {
        onClick();
      }
    };

    return (
      <ToolbarButton
        title={labels.userMessageToolbarCopyMessageLabel}
        onPress={handlePress}
        style={style}
        {...props}
      >
        <Text style={styles.buttonText}>{copied ? "✓" : "Copy"}</Text>
      </ToolbarButton>
    );
  };

  export const EditButton: React.FC<{
    onClick?: () => void;
    style?: StyleProp<ViewStyle>;
  }> = ({ style, onClick, ...props }) => {
    const config = useAjoraChatConfiguration();
    const labels = config?.labels ?? AjoraChatDefaultLabels;
    return (
      <ToolbarButton
        title={labels.userMessageToolbarEditMessageLabel}
        onPress={onClick}
        style={style}
        {...props}
      >
        <Text style={styles.buttonText}>Edit</Text>
      </ToolbarButton>
    );
  };

  export const BranchNavigation: React.FC<{
    currentBranch?: number;
    numberOfBranches?: number;
    onSwitchToBranch?: (
      props: AjoraChatUserMessageOnSwitchToBranchProps
    ) => void;
    message: UserMessage;
    style?: StyleProp<ViewStyle>;
  }> = ({
    style,
    currentBranch = 0,
    numberOfBranches = 1,
    onSwitchToBranch,
    message,
    ...props
  }) => {
    if (!numberOfBranches || numberOfBranches <= 1 || !onSwitchToBranch) {
      return null;
    }

    const canGoPrev = currentBranch > 0;
    const canGoNext = currentBranch < numberOfBranches - 1;

    return (
      <View style={[styles.branchNav, style]} {...props}>
        <Pressable
          onPress={() =>
            onSwitchToBranch?.({
              branchIndex: currentBranch - 1,
              numberOfBranches,
              message,
            })
          }
          disabled={!canGoPrev}
          style={({ pressed }) => [
            styles.navButton,
            !canGoPrev && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.navButtonText}>{"<"}</Text>
        </Pressable>
        <Text style={styles.branchText}>
          {currentBranch + 1}/{numberOfBranches}
        </Text>

        <Pressable
          onPress={() =>
            onSwitchToBranch?.({
              branchIndex: currentBranch + 1,
              numberOfBranches,
              message,
            })
          }
          disabled={!canGoNext}
          style={({ pressed }) => [
            styles.navButton,
            !canGoNext && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.navButtonText}>{">"}</Text>
        </Pressable>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-end",
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  messageBubble: {
    backgroundColor: "#007AFF",
    maxWidth: "85%",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
  },
  toolbar: {
    width: "100%",
    marginTop: 4,
    opacity: 0.8,
  },
  toolbarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  toolbarButton: {
    padding: 4,
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 12,
    color: "#666",
  },
  pressed: {
    opacity: 0.5,
  },
  branchNav: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  navButton: {
    padding: 2,
    marginHorizontal: 2,
  },
  navButtonText: {
    fontSize: 14,
    color: "#007AFF",
  },
  branchText: {
    fontSize: 12,
    color: "#666",
    minWidth: 30,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.3,
  },
});

export default AjoraChatUserMessage;
