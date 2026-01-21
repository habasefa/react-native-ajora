import { useFrontendTool, useAjoraTheme } from "@ajora-ai/native";
import { ToolCallStatus } from "@ajora-ai/core";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { z } from "zod";

export const useQuoteTool = () => {
  const theme = useAjoraTheme();

  useFrontendTool({
    name: "quoteOfTheDay",
    description: "Get an inspirational quote of the day",
    parameters: z.object({
      category: z
        .enum(["inspirational", "wisdom", "life", "success"])
        .optional()
        .describe("Category of the quote"),
    }),
    handler: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const quotes = [
        {
          text: "The only way to do great work is to love what you do.",
          author: "Steve Jobs",
          category: "Work",
        },
        {
          text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
          author: "Winston Churchill",
          category: "Perseverance",
        },
        {
          text: "In the middle of every difficulty lies opportunity.",
          author: "Albert Einstein",
          category: "Wisdom",
        },
        {
          text: "Believe you can and you're halfway there.",
          author: "Theodore Roosevelt",
          category: "Motivation",
        },
        {
          text: "It does not matter how slowly you go as long as you do not stop.",
          author: "Confucius",
          category: "Wisdom",
        },
      ];

      return quotes[Math.floor(Math.random() * quotes.length)];
    },
    render: ({ status, result }) => {
      const isLoading =
        status === ToolCallStatus.InProgress ||
        status === ToolCallStatus.Executing;

      const styles = StyleSheet.create({
        container: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: "hidden",
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.itemSelected,
        },
        label: {
          fontSize: theme.typography.sizes.xs,
          fontWeight: "600",
          color: theme.colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        badge: {
          backgroundColor: theme.colors.primary,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: 2,
          borderRadius: theme.borderRadius.sm,
        },
        badgeText: {
          fontSize: theme.typography.sizes.xs,
          fontWeight: "600",
          color: theme.colors.surface,
        },
        content: {
          padding: theme.spacing.lg,
        },
        quoteText: {
          fontSize: theme.typography.sizes.lg,
          lineHeight:
            theme.typography.sizes.lg * theme.typography.lineHeights.relaxed,
          color: theme.colors.text,
          fontStyle: "italic",
          textAlign: "center",
        },
        divider: {
          height: 1,
          backgroundColor: theme.colors.border,
          marginVertical: theme.spacing.md,
        },
        footer: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        },
        authorText: {
          fontSize: theme.typography.sizes.sm,
          fontWeight: "500",
          color: theme.colors.textSecondary,
        },
        loaderContainer: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          padding: theme.spacing.lg,
        },
        loaderText: {
          marginLeft: theme.spacing.sm,
          color: theme.colors.textSecondary,
          fontSize: theme.typography.sizes.sm,
        },
      });

      if (isLoading) {
        return (
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.label}>Quote</Text>
            </View>
            <View style={styles.loaderContainer}>
              <ActivityIndicator
                size="small"
                color={theme.colors.textSecondary}
              />
              <Text style={styles.loaderText}>Finding inspiration...</Text>
            </View>
          </View>
        );
      }

      // Parse result - it might be a string or object
      let quote: { text: string; author: string; category?: string } | null =
        null;
      if (result) {
        if (typeof result === "string") {
          try {
            quote = JSON.parse(result);
          } catch {
            quote = { text: result, author: "Unknown" };
          }
        } else {
          quote = result as { text: string; author: string; category?: string };
        }
      }

      if (!quote) {
        return (
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.label}>Quote</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.quoteText}>No quote available</Text>
            </View>
          </View>
        );
      }

      return (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.label}>Quote of the Day</Text>
            {quote.category && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{quote.category}</Text>
              </View>
            )}
          </View>
          <View style={styles.content}>
            <Text style={styles.quoteText}>
              {"\u201C"}
              {quote.text}
              {"\u201D"}
            </Text>
            <View style={styles.divider} />
            <View style={styles.footer}>
              <Text style={styles.authorText}>— {quote.author}</Text>
            </View>
          </View>
        </View>
      );
    },
  });
};
