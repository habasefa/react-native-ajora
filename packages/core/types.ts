import { ToolCall } from "@ag-ui/client";
import { z } from "zod";
import type {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";
import type { ComponentProps } from "react";

/**
 * Status of a tool call execution
 */
export enum ToolCallStatus {
  InProgress = "inProgress",
  Executing = "executing",
  Complete = "complete",
}

export type AjoraRuntimeTransport = "rest" | "single";

export type FrontendTool<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  name: string;
  description?: string;
  parameters?: z.ZodType<T>;
  handler?: (args: T, toolCall: ToolCall) => Promise<unknown>;
  followUp?: boolean;
  /**
   * Optional agent ID to constrain this tool to a specific agent.
   * If specified, this tool will only be available to the specified agent.
   */
  agentId?: string;
};

/**
 * Supported icon families from @expo/vector-icons.
 * Limited to most commonly used families for optimal TypeScript performance.
 */
export type IconFamily =
  | "Ionicons"
  | "MaterialIcons"
  | "MaterialCommunityIcons"
  | "Feather";

/**
 * Icon name types extracted from component props (gives proper literal types)
 */
export type IoniconsName = ComponentProps<typeof Ionicons>["name"];
export type MaterialIconsName = ComponentProps<typeof MaterialIcons>["name"];
export type MaterialCommunityIconsName = ComponentProps<
  typeof MaterialCommunityIcons
>["name"];
export type FeatherName = ComponentProps<typeof Feather>["name"];

/**
 * Union of all valid icon names from commonly used @expo/vector-icons families.
 * Note: Due to TypeScript limitations with large unions, some icon names might not autocomplete.
 */
export type IconName =
  | IoniconsName
  | MaterialIconsName
  | MaterialCommunityIconsName
  | FeatherName;

/**
 * Suggestion with type-safe icon and iconFamily support.
 */
export type Suggestion = {
  /** Optional unique identifier for the suggestion */
  id?: string;
  title: string;
  message: string;
  /** Indicates whether this suggestion is still being generated. Defaults to false. */
  isLoading?: boolean;
  /** Icon name from @expo/vector-icons */
  icon?: IconName;
  /** Icon family from @expo/vector-icons */
  iconFamily?: IconFamily;
};

export type SuggestionAvailability =
  | "before-first-message"
  | "after-first-message"
  | "always"
  | "disabled";

export type DynamicSuggestionsConfig = {
  /**
   * A prompt or instructions for the GPT to generate suggestions.
   */
  instructions: string;
  /**
   * The minimum number of suggestions to generate. Defaults to `1`.
   * @default 1
   */
  minSuggestions?: number;
  /**
   * The maximum number of suggestions to generate. Defaults to `3`.
   * @default 1
   */
  maxSuggestions?: number;

  /**
   * When the suggestions are available. Defaults to "after-first-message".
   */
  available?: SuggestionAvailability;

  /**
   * The agent ID of the provider of the suggestions. Defaults to `"default"`.
   */
  providerAgentId?: string;

  /**
   * The agent ID of the consumer of the suggestions. Defaults to `"*"` (all agents).
   */
  consumerAgentId?: string;
};

export type StaticSuggestionsConfig = {
  /**
   * The suggestions to display.
   */
  suggestions: Omit<Suggestion, "isLoading">[];

  /**
   * When the suggestions are available. Defaults to "before-first-message".
   */
  available?: SuggestionAvailability;

  /**
   * The agent ID of the consumer of the suggestions. Defaults to `"*"` (all agents).
   */
  consumerAgentId?: string;
};

export type SuggestionsConfig =
  | DynamicSuggestionsConfig
  | StaticSuggestionsConfig;
