import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";
import {
  useAjoraChatConfiguration,
  AjoraChatDefaultLabels,
} from "../../providers/AjoraChatConfigurationProvider";
import type { ThinkingBlock } from "../../types/thinking";

// ============================================================================
// Types
// ============================================================================

export interface AjoraChatThoughtsBubbleColors {
  background?: string;
  border?: string;
  title?: string;
  meta?: string;
  text?: string;
  icon?: string;
}

export interface AjoraChatThoughtsBubbleProps {
  /** The persisted thinking block attached to the assistant message. */
  thinking?: ThinkingBlock;
  /** Whether the bubble starts expanded. Defaults to false (collapsed). */
  defaultExpanded?: boolean;
  /** Theme overrides. */
  colors?: AjoraChatThoughtsBubbleColors;
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
}

// ============================================================================
// Helpers
// ============================================================================

// Compact, human-friendly duration. Covers the common cases without pulling
// a date library: < 1s reads as "<1s", < 60s as integer seconds, otherwise
// "Xm Ys". Returns null when the block hasn't ended yet so the caller can
// suppress the duration line during streaming.
export function formatThoughtsDuration(
  startedAt?: number,
  endedAt?: number,
): string | null {
  if (startedAt == null || endedAt == null || endedAt < startedAt) return null;
  const ms = endedAt - startedAt;
  if (ms < 1000) return "<1s";
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

// ============================================================================
// Component
// ============================================================================

export function AjoraChatThoughtsBubble({
  thinking,
  defaultExpanded = false,
  colors: colorOverrides,
  style,
}: AjoraChatThoughtsBubbleProps) {
  const theme = useAjoraTheme();
  const config = useAjoraChatConfiguration();
  const labels = config?.labels ?? AjoraChatDefaultLabels;

  const [expanded, setExpanded] = useState(defaultExpanded);
  const toggle = useCallback(() => setExpanded((v) => !v), []);

  // Bail out before computing colors so we don't allocate work for a no-op
  // render. The trim guard avoids showing an empty bubble for malformed
  // server payloads (text: "").
  if (!thinking || !thinking.text || !thinking.text.trim()) return null;

  const colors = {
    background: colorOverrides?.background ?? theme.colors.surface,
    border: colorOverrides?.border ?? theme.colors.border,
    title: colorOverrides?.title ?? theme.colors.text,
    meta: colorOverrides?.meta ?? theme.colors.textSecondary,
    text: colorOverrides?.text ?? theme.colors.textSecondary,
    icon: colorOverrides?.icon ?? theme.colors.iconDefault,
  };

  const title = thinking.title?.trim() || labels.assistantMessageThoughtsLabel;
  const duration = formatThoughtsDuration(thinking.startedAt, thinking.endedAt);
  const metaLine = duration
    ? `${labels.assistantMessageThoughtsDurationLabel} ${duration}`
    : null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, borderColor: colors.border },
        style,
      ]}
    >
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}${metaLine ? `, ${metaLine}` : ""}`}
        style={styles.header}
      >
        <Ionicons
          name="bulb-outline"
          size={14}
          color={colors.icon}
          style={styles.headerIcon}
        />
        <View style={styles.headerText}>
          <Text
            style={[styles.title, { color: colors.title }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {metaLine ? (
            <Text
              style={[styles.meta, { color: colors.meta }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {metaLine}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.icon}
        />
      </Pressable>
      {expanded ? (
        <View style={[styles.body, { borderTopColor: colors.border }]}>
          <Text
            style={[styles.text, { color: colors.text }]}
            selectable
          >
            {thinking.text}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerIcon: {
    marginRight: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
  },
  meta: {
    fontSize: 11,
    marginTop: 2,
  },
  body: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  text: {
    fontSize: 13,
    lineHeight: 19,
  },
});

export default AjoraChatThoughtsBubble;
