import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import RichText from "../../../markdown/RichText";

// Optional haptics import - gracefully handle if not available
let Haptics: {
  impactAsync?: (style: string) => Promise<void>;
  notificationAsync?: (type: string) => Promise<void>;
  ImpactFeedbackStyle?: { Light: string; Medium: string };
  NotificationFeedbackType?: { Success: string; Error: string };
} = {};

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Haptics = require("expo-haptics");
} catch {
  // expo-haptics not available
  console.warn("expo-haptics not available");
}
import { AssistantMessage, Message } from "@ag-ui/core";
import {
  useAjoraChatConfiguration,
  AjoraChatDefaultLabels,
} from "../../providers/AjoraChatConfigurationProvider";
import { renderSlot, WithSlots } from "../../lib/slots";
import AjoraChatToolCallsView from "./AjoraChatToolCallsView";
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";

// ============================================================================
// Types & Interfaces
// ============================================================================

export type FeedbackType = "thumbsUp" | "thumbsDown" | null;

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
    onCopy?: (content: string) => void;
    message: AssistantMessage;
    messages?: Message[];
    isRunning?: boolean;
    additionalToolbarItems?: React.ReactNode;
    toolbarVisible?: boolean;

    /** Custom colors override (highest priority) */
    colors?: AjoraChatAssistantMessageColorsOverride;
    showCopyButton?: boolean;
    showThumbsButtons?: boolean;
    showReadAloudButton?: boolean;
    showRegenerateButton?: boolean;
    style?: StyleProp<ViewStyle>;
  }
>;

// ============================================================================
// Theme Colors
// ============================================================================

// ============================================================================
// Theme Colors Interface
// ============================================================================

export interface AjoraChatAssistantMessageColorsOverride {
  text?: string;
  textSecondary?: string;
  border?: string;
  buttonBackground?: string;
  buttonBackgroundHover?: string;
  buttonBackgroundActive?: string;
  accent?: string;
  success?: string;
  error?: string;
  thumbsUp?: string;
  thumbsDown?: string;
  iconColor?: string;
}

interface AjoraChatAssistantMessageColors {
  text: string;
  textSecondary: string;
  border: string;
  buttonBackground: string;
  buttonBackgroundHover: string;
  buttonBackgroundActive: string;
  accent: string;
  success: string;
  error: string;
  thumbsUp: string;
  thumbsDown: string;
  iconColor: string;
}

// ============================================================================
// Sub-Components
// ============================================================================

interface ToolbarButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  isActive?: boolean;
  activeColor?: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  style?: StyleProp<ViewStyle>;
  colors: AjoraChatAssistantMessageColors;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onPress,
  disabled = false,
  isActive = false,
  activeColor,
  icon,
  label,
  style,
  colors,
}) => {
  const handlePress = useCallback(() => {
    if (
      Platform.OS !== "web" &&
      Haptics.impactAsync &&
      Haptics.ImpactFeedbackStyle
    ) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  }, [onPress]);

  const iconColor = isActive
    ? (activeColor ?? colors.accent)
    : colors.textSecondary;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.toolbarButton,
        { backgroundColor: colors.buttonBackground },
        isActive && { backgroundColor: colors.buttonBackgroundActive },
        pressed &&
          !disabled && { backgroundColor: colors.buttonBackgroundHover },
        disabled && styles.toolbarButtonDisabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: isActive }}
    >
      <Ionicons name={icon} size={16} color={iconColor} />
    </Pressable>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export function AjoraChatAssistantMessage({
  message,
  messages,
  isRunning,
  onThumbsUp,
  onThumbsDown,
  onReadAloud,
  onRegenerate,
  onCopy,
  additionalToolbarItems,
  colors: colorOverrides,
  toolbarVisible = true,
  showCopyButton = true,
  showThumbsButtons = true,
  showReadAloudButton = false,
  showRegenerateButton = true,
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
  // ========================================================================
  // State
  // ========================================================================

  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackType>(null);

  // ========================================================================
  // Configuration
  // ========================================================================

  const config = useAjoraChatConfiguration();
  const labels = config?.labels ?? AjoraChatDefaultLabels;

  // ========================================================================
  // Theme
  // ========================================================================

  const theme = useAjoraTheme();

  const colors: AjoraChatAssistantMessageColors = React.useMemo(
    () => ({
      text: colorOverrides?.text ?? theme.colors.text,
      textSecondary:
        colorOverrides?.textSecondary ?? theme.colors.textSecondary,
      border: colorOverrides?.border ?? theme.colors.border,
      buttonBackground:
        colorOverrides?.buttonBackground ?? theme.colors.surface,
      buttonBackgroundHover:
        colorOverrides?.buttonBackgroundHover ?? theme.colors.border,
      buttonBackgroundActive:
        colorOverrides?.buttonBackgroundActive ?? theme.colors.itemSelected,
      accent: colorOverrides?.accent ?? theme.colors.primary,
      success: colorOverrides?.success ?? theme.colors.success,
      error: colorOverrides?.error ?? theme.colors.error,
      thumbsUp: colorOverrides?.thumbsUp ?? theme.colors.success,
      thumbsDown: colorOverrides?.thumbsDown ?? theme.colors.error,
      iconColor: colorOverrides?.iconColor ?? theme.colors.iconDefault,
    }),
    [theme, colorOverrides],
  );

  // ========================================================================
  // Derived State
  // ========================================================================

  const hasContent = !!(message.content && message.content.trim().length > 0);

  // Calculate if this is the last message in a sequence of assistant messages
  const messageIndex = messages?.findIndex((m) => m.id === message.id) ?? -1;
  const nextMessage =
    messageIndex >= 0 ? messages?.[messageIndex + 1] : undefined;
  const isLastInSequence = !nextMessage || nextMessage.role !== "assistant";

  const shouldShowToolbar =
    toolbarVisible && hasContent && isLastInSequence && !isRunning;

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleCopy = useCallback(async () => {
    if (!message.content) return;

    try {
      await Clipboard.setStringAsync(message.content);
      setCopied(true);
      if (
        Platform.OS !== "web" &&
        Haptics.notificationAsync &&
        Haptics.NotificationFeedbackType
      ) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onCopy?.(message.content);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
      if (
        Platform.OS !== "web" &&
        Haptics.notificationAsync &&
        Haptics.NotificationFeedbackType
      ) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [message.content, onCopy]);

  const handleThumbsUp = useCallback(() => {
    const newFeedback = feedback === "thumbsUp" ? null : "thumbsUp";
    setFeedback(newFeedback);
    if (newFeedback === "thumbsUp") {
      onThumbsUp?.(message);
    }
    if (
      Platform.OS !== "web" &&
      Haptics.impactAsync &&
      Haptics.ImpactFeedbackStyle
    ) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [feedback, message, onThumbsUp]);

  const handleThumbsDown = useCallback(() => {
    const newFeedback = feedback === "thumbsDown" ? null : "thumbsDown";
    setFeedback(newFeedback);
    if (newFeedback === "thumbsDown") {
      onThumbsDown?.(message);
    }
    if (
      Platform.OS !== "web" &&
      Haptics.impactAsync &&
      Haptics.ImpactFeedbackStyle
    ) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [feedback, message, onThumbsDown]);

  const handleReadAloud = useCallback(() => {
    onReadAloud?.(message);
  }, [message, onReadAloud]);

  const handleRegenerate = useCallback(() => {
    onRegenerate?.(message);
    if (
      Platform.OS !== "web" &&
      Haptics.impactAsync &&
      Haptics.ImpactFeedbackStyle
    ) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [message, onRegenerate]);

  // ========================================================================
  // Render Slots
  // ========================================================================

  const boundMarkdownRenderer = renderSlot(
    markdownRenderer,
    AjoraChatAssistantMessage.MarkdownRenderer,
    {
      content: message.content || "",
      colors,
    },
  );

  const boundCopyButton = renderSlot(
    copyButton,
    AjoraChatAssistantMessage.CopyButton,
    {
      onClick: handleCopy,
      copied,
      colors,
    },
  );

  const boundThumbsUpButton = renderSlot(
    thumbsUpButton,
    AjoraChatAssistantMessage.ThumbsUpButton,
    {
      onClick: handleThumbsUp,
      isActive: feedback === "thumbsUp",
      colors,
    },
  );

  const boundThumbsDownButton = renderSlot(
    thumbsDownButton,
    AjoraChatAssistantMessage.ThumbsDownButton,
    {
      onClick: handleThumbsDown,
      isActive: feedback === "thumbsDown",
      colors,
    },
  );

  const boundReadAloudButton = renderSlot(
    readAloudButton,
    AjoraChatAssistantMessage.ReadAloudButton,
    {
      onClick: handleReadAloud,
      colors,
    },
  );

  const boundRegenerateButton = renderSlot(
    regenerateButton,
    AjoraChatAssistantMessage.RegenerateButton,
    {
      onClick: handleRegenerate,
      colors,
    },
  );

  const boundToolbar = renderSlot(toolbar, AjoraChatAssistantMessage.Toolbar, {
    children: (
      <View style={styles.toolbarInner}>
        {showCopyButton && boundCopyButton}
        {showRegenerateButton && boundRegenerateButton}
        {showThumbsButtons && (
          <>
            {boundThumbsUpButton}
            {boundThumbsDownButton}
          </>
        )}
        {showReadAloudButton && boundReadAloudButton}
        {additionalToolbarItems}
      </View>
    ),
  });

  const boundToolCallsView = renderSlot(toolCallsView, AjoraChatToolCallsView, {
    message,
    messages,
  });

  // ========================================================================
  // Render with Children
  // ========================================================================

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

  // ========================================================================
  // Default Render
  // ========================================================================

  return (
    <View style={[styles.container, style]} {...props}>
      {boundMarkdownRenderer}
      {boundToolCallsView}
      {shouldShowToolbar && boundToolbar}
    </View>
  );
}

// ============================================================================
// Namespace Sub-Components
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AjoraChatAssistantMessage {
  export const MarkdownRenderer: React.FC<{
    content: string;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    textColor?: string;
    fontSize?: number;
    lineHeight?: number;
    colors?: AjoraChatAssistantMessageColors;
  }> = ({
    content,
    style,
    colors,
    textColor,
    fontSize = 16,
    lineHeight = 24,
  }) => (
    <View style={[styles.markdownContainer, style]}>
      <RichText
        text={content}
        textColor={textColor ?? colors?.text}
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

  export const CopyButton: React.FC<{
    onClick?: () => void;
    copied?: boolean;
    style?: StyleProp<ViewStyle>;
    colors: AjoraChatAssistantMessageColors;
  }> = ({ onClick, copied = false, style, colors }) => {
    const config = useAjoraChatConfiguration();
    const labels = config?.labels ?? AjoraChatDefaultLabels;

    return (
      <ToolbarButton
        onPress={onClick}
        icon={copied ? "checkmark" : "copy-outline"}
        label={
          copied
            ? "Copied"
            : (labels.assistantMessageToolbarCopyMessageLabel ?? "Copy")
        }
        isActive={copied}
        activeColor={colors.success}
        style={style}
        colors={colors}
      />
    );
  };

  export const ThumbsUpButton: React.FC<{
    onClick?: () => void;
    isActive?: boolean;
    style?: StyleProp<ViewStyle>;
    colors: AjoraChatAssistantMessageColors;
  }> = ({ onClick, isActive = false, style, colors }) => {
    const config = useAjoraChatConfiguration();
    const labels = config?.labels ?? AjoraChatDefaultLabels;

    return (
      <ToolbarButton
        onPress={onClick}
        icon={isActive ? "thumbs-up" : "thumbs-up-outline"}
        label={labels.assistantMessageToolbarThumbsUpLabel ?? "Like"}
        isActive={isActive}
        activeColor={colors.thumbsUp}
        style={style}
        colors={colors}
      />
    );
  };

  export const ThumbsDownButton: React.FC<{
    onClick?: () => void;
    isActive?: boolean;
    style?: StyleProp<ViewStyle>;
    colors: AjoraChatAssistantMessageColors;
  }> = ({ onClick, isActive = false, style, colors }) => {
    const config = useAjoraChatConfiguration();
    const labels = config?.labels ?? AjoraChatDefaultLabels;

    return (
      <ToolbarButton
        onPress={onClick}
        icon={isActive ? "thumbs-down" : "thumbs-down-outline"}
        label={labels.assistantMessageToolbarThumbsDownLabel ?? "Dislike"}
        isActive={isActive}
        activeColor={colors.thumbsDown}
        style={style}
        colors={colors}
      />
    );
  };

  export const ReadAloudButton: React.FC<{
    onClick?: () => void;
    style?: StyleProp<ViewStyle>;
    colors: AjoraChatAssistantMessageColors;
  }> = ({ onClick, style, colors }) => {
    const config = useAjoraChatConfiguration();
    const labels = config?.labels ?? AjoraChatDefaultLabels;

    return (
      <ToolbarButton
        onPress={onClick}
        icon="volume-high-outline"
        label={labels.assistantMessageToolbarReadAloudLabel ?? "Read aloud"}
        style={style}
        colors={colors}
      />
    );
  };

  export const RegenerateButton: React.FC<{
    onClick?: () => void;
    style?: StyleProp<ViewStyle>;
    colors: AjoraChatAssistantMessageColors;
  }> = ({ onClick, style, colors }) => {
    const config = useAjoraChatConfiguration();
    const labels = config?.labels ?? AjoraChatDefaultLabels;

    return (
      <ToolbarButton
        onPress={onClick}
        icon="reload-outline"
        label={labels.assistantMessageToolbarRegenerateLabel ?? "Regenerate"}
        style={style}
        colors={colors}
      />
    );
  };
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  markdownContainer: {
    paddingVertical: 4,
  },
  toolbar: {
    width: "100%",
    marginTop: 12,
  },
  toolbarInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toolbarButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    // backgroundColor: COLORS.buttonBackground, // Set via inline style
    alignItems: "center",
    justifyContent: "center",
  },
  toolbarButtonActive: {
    // backgroundColor: COLORS.buttonBackgroundActive, // Set via inline style
  },
  toolbarButtonPressed: {
    // backgroundColor: COLORS.buttonBackgroundHover, // Set via inline style
    transform: [{ scale: 0.95 }],
  },
  toolbarButtonDisabled: {
    opacity: 0.5,
  },
});

export default AjoraChatAssistantMessage;
