# React Native Ajora documentation

Ajora is a mobile chat surface for agents exposed by a CopilotKit-compatible
runtime. Start with the quick start, then use the task guides as you customize
the UI and behavior.

## Start here

1. [Install Ajora](getting-started.md) in an Expo or bare React Native app.
2. [Understand the runtime model](core-concepts.md) and connect an agent.
3. [Customize the chat UI](chat-ui.md) or use a complete alternative shell.
4. Add [hooks, tools, and interactive tool UI](hooks-and-tools.md).
5. Browse the [API reference](api-reference.md) when wiring a specific prop.

## Guides

| Guide                                                     | Use it when you need to...                                           |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| [Getting started](getting-started.md)                     | Install peer dependencies and configure native projects              |
| [Core concepts](core-concepts.md)                         | Understand providers, transports, agents, threads, and models        |
| [Chat UI](chat-ui.md)                                     | Choose chat, popup, or sidebar; customize slots and callbacks        |
| [Hooks and tools](hooks-and-tools.md)                     | Attach context, define tools, render tool calls, or request approval |
| [Theming and customization](theming-and-customization.md) | Set themes, override styles, and enable attachment uploads           |
| [API reference](api-reference.md)                         | Look up public props, hook arguments, and return values              |
| [Troubleshooting](troubleshooting.md)                     | Diagnose setup, network, native build, or runtime errors             |

Release notes are maintained in [CHANGELOG.md](../CHANGELOG.md).

## Working from source

See [CONTRIBUTING.md](../CONTRIBUTING.md) for repository setup, test commands,
and the pull request checklist. The [example app](../example-app) is the
minimal integration maintained in this repository.

## Versioning

Documentation on `master` tracks the latest published release. The `dev`
branch may include APIs planned for the next release. If a published version
and these docs disagree, open a documentation issue with the installed version
and the relevant API.
