<div align="center">

# React Native Ajora

**Build polished AI agent chat experiences for React Native and Expo.**

[![npm version](https://img.shields.io/npm/v/react-native-ajora.svg)](https://www.npmjs.com/package/react-native-ajora)
[![npm downloads](https://img.shields.io/npm/dm/react-native-ajora.svg)](https://www.npmjs.com/package/react-native-ajora)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178C6.svg)](https://www.typescriptlang.org/)

[Documentation](https://github.com/habasefa/react-native-ajora/tree/dev/docs) ·
[Quick start](https://github.com/habasefa/react-native-ajora/blob/dev/docs/getting-started.md) ·
[API reference](https://github.com/habasefa/react-native-ajora/blob/dev/docs/api-reference.md) ·
[Examples](https://github.com/habasefa/react-native-ajora/tree/dev/example-app)

<img src="https://raw.githubusercontent.com/habasefa/react-native-ajora/dev/media/photo_2025-09-20_09-43-38.jpg" alt="Ajora chat interface on iOS" width="360" />

</div>

> **Experimental:** Ajora is pre-1.0 and under active development. Pin a
> version and review release notes before upgrading. Public APIs may change
> between minor releases.

Ajora gives mobile teams a customizable chat interface, streaming agent state,
frontend tools, human-in-the-loop interactions, and mobile-focused behavior
without rebuilding conversation UI from scratch.

## Why Ajora

- **Chat UI that feels native:** streaming messages, suggestions, history
  pagination, keyboard handling, attachments, and accessible controls.
- **Agent-aware hooks:** connect UI state to agents, context, tools, models,
  and threads with typed React hooks.
- **Customization at every level:** use the complete experience, compose
  individual components, replace slots, or apply a full theme.
- **Runtime flexibility:** connect to a CopilotKit-compatible runtime over
  AG-UI using REST or single-endpoint transport.
- **Expo first:** designed and tested with current Expo and React Native
  releases. Use a development build when a native dependency is unavailable
  in Expo Go.

## Install

```bash
npm install react-native-ajora
```

Ajora has native peer dependencies. Expo users should install the matching
versions with Expo's installer:

```bash
npx expo install \
  expo react-native-reanimated react-native-keyboard-controller \
  react-native-svg react-native-gesture-handler react-native-safe-area-context \
  @gorhom/bottom-sheet @shopify/flash-list moti \
  expo-clipboard expo-document-picker expo-file-system expo-image-picker \
  expo-linear-gradient expo-linking @expo/react-native-action-sheet
```

Install the bundled vector-icon families used by the default components:

```bash
npm install \
  @react-native-vector-icons/ant-design \
  @react-native-vector-icons/entypo \
  @react-native-vector-icons/evil-icons \
  @react-native-vector-icons/feather \
  @react-native-vector-icons/fontawesome \
  @react-native-vector-icons/fontawesome5 \
  @react-native-vector-icons/fontawesome6 \
  @react-native-vector-icons/foundation \
  @react-native-vector-icons/ionicons \
  @react-native-vector-icons/material-design-icons \
  @react-native-vector-icons/material-icons \
  @react-native-vector-icons/octicons \
  @react-native-vector-icons/simple-line-icons \
  @react-native-vector-icons/zocial
```

See the [installation guide](https://github.com/habasefa/react-native-ajora/blob/dev/docs/getting-started.md)
for the required Expo plugin configuration and bare React Native setup.

## Quick start

```tsx
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  AjoraChat,
  AjoraProvider,
  AjoraThemeProvider,
} from "react-native-ajora";

const runtimeUrl = process.env.EXPO_PUBLIC_RUNTIME_URL;

export default function App() {
  if (!runtimeUrl) {
    throw new Error("Set EXPO_PUBLIC_RUNTIME_URL before starting the app.");
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AjoraProvider runtimeUrl={runtimeUrl} useSingleEndpoint>
          <AjoraThemeProvider>
            <SafeAreaView style={{ flex: 1 }}>
              <AjoraChat
                agentId="default"
                labels={{
                  chatEmptyStateTitle: "How can I help?",
                  chatEmptyStateSubtitle:
                    "Ask a question or choose a suggestion below.",
                }}
              />
            </SafeAreaView>
          </AjoraThemeProvider>
        </AjoraProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

Your runtime must expose an agent with the matching `agentId`. Use a URL that
is reachable from the device: `localhost` works on an iOS Simulator, but not
from a physical phone unless your development server is reachable on the LAN.

## Core concepts

| Piece            | Responsibility                                                                  |
| ---------------- | ------------------------------------------------------------------------------- |
| `AjoraProvider`  | Connects the app to your runtime and owns shared agent/tool state.              |
| `AjoraChat`      | Loads the agent, connects a thread, renders messages, and sends turns.          |
| Hooks            | Attach context, tools, suggestions, rendering, threading, and history behavior. |
| Slots and themes | Replace or style the default UI without forking the package.                    |

Read [Core concepts](https://github.com/habasefa/react-native-ajora/blob/dev/docs/core-concepts.md)
for the runtime lifecycle and the relationship between agents, threads, and
models.

## Documentation

| Guide                                                                                                | What it covers                                                  |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [Getting started](https://github.com/habasefa/react-native-ajora/blob/dev/docs/getting-started.md)   | Complete Expo and bare React Native setup                       |
| [Core concepts](https://github.com/habasefa/react-native-ajora/blob/dev/docs/core-concepts.md)       | Providers, runtime transports, agents, threads, and models      |
| [Chat UI](https://github.com/habasefa/react-native-ajora/blob/dev/docs/chat-ui.md)                   | Chat variants, slots, callbacks, history, and suggestions       |
| [Hooks and tools](https://github.com/habasefa/react-native-ajora/blob/dev/docs/hooks-and-tools.md)   | Agent context, frontend tools, rendering, and human-in-the-loop |
| [Theming](https://github.com/habasefa/react-native-ajora/blob/dev/docs/theming-and-customization.md) | Presets, custom themes, style overrides, and attachments        |
| [API reference](https://github.com/habasefa/react-native-ajora/blob/dev/docs/api-reference.md)       | Public components, props, hooks, and return values              |
| [Troubleshooting](https://github.com/habasefa/react-native-ajora/blob/dev/docs/troubleshooting.md)   | Setup, networking, Metro, native build, and runtime issues      |

Release history is recorded in [CHANGELOG.md](https://github.com/habasefa/react-native-ajora/blob/dev/CHANGELOG.md).

## Examples

The [`example-app`](https://github.com/habasefa/react-native-ajora/tree/dev/example-app)
is the smallest supported Expo integration. It demonstrates the provider,
single-endpoint transport, and the default chat UI.

## Compatibility

| Requirement  | Supported baseline                    |
| ------------ | ------------------------------------- |
| Node.js      | 18 or newer                           |
| React Native | 0.81 or newer                         |
| React        | 18 or newer; React 19 recommended     |
| Expo         | SDK 54 is the current tested baseline |

New architecture and Expo Go support depend on your installed native
dependencies. Check the generated Expo compatibility output and run a
development build before shipping native changes.

## Contributing

Issues, examples, and pull requests are welcome. Read
[CONTRIBUTING.md](https://github.com/habasefa/react-native-ajora/blob/dev/CONTRIBUTING.md)
before opening a PR and use the repository templates to include a focused
reproduction or a complete change description.

For security-sensitive reports, follow [SECURITY.md](https://github.com/habasefa/react-native-ajora/blob/dev/SECURITY.md).

## License

[MIT](https://github.com/habasefa/react-native-ajora/blob/dev/LICENSE) ©
[Habtamu Asefa](https://github.com/habasefa)
