# Core concepts

Ajora separates mobile presentation from agent execution. The app owns the
runtime URL, authentication, and product UI. The runtime owns agents, models,
runs, and persistence. Ajora connects those pieces through a provider and
React hooks.

## Architecture

```text
Your screens and hooks
        |
        v
AjoraProvider  --->  CopilotKit-compatible runtime
        |                         |
        |                         +--> agent "default"
        |                         +--> agent "support"
        |                         +--> models and threads
        v
AjoraChat / AjoraPopup / AjoraSidebar
        |
        +--> messages, suggestions, tools, history, and UI slots
```

There is no bundled backend. A chat cannot send a turn until `runtimeUrl`
points to a compatible service.

## The provider

`AjoraProvider` is the root state boundary. It creates the Ajora core client,
shares it through context, and updates the client when runtime props change.
Place it above every Ajora component and hook.

```tsx
<AjoraProvider
  runtimeUrl="https://api.example.com/copilotkit"
  useSingleEndpoint
  headers={{ Authorization: `Bearer ${token}` }}
>
  <App />
</AjoraProvider>
```

The provider accepts three main connection configurations:

- `runtimeUrl` for an application-hosted runtime.
- `agents__unsafe_dev_only` for local development agents. This is not a
  production multi-user runtime.
- `properties` for values forwarded with runtime operations.

At least one of `runtimeUrl` or a local agent is required in production.

## Runtime transports

Ajora supports two transports:

| `useSingleEndpoint` | Behavior              | Typical use                      |
| ------------------- | --------------------- | -------------------------------- |
| `false` or omitted  | REST endpoints        | Default Ajora/CopilotKit runtime |
| `true`              | Single AG-UI endpoint | Single-endpoint runtime servers  |

The value must match the server. A mismatch usually appears as a failed
connection, missing agent metadata, or a 404 on the first agent operation.

The [AG-UI protocol](https://docs.ag-ui.com/) defines the event stream used to
carry runs. Ajora is inspired by CopilotKit and uses compatible runtime
patterns; verify endpoint behavior against the runtime version you deploy.

## Agents

An agent is an executable assistant exposed by the runtime. `agentId` selects
which one the UI should use.

```tsx
<AjoraChat agentId="support" />
```

If `agentId` is omitted, Ajora uses the shared default ID (`default`). The ID
must exist in the runtime's agent list. Tool and renderer registrations can
also be scoped to an agent, which prevents a mobile-specific action from
appearing in another agent's session.

Use `useAgent` outside `AjoraChat` when you need to inspect messages or run an
agent from your own UI:

```tsx
function AgentStatus() {
  const { agent } = useAgent({ agentId: "default" });

  return <Text>{agent.isRunning ? "Running" : "Ready"}</Text>;
}
```

Only call `useAgent`, `useHistory`, `useThreads`, and other Ajora hooks under
an `AjoraProvider`.

## Threads

A thread identifies one persisted conversation. `AjoraChat` creates a UUID
when no `threadId` is provided and connects that thread on mount.

Pass a stable ID when your app owns navigation:

```tsx
const [activeThreadId, setActiveThreadId] = useState<string | undefined>();

<AjoraChat
  agentId="default"
  threadId={activeThreadId}
  inputProps={{ value: draft, onChange: setDraft }}
/>;
```

Changing `threadId` switches the connected agent thread and loads its recent
history. For custom message lists, pass the same `threadId` to chat view
history props so scroll state and pagination stay associated with the right
conversation.

`useHistory` exposes initial loading, older-page loading, retry, and pagination
for custom UIs. `useThreads` is an optional convenience for servers that expose
Ajora's thread-listing endpoints and requires a `resourceId`.

## Models

The runtime reports available models to Ajora. Pass a model ID to run a turn:

```tsx
<AjoraChat modelId="your-model-id" />
```

If no valid model is supplied, Ajora prefers an available free model and then
falls back to the first registered model. Do not send the literal placeholder
`"default"` as a real model ID.

Use `inputProps.selectedModelId`, `inputProps.models`, and
`inputProps.onModelSelect` to build a controlled model picker.

## Composer state

`AjoraChat` manages a per-thread draft when you do not supply a controlled
composer:

```tsx
<AjoraChat />
```

To own the value, use the input props:

```tsx
<AjoraChat
  inputProps={{
    value: message,
    onChange: setMessage,
    placeholder: "Message support...",
  }}
/>
```

The `onSubmitMessage` callback is supplied by `AjoraChat`; you normally should
not replace it when using the bundled chat.

## Connection states

The chat can render before the runtime's agent list is available. Ajora uses a
provisional runtime agent during connection, then replaces it with the real
agent after synchronization. If the agent never appears, Ajora reports the
configured runtime URL and the known agent IDs.

This distinction matters for custom loading UI:

- **Connecting:** the runtime is being synchronized.
- **Loading history:** the active thread's messages are being fetched.
- **Running:** the current agent run is producing a response.

Use `AjoraChat.isLoading` only for app-owned initialization. The bundled view
already presents connection and history states.

## State ownership

Keep these values outside the chat component when they drive navigation:

- selected agent ID
- selected model ID
- active thread ID
- conversation list and pagination
- authentication token

Keep tool schemas and renderers stable. Register dynamic changes through
`useFrontendTool` rather than rebuilding the provider's renderer arrays on
every render.

## Next

- Build the [chat screen or shell](chat-ui.md).
- Add [agent context and tools](hooks-and-tools.md).
- Review [provider and chat props](api-reference.md).
