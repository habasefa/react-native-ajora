import { AgentOption } from "@ajora-ai/native";

// Demo agents showcasing isDisabled and isNew fields
export const DEMO_AGENTS: AgentOption[] = [
  {
    id: "general",
    name: "General Assistant",
    description: "All-purpose AI assistant",
    icon: "chatbubble-outline",
  },
  {
    id: "researcher",
    name: "Research Agent",
    description: "Deep research and analysis",
    icon: "search-outline",
    badge: "New",
  },
  {
    id: "coder",
    name: "Code Agent",
    description: "Programming assistance",
    icon: "code-slash-outline",
  },
  {
    id: "creative",
    name: "Creative Agent",
    description: "Coming soon - Premium feature",
    icon: "bulb-outline",
    isDisabled: true,
    extraData: { tier: "premium" },
  },
];
