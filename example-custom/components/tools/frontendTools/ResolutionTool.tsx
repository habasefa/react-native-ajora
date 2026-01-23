import { useFrontendTool, useAjoraTheme } from "@ajora-ai/native";
import { ToolCallStatus } from "@ajora-ai/core";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { z } from "zod";

export const useResolutionTool = () => {
  const theme = useAjoraTheme();

  useFrontendTool({
    name: "newYearResolution",
    description: "Generate a new year resolution",
    parameters: z.object({}),
    handler: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const resolutions = [
        { text: "Learn a new language", category: "Personal Growth" },
        { text: "Read 12 books this year", category: "Education" },
        { text: "Start a daily meditation habit", category: "Wellness" },
        { text: "Exercise 3 times a week", category: "Health" },
        { text: "Learn to cook a new dish every month", category: "Skills" },
        { text: "Save 10% of my income", category: "Finance" },
        { text: "Volunteer at a local charity", category: "Community" },
        { text: "Reduce screen time by 1 hour daily", category: "Wellness" },
      ];

      return resolutions[Math.floor(Math.random() * resolutions.length)];
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
          backgroundColor: theme.colors.success,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: 2,
          borderRadius: theme.borderRadius.sm,
        },
        badgeText: {
          fontSize: theme.typography.sizes.xs,
          fontWeight: "600",
          color: "#FFFFFF",
        },
        content: {
          padding: theme.spacing.lg,
          alignItems: "center",
        },
        resolutionText: {
          fontSize: theme.typography.sizes.xl,
          fontWeight: "600",
          color: theme.colors.text,
          textAlign: "center",
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
              <Text style={styles.label}>Resolution</Text>
            </View>
            <View style={styles.loaderContainer}>
              <ActivityIndicator
                size="small"
                color={theme.colors.textSecondary}
              />
              <Text style={styles.loaderText}>Generating...</Text>
            </View>
          </View>
        );
      }

      // Parse result - it might be a string or object
      let resolution: { text: string; category?: string } | null = null;
      if (result) {
        if (typeof result === "string") {
          try {
            resolution = JSON.parse(result);
          } catch {
            resolution = { text: result };
          }
        } else {
          resolution = result as { text: string; category?: string };
        }
      }

      if (!resolution) {
        return (
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.label}>Resolution</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.resolutionText}>No resolution available</Text>
            </View>
          </View>
        );
      }

      return (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.label}>New Year Resolution</Text>
            {resolution.category && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{resolution.category}</Text>
              </View>
            )}
          </View>
          <View style={styles.content}>
            <Text style={styles.resolutionText}>{resolution.text}</Text>
          </View>
        </View>
      );
    },
  });
};
