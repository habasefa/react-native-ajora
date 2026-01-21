// ============================================================================
// Accessibility Configuration Types
// ============================================================================

/**
 * Accessibility labels for all interactive elements
 */
export interface AjoraAccessibilityLabels {
  /** Send button label */
  sendButton: string;
  /** Stop button label */
  stopButton: string;
  /** Chat input field label */
  chatInput: string;
  /** Chat input hint */
  chatInputHint: string;
  /** Message list label */
  messageList: string;
  /** User message prefix */
  userMessagePrefix: string;
  /** Assistant message prefix */
  assistantMessagePrefix: string;
  /** Attachment button label */
  attachmentButton: string;
  /** Microphone button label */
  microphoneButton: string;
  /** Model selector label */
  modelSelector: string;
  /** Agent selector label */
  agentSelector: string;
  /** Scroll to bottom button */
  scrollToBottomButton: string;
  /** Copy message button */
  copyButton: string;
  /** Regenerate response button */
  regenerateButton: string;
  /** Suggestion pill prefix */
  suggestionPrefix: string;
}

/**
 * Complete accessibility configuration
 */
export interface AjoraAccessibilityConfig {
  /** Custom labels for accessibility */
  labels: AjoraAccessibilityLabels;

  /** Announce new messages to screen readers */
  announceNewMessages: boolean;

  /** Announce when AI is thinking/typing */
  announceThinking: boolean;

  /** Reduce motion for users with vestibular disorders */
  reduceMotion: boolean;

  /** High contrast mode for better visibility */
  highContrast: boolean;

  /** Minimum touch target size in pixels (WCAG recommends 44px) */
  minimumTouchTarget: number;

  /** Enable keyboard navigation */
  keyboardNavigation: boolean;

  /** Focus ring visibility */
  showFocusRing: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default accessibility labels
 */
export const defaultAccessibilityLabels: AjoraAccessibilityLabels = {
  sendButton: "Send message",
  stopButton: "Stop generating",
  chatInput: "Message input",
  chatInputHint: "Type your message here",
  messageList: "Chat messages",
  userMessagePrefix: "You said:",
  assistantMessagePrefix: "Assistant said:",
  attachmentButton: "Add attachment",
  microphoneButton: "Voice input",
  modelSelector: "Select AI model",
  agentSelector: "Select agent",
  scrollToBottomButton: "Scroll to newest messages",
  copyButton: "Copy message",
  regenerateButton: "Regenerate response",
  suggestionPrefix: "Suggestion:",
};

/**
 * Default accessibility configuration
 */
export const defaultAccessibilityConfig: AjoraAccessibilityConfig = {
  labels: defaultAccessibilityLabels,
  announceNewMessages: true,
  announceThinking: true,
  reduceMotion: false,
  highContrast: false,
  minimumTouchTarget: 44,
  keyboardNavigation: true,
  showFocusRing: true,
};

// ============================================================================
// High Contrast Theme Overrides
// ============================================================================

/**
 * Color overrides for high contrast mode
 */
export const highContrastColorOverrides = {
  light: {
    text: "#000000",
    textSecondary: "#1A1A1A",
    border: "#000000",
    userBubble: "#000000",
    userBubbleText: "#FFFFFF",
    assistantBubble: "#FFFFFF",
    assistantBubbleText: "#000000",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#E0E0E0",
    border: "#FFFFFF",
    userBubble: "#FFFFFF",
    userBubbleText: "#000000",
    assistantBubble: "#000000",
    assistantBubbleText: "#FFFFFF",
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create custom accessibility config by merging with defaults
 */
export function createAccessibilityConfig(
  customConfig: Partial<AjoraAccessibilityConfig>,
): AjoraAccessibilityConfig {
  return {
    ...defaultAccessibilityConfig,
    ...customConfig,
    labels: {
      ...defaultAccessibilityLabels,
      ...(customConfig.labels ?? {}),
    },
  };
}

/**
 * Generate screen reader announcement for a new message
 */
export function getMessageAnnouncement(
  role: "user" | "assistant",
  content: string,
  labels: AjoraAccessibilityLabels,
): string {
  const prefix =
    role === "user" ? labels.userMessagePrefix : labels.assistantMessagePrefix;

  // Truncate very long messages for announcements
  const truncatedContent =
    content.length > 200 ? content.substring(0, 200) + "..." : content;

  return `${prefix} ${truncatedContent}`;
}
