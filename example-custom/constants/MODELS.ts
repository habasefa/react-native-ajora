import { ModelOption } from "@ajora-ai/native";

// Demo models showcasing isDisabled and isNew fields
export const DEMO_MODELS: ModelOption[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Most capable model",
    badge: "New",
  },
  {
    id: "claude-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Great for analysis",
  },
  {
    id: "gemini-pro",
    name: "Gemini 2.0 Flash",
    provider: "google",
    description: "Fast responses",
  },
  {
    id: "o1-preview",
    name: "o1 Preview",
    provider: "openai",
    description: "Advanced reasoning",
    isDisabled: true,
    extraData: { reason: "Coming soon" },
  },
  {
    id: "claude-opus",
    name: "Claude 3 Opus",
    provider: "anthropic",
    description: "Premium model",
    isDisabled: true,
    badge: "Pro",
    extraData: { subscriptionRequired: "pro" },
  },
];
