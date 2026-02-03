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
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";

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

export interface AjoraChatUserMessageColorsOverride {
  bubbleBackground?: string;
  text?: string;
  iconColor?: string;
}

interface AjoraChatUserMessageColors {
  bubbleBackground: string;
  text: string;
  iconColor: string;
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
      props: AjoraChatUserMessageOnSwitchToBranchProps,
    ) => void;
    message: UserMessage;
    branchIndex?: number;
    numberOfBranches?: number;
    additionalToolbarItems?: React.ReactNode;
    additionalToolbarItems?: React.ReactNode;
    colors?: AjoraChatUserMessageColorsOverride;
    onLongPress?: (props: { message: UserMessage }) => void;
    style?: StyleProp<ViewStyle>;
    textRenderer?: (props: {
      content: string;
      style?: any;
      isUser?: boolean;
    }) => React.ReactNode;
  }
>;

export function AjoraChatUserMessage({
  message,
  onEditMessage,
  branchIndex,
  numberOfBranches,
  onSwitchToBranch,
  additionalToolbarItems,

  colors: colorOverrides,
  onLongPress,
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
    [message.content],
  );

  const theme = useAjoraTheme();

  const colors: AjoraChatUserMessageColors = useMemo(
    () => ({
      bubbleBackground:
        colorOverrides?.bubbleBackground ?? theme.colors.userBubble,
      text: colorOverrides?.text ?? theme.colors.userBubbleText,
      iconColor: colorOverrides?.iconColor ?? theme.colors.textSecondary,
    }),
    [theme, colorOverrides],
  );

  const BoundMessageRenderer = renderSlot(
    messageRenderer,
    AjoraChatUserMessage.MessageRenderer,
    {
      content: flattenedContent,
      colors,
      onLongPress: () => onLongPress?.({ message }),
      textRenderer: props.textRenderer,
    },
  );

  const BoundCopyButton = renderSlot(
    copyButton,
    AjoraChatUserMessage.CopyButton,
    {
      onClick: async () => {
        console.log("Copy clicked (TODO: implement native clipboard)");
      },
      colors,
    },
  );

  const BoundEditButton = renderSlot(
    editButton,
    AjoraChatUserMessage.EditButton,
    {
      onClick: () => onEditMessage?.({ message }),
      colors,
    },
  );

  const BoundBranchNavigation = renderSlot(
    branchNavigation,
    AjoraChatUserMessage.BranchNavigation,
    {
      currentBranch: branchIndex,
      numberOfBranches,
      onSwitchToBranch,
      message,
      colors,
    },
  );

  const showBranchNavigation =
    numberOfBranches && numberOfBranches > 1 && onSwitchToBranch;

  const BoundToolbar = renderSlot(toolbar, AjoraChatUserMessage.Toolbar, {
    children: (
      <View style={styles.toolbarInner}>
        {additionalToolbarItems}
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

    colors?: AjoraChatUserMessageColors;
    onLongPress?: () => void;
    textRenderer?: (props: {
      content: string;
      style?: any;
      isUser?: boolean;
    }) => React.ReactNode;
  }> = ({
    content,
    style,
    colors,
    textColor,
    fontSize = 16,
    lineHeight = 22,
    onLongPress,
    textRenderer,
  }) => {
    const defaultTextStyle = {
      color: textColor ?? colors?.text ?? "#FFFFFF",
      fontSize,
      lineHeight,
    };

    return (
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={500}
        style={({ pressed }) => [
          styles.messageBubble,
          { backgroundColor: colors?.bubbleBackground ?? "#007AFF" },
          style,
          pressed && { opacity: 0.8 },
        ]}
      >
        {textRenderer ? (
          textRenderer({ content, style: defaultTextStyle, isUser: true })
        ) : (
          <RichText
            text={content}
            textColor={textColor ?? colors?.text ?? "#FFFFFF"}
            fontSize={fontSize}
            lineHeight={lineHeight}
          />
        )}
      </Pressable>
    );
  };

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
    colors: AjoraChatUserMessageColors;
  }> = ({ style, onClick, colors, ...props }) => {
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
        <Text style={[styles.buttonText, { color: colors.iconColor }]}>
          {copied ? "✓" : "Copy"}
        </Text>
      </ToolbarButton>
    );
  };

  export const EditButton: React.FC<{
    onClick?: () => void;
    style?: StyleProp<ViewStyle>;
    colors: AjoraChatUserMessageColors;
  }> = ({ style, onClick, colors, ...props }) => {
    const config = useAjoraChatConfiguration();
    const labels = config?.labels ?? AjoraChatDefaultLabels;
    return (
      <ToolbarButton
        title={labels.userMessageToolbarEditMessageLabel}
        onPress={onClick}
        style={style}
        {...props}
      >
        <Text style={[styles.buttonText, { color: colors.iconColor }]}>
          Edit
        </Text>
      </ToolbarButton>
    );
  };

  export const BranchNavigation: React.FC<{
    currentBranch?: number;
    numberOfBranches?: number;
    onSwitchToBranch?: (
      props: AjoraChatUserMessageOnSwitchToBranchProps,
    ) => void;
    message: UserMessage;
    style?: StyleProp<ViewStyle>;
    colors: AjoraChatUserMessageColors;
  }> = ({
    style,
    currentBranch = 0,
    numberOfBranches = 1,
    onSwitchToBranch,
    message,
    colors,
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
          <Text
            style={[styles.navButtonText, { color: colors.bubbleBackground }]}
          >
            {"<"}
          </Text>
        </Pressable>
        <Text style={[styles.branchText, { color: colors.iconColor }]}>
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
          <Text
            style={[styles.navButtonText, { color: colors.bubbleBackground }]}
          >
            {">"}
          </Text>
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
    maxWidth: "85%",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageText: {
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
  },
  branchText: {
    fontSize: 12,
    minWidth: 30,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.3,
  },
});

export default AjoraChatUserMessage;
