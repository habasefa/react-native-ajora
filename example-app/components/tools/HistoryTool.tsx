import { useFrontendTool, useAjoraTheme } from "@ajora-ai/native";
import { ToolCallStatus } from "@ajora-ai/core";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { z } from "zod";

export const useHistoryTool = () => {
  const theme = useAjoraTheme();

  useFrontendTool({
    name: "menInHistory",
    description: "Learn about influential men in history",
    parameters: z.object({
      period: z.string().optional().describe("Historical period"),
    }),
    handler: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const figures = [
        {
          name: "Leonardo da Vinci",
          era: "1452 – 1519",
          field: "Polymath",
          fact: "A polymath of the Italian Renaissance, he painted the Mona Lisa and designed flying machines centuries before they were built.",
        },
        {
          name: "Isaac Newton",
          era: "1643 – 1727",
          field: "Physics",
          fact: "Formulated the laws of motion and universal gravitation, laying the groundwork for classical mechanics.",
        },
        {
          name: "Nelson Mandela",
          era: "1918 – 2013",
          field: "Leadership",
          fact: "A South African anti-apartheid revolutionary who became the country's first black head of state.",
        },
        {
          name: "Albert Einstein",
          era: "1879 – 1955",
          field: "Physics",
          fact: "Developed the theory of relativity, one of the two pillars of modern physics.",
        },
      ];

      return figures[Math.floor(Math.random() * figures.length)];
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
          padding: theme.spacing.md,
        },
        nameRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: theme.spacing.xs,
        },
        personName: {
          fontSize: theme.typography.sizes.lg,
          fontWeight: "600",
          color: theme.colors.text,
        },
        personEra: {
          fontSize: theme.typography.sizes.sm,
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing.md,
        },
        divider: {
          height: 1,
          backgroundColor: theme.colors.border,
          marginBottom: theme.spacing.md,
        },
        factText: {
          fontSize: theme.typography.sizes.md,
          lineHeight:
            theme.typography.sizes.md * theme.typography.lineHeights.relaxed,
          color: theme.colors.text,
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
              <Text style={styles.label}>History</Text>
            </View>
            <View style={styles.loaderContainer}>
              <ActivityIndicator
                size="small"
                color={theme.colors.textSecondary}
              />
              <Text style={styles.loaderText}>Loading...</Text>
            </View>
          </View>
        );
      }

      // Parse result - it might be a string or object
      let person: {
        name: string;
        era: string;
        field?: string;
        fact: string;
      } | null = null;
      if (result) {
        if (typeof result === "string") {
          try {
            person = JSON.parse(result);
          } catch {
            person = null;
          }
        } else {
          person = result as {
            name: string;
            era: string;
            field?: string;
            fact: string;
          };
        }
      }

      if (!person) {
        return (
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.label}>History</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.factText}>No data available</Text>
            </View>
          </View>
        );
      }

      return (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.label}>Men in History</Text>
            {person.field && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{person.field}</Text>
              </View>
            )}
          </View>
          <View style={styles.content}>
            <View style={styles.nameRow}>
              <Text style={styles.personName}>{person.name}</Text>
            </View>
            <Text style={styles.personEra}>{person.era}</Text>
            <View style={styles.divider} />
            <Text style={styles.factText}>{person.fact}</Text>
          </View>
        </View>
      );
    },
  });
};
