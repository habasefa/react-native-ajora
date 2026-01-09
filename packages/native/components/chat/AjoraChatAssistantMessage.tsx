import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";

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
}
import { AssistantMessage, Message } from "@ag-ui/core";
import {
  useAjoraChatConfiguration,
  AjoraChatDefaultLabels,
} from "../../providers/AjoraChatConfigurationProvider";
import { renderSlot, WithSlots } from "../../lib/slots";
import AjoraChatToolCallsView from "./AjoraChatToolCallsView";

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

const COLORS = {
  background: "#FFFFFF",
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  buttonBackground: "#F3F4F6",
  buttonBackgroundHover: "#E5E7EB",
  buttonBackgroundActive: "#DBEAFE",
  accent: "#3B82F6",
  success: "#10B981",
  error: "#EF4444",
  thumbsUp: "#10B981",
  thumbsDown: "#EF4444",
};

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
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onPress,
  disabled = false,
  isActive = false,
  activeColor,
  icon,
  label,
  style,
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
    ? (activeColor ?? COLORS.accent)
    : COLORS.textSecondary;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.toolbarButton,
        isActive && styles.toolbarButtonActive,
        pressed && !disabled && styles.toolbarButtonPressed,
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
  // Derived State
  // ========================================================================

  const hasContent = !!(message.content && message.content.trim().length > 0);
  const isLatestAssistantMessage =
    message.role === "assistant" &&
    messages?.[messages.length - 1]?.id === message.id;
  const shouldShowToolbar =
    toolbarVisible && hasContent && !(isRunning && isLatestAssistantMessage);

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
    }
  );

  const boundCopyButton = renderSlot(
    copyButton,
    AjoraChatAssistantMessage.CopyButton,
    {
      onClick: handleCopy,
      copied,
    }
  );

  const boundThumbsUpButton = renderSlot(
    thumbsUpButton,
    AjoraChatAssistantMessage.ThumbsUpButton,
    {
      onClick: handleThumbsUp,
      isActive: feedback === "thumbsUp",
    }
  );

  const boundThumbsDownButton = renderSlot(
    thumbsDownButton,
    AjoraChatAssistantMessage.ThumbsDownButton,
    {
      onClick: handleThumbsDown,
      isActive: feedback === "thumbsDown",
    }
  );

  const boundReadAloudButton = renderSlot(
    readAloudButton,
    AjoraChatAssistantMessage.ReadAloudButton,
    {
      onClick: handleReadAloud,
    }
  );

  const boundRegenerateButton = renderSlot(
    regenerateButton,
    AjoraChatAssistantMessage.RegenerateButton,
    {
      onClick: handleRegenerate,
    }
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
  }> = ({ content, style, textStyle }) => (
    <View style={[styles.markdownContainer, style]}>
      <Text style={[styles.markdownText, textStyle]}>{content}</Text>
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
  }> = ({ onClick, copied = false, style }) => {
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
        activeColor={COLORS.success}
        style={style}
      />
    );
  };

  export const ThumbsUpButton: React.FC<{
    onClick?: () => void;
    isActive?: boolean;
    style?: StyleProp<ViewStyle>;
  }> = ({ onClick, isActive = false, style }) => {
    const config = useAjoraChatConfiguration();
    const labels = config?.labels ?? AjoraChatDefaultLabels;

    return (
      <ToolbarButton
        onPress={onClick}
        icon={isActive ? "thumbs-up" : "thumbs-up-outline"}
        label={labels.assistantMessageToolbarThumbsUpLabel ?? "Like"}
        isActive={isActive}
        activeColor={COLORS.thumbsUp}
        style={style}
      />
    );
  };

  export const ThumbsDownButton: React.FC<{
    onClick?: () => void;
    isActive?: boolean;
    style?: StyleProp<ViewStyle>;
  }> = ({ onClick, isActive = false, style }) => {
    const config = useAjoraChatConfiguration();
    const labels = config?.labels ?? AjoraChatDefaultLabels;

    return (
      <ToolbarButton
        onPress={onClick}
        icon={isActive ? "thumbs-down" : "thumbs-down-outline"}
        label={labels.assistantMessageToolbarThumbsDownLabel ?? "Dislike"}
        isActive={isActive}
        activeColor={COLORS.thumbsDown}
        style={style}
      />
    );
  };

  export const ReadAloudButton: React.FC<{
    onClick?: () => void;
    style?: StyleProp<ViewStyle>;
  }> = ({ onClick, style }) => {
    const config = useAjoraChatConfiguration();
    const labels = config?.labels ?? AjoraChatDefaultLabels;

    return (
      <ToolbarButton
        onPress={onClick}
        icon="volume-high-outline"
        label={labels.assistantMessageToolbarReadAloudLabel ?? "Read aloud"}
        style={style}
      />
    );
  };

  export const RegenerateButton: React.FC<{
    onClick?: () => void;
    style?: StyleProp<ViewStyle>;
  }> = ({ onClick, style }) => {
    const config = useAjoraChatConfiguration();
    const labels = config?.labels ?? AjoraChatDefaultLabels;

    return (
      <ToolbarButton
        onPress={onClick}
        icon="reload-outline"
        label={labels.assistantMessageToolbarRegenerateLabel ?? "Regenerate"}
        style={style}
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
  markdownText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
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
    backgroundColor: COLORS.buttonBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbarButtonActive: {
    backgroundColor: COLORS.buttonBackgroundActive,
  },
  toolbarButtonPressed: {
    backgroundColor: COLORS.buttonBackgroundHover,
    transform: [{ scale: 0.95 }],
  },
  toolbarButtonDisabled: {
    opacity: 0.5,
  },
});

export default AjoraChatAssistantMessage;
