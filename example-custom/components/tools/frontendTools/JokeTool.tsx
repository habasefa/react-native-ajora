import { useFrontendTool, useAjoraTheme } from "@ajora-ai/native";
import { ToolCallStatus } from "@ajora-ai/core";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { z } from "zod";

export const useJokeTool = () => {
  const theme = useAjoraTheme();

  useFrontendTool({
    name: "tellJoke",
    description: "Tell a well-designed joke to the user",
    parameters: z.object({
      topic: z.string().optional().describe("The topic of the joke"),
      type: z
        .enum(["pun", "knock-knock", "dad-joke", "one-liner"])
        .optional()
        .describe("The type of joke"),
    }),
    handler: async ({ type }) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const jokes: Record<string, { text: string; type: string }[]> = {
        pun: [
          {
            text: "Why don't scientists trust atoms? Because they make up everything!",
            type: "Pun",
          },
          {
            text: "I told my wife she was drawing her eyebrows too high. She looked surprised.",
            type: "Pun",
          },
        ],
        "knock-knock": [
          {
            text: "Knock knock. Who's there? Boo. Boo who? Don't cry, it's just a joke!",
            type: "Knock-knock",
          },
          {
            text: "Knock knock. Who's there? Lettuce. Lettuce who? Lettuce in, it's cold out here!",
            type: "Knock-knock",
          },
        ],
        "dad-joke": [
          {
            text: "I'm reading a book about anti-gravity. It's impossible to put down!",
            type: "Dad Joke",
          },
          {
            text: "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them!",
            type: "Dad Joke",
          },
        ],
        "one-liner": [
          {
            text: "I used to be a baker, but I couldn't make enough dough.",
            type: "One-liner",
          },
          {
            text: "I'm on a seafood diet. I see food and I eat it.",
            type: "One-liner",
          },
        ],
      };

      const selectedType = type || "one-liner";
      const typeJokes = jokes[selectedType] || jokes["one-liner"];
      return typeJokes[Math.floor(Math.random() * typeJokes.length)];
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
          backgroundColor: theme.colors.warning,
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
        },
        text: {
          fontSize: theme.typography.sizes.md,
          lineHeight:
            theme.typography.sizes.md * theme.typography.lineHeights.relaxed,
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
              <Text style={styles.label}>Joke</Text>
            </View>
            <View style={styles.loaderContainer}>
              <ActivityIndicator
                size="small"
                color={theme.colors.textSecondary}
              />
              <Text style={styles.loaderText}>Thinking...</Text>
            </View>
          </View>
        );
      }

      // Parse result - it might be a string or object
      let joke: { text: string; type?: string } | null = null;
      if (result) {
        if (typeof result === "string") {
          try {
            joke = JSON.parse(result);
          } catch {
            joke = { text: result };
          }
        } else {
          joke = result as { text: string; type?: string };
        }
      }

      if (!joke) {
        return (
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.label}>Joke</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.text}>No joke available</Text>
            </View>
          </View>
        );
      }

      return (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.label}>Joke</Text>
            {joke.type && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{joke.type}</Text>
              </View>
            )}
          </View>
          <View style={styles.content}>
            <Text style={styles.text}>{joke.text}</Text>
          </View>
        </View>
      );
    },
  });
};
