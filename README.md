## 🚧 Experimental

# 🤖 React Native Ajora

<div align="center">

**The most complete AI agent UI for React Native**

[![npm version](https://badge.fury.io/js/react-native-ajora.svg)](https://badge.fury.io/js/react-native-ajora)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?logo=react&logoColor=61DAFB)](https://reactnative.dev/)

_Build beautiful, intelligent chat interfaces with AI agents in React Native_

</div>

> [!NOTE]
> **Port of CopilotKit**
>
> This library is a React Native port of [CopilotKit](https://docs.copilotkit.ai/). Most concepts, hooks, and patterns from CopilotKit apply here as well. You can refer to the [CopilotKit Documentation](https://docs.copilotkit.ai/) for more in-depth conceptual references and runtime configuration details.

---

## ✨ Features

- 🎨 **Beautiful UI Components** - Pre-built, customizable chat components with modern design
- 🧠 **AI Agent Ready** - Built on top of CopilotKit for robust agent interactions
- 🎯 **TypeScript Support** - Full TypeScript definitions for all components and props
- 🔧 **Highly Customizable** - Extensive customization options via slots and props
- ⚡ **Streaming Support** - Real-time message streaming via Server-Sent Events (SSE)
- 🔌 **Native Tools** - Easy integration of client-side tools with `useFrontendTool`
- 💡 **Smart Suggestions** - Context-aware suggestions using `useConfigureSuggestions`
- 📱 **Mobile First** - Optimized for mobile interactions with keyboard handling and animations

## 🚀 Quick Start

### Installation

```bash
npm install react-native-ajora
# or
yarn add react-native-ajora
```

### Peer Dependencies

Make sure you have these peer dependencies installed:

```bash
npm install expo @expo/vector-icons react-native-reanimated react-native-keyboard-controller react-native-svg react-native-gesture-handler @gorhom/bottom-sheet  expo-document-picker
```

### Basic Usage

Wrap your application with `AjoraProvider` and use the `AjoraChat` component:

```tsx
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AjoraProvider, AjoraChat } from "react-native-ajora";

const App = () => {
  return (
    // Initialize the provider with your agent runtime URL
    <AjoraProvider runtimeUrl="http://localhost:3000/api/copilotkit">
      <SafeAreaView style={{ flex: 1 }}>
        <AjoraChat
          labels={{
            chatEmptyStateTitle: "Hello there! 👋",
            chatEmptyStateSubtitle:
              "I'm your AI assistant. How can I help you today?",
          }}
        />
      </SafeAreaView>
    </AjoraProvider>
  );
};

export default App;
```

## 📖 API Reference

### Components

#### Core Components

- **`AjoraProvider`**: The root provider component. Handles connection to the CopilotKit runtime and manages global agent state.
- **`AjoraChat`**: The main chat interface component. Includes message list, input area, and suggestions.
- **`AjoraPopup`**: A pre-built popup wrapper for the chat interface, useful for "chat bubble" implementations.
- **`AjoraSidebar`**: A sidebar wrapper for the chat interface.

#### UI Building Blocks

Can be used individually or passed as custom slots to `AjoraChat`.

- **`AjoraChatInput`**: The text input component with support for attachments and audio recording.
- **`AjoraChatView`**: The container view for the chat interface.
- **`AjoraChatMessageView`**: Renders a single message bubble (user or assistant).
- **`AjoraChatUserMessage`**: Specific component for user messages.
- **`AjoraChatAssistantMessage`**: Specific component for assistant messages.
- **`AjoraChatThinkingIndicator`**: Animated indicator shown while the agent is processing.
- **`AjoraChatSuggestionView`**: Container for suggestion pills.
- **`AjoraChatSuggestionPill`**: Individual suggestion button.
- **`AjoraChatEmptyState`**: Component shown when there are no messages.
- **`AjoraChatLoadingState`**: Component shown while connecting or loading history.

### Hooks

#### Agent Interaction

- **`useAgent`**: Hook to interact with a specific agent instance. Returns the agent object and its state.
- **`useAgentContext`**: Provides application context to the agent (e.g., current screen, user data).
- **`useFrontendTool`**: Defines a client-side tool that the agent can call.
- **`useMakeCopilotReadable`**: (Alias for `useAgentContext`) Makes data readable by the Copilot.
- **`useCopilotAction`**: (Alias for `useFrontendTool`) Defines an action/tool for the Copilot.
- **`useHumanInTheLoop`**: Hook to handle human-in-the-loop interactions, allowing the AI to ask for user input or confirmation.

#### UI & Presentation

- **`useConfigureSuggestions`**: Configures what kind of suggestions should be generated for the user.
- **`useSuggestions`**: Hook to fetch and manage suggestions.
- **`useRenderToolCall`**: Customizes how specific tool calls are rendered in the chat stream.
- **`useRenderActivityMessage`**: Customizes the rendering of activity/status messages.
- **`useRenderCustomMessages`**: Hook for rendering custom message types.
- **`useKeyboardHeight`**: Utility hook for handling keyboard height (used internally but exported).

### Configuration

#### AjoraProvider Props

| Prop                | Type                     | Description                                                             |
| ------------------- | ------------------------ | ----------------------------------------------------------------------- |
| `runtimeUrl`        | `string`                 | The URL of your CopilotKit runtime API.                                 |
| `useSingleEndpoint` | `boolean`                | Whether to use a single endpoint for all operations (default: `false`). |
| `headers`           | `Record<string, string>` | Custom headers for API requests.                                        |
| `renderToolCalls`   | `ToolCallRenderer[]`     | Custom renderers for tool calls.                                        |
| `agentId`           | `string`                 | helper for the default agentID to use                                   |

#### AjoraChat Props

| Prop                 | Type           | Description                                        |
| -------------------- | -------------- | -------------------------------------------------- |
| `agentId`            | `string`       | The ID of the agent to use.                        |
| `threadId`           | `string`       | The ID of the conversation thread.                 |
| `labels`             | `object`       | Custom labels for UI elements (empty state, etc.). |
| `starterSuggestions` | `Suggestion[]` | Suggestions to show when the chat is empty.        |
| `chatView`           | `Component`    | Slot to replace the entire chat view.              |
| `isLoading`          | `boolean`      | helper for if the chat is loading.                 |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by [Habtamu Asefa](https://github.com/habasefa)**

[⭐ Star us on GitHub](https://github.com/habasefa/react-native-ajora) • [📖 Documentation](https://github.com/habasefa/react-native-ajora#readme) • [🐛 Report Bug](https://github.com/habasefa/react-native-ajora/issues)

</div>
