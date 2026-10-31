# Hooks and tools

Hooks let you connect application state and native UI to an agent. All hooks
that read agent state must be rendered beneath `AjoraProvider`; hooks that use
the active chat configuration also need to be beneath `AjoraChat`,
`AjoraPopup`, or `AjoraSidebar`.

## Hook map

| Hook                       | What it does                                                    |
| -------------------------- | --------------------------------------------------------------- |
| `useAgent`                 | Returns an agent instance and subscribes to selected updates    |
| `useAgentContext`          | Makes JSON-serializable app state available to the agent        |
| `useFrontendTool`          | Registers a client-side tool and optional renderer              |
| `useHumanInTheLoop`        | Registers an interactive tool whose handler waits for UI input  |
| `useSuggestions`           | Reads, reloads, and clears suggestions                          |
| `useConfigureSuggestions`  | Registers dynamic or static suggestion configuration            |
| `useHistory`               | Loads and paginates persisted thread messages                   |
| `useThreads`               | Lists and creates threads on servers that expose the thread API |
| `useLiveThinking`          | Reads the current in-flight thinking stream                     |
| `useAttachmentUploader`    | Owns upload validation, cancellation, progress, and retry state |
| `useAjoraHaptics`          | Provides preference-gated native haptic callbacks               |
| `useRenderToolCall`        | Returns the active tool-call renderer function                  |
| `useRenderActivityMessage` | Returns the active activity-message renderer function           |
| `useRenderCustomMessages`  | Returns the active custom-message renderer function             |

## Read an agent

```tsx
import { UseAgentUpdate, useAgent } from "react-native-ajora";
import { Text } from "react-native";

export function MessageCount() {
  const { agent } = useAgent({
    agentId: "default",
    updates: [
      UseAgentUpdate.OnMessagesChanged,
      UseAgentUpdate.OnRunStatusChanged,
    ],
  });

  return <Text>{agent.messages.length} messages</Text>;
}
```

Omit `updates` to subscribe to messages, state, and run status. Pass
`updates: []` when you only need the agent reference and do not want the hook
to trigger UI updates.

## Provide app context

`useAgentContext` adds serializable context while the component is mounted:

```tsx
import { useAgentContext } from "react-native-ajora";

export function AccountContext({ account }: { account: Account }) {
  useAgentContext({
    description: "The signed-in account and current subscription plan",
    value: {
      id: account.id,
      plan: account.plan,
      locale: account.locale,
    },
  });

  return null;
}
```

The description should tell the model how to interpret the value. The value
must be JSON-serializable. Do not put tokens, passwords, or sensitive data in
client context unless your runtime and privacy model are designed for it.

## Define a frontend tool

Frontend tools are executed in the mobile app. Declare the same tool name and
arguments in the agent's tool catalog, then register the mobile handler:

```tsx
import { useFrontendTool } from "react-native-ajora";
import { Linking } from "react-native";
import { z } from "zod";

const openOrderArgs = z.object({
  orderId: z.string().describe("The order to open"),
});

export function OrderTool() {
  useFrontendTool({
    name: "open_order",
    description: "Open an order in the native account screen",
    parameters: openOrderArgs,
    handler: async ({ orderId }) => {
      await Linking.openURL(`myapp://orders/${orderId}`);
      return { opened: true };
    },
  });

  return null;
}
```

Important properties:

- `name` identifies the tool and should be stable.
- `description` helps the agent decide when to call it.
- `parameters` is a Zod schema used for typing and rendering.
- `handler` returns a value that becomes the tool result.
- `followUp` can request a follow-up agent turn when supported by the runtime.
- `agentId` scopes the tool to one agent.

Use the optional dependency array when the registration depends on changing
non-function values:

```tsx
function WorkspaceOrderTool({
  selectedWorkspaceId,
}: {
  selectedWorkspaceId: string;
}) {
  useFrontendTool(
    {
      name: "open_workspace_order",
      description: "Open the selected workspace's order",
      handler: async () => ({ workspaceId: selectedWorkspaceId }),
    },
    [selectedWorkspaceId],
  );

  return null;
}
```

Tool handlers should be small, fail safely, and never assume that model-provided
arguments are trusted authorization. Check permissions in your APIs.

## Render a tool call

Attach `render` to the tool to replace the default tool UI:

```tsx
const argsSchema = z.object({ orderId: z.string() });

function OrderToolWithRenderer() {
  useFrontendTool({
    name: "open_order",
    description: "Open an order",
    parameters: argsSchema,
    handler: async ({ orderId }) => ({ orderId }),
    render: ({ args, status, result }) => {
      if (status === "inProgress") {
        return <Text>Preparing order {args.orderId}...</Text>;
      }
      if (status === "executing") {
        return <Spinner label={`Opening ${args.orderId}`} />;
      }
      return <Text>Order result: {result}</Text>;
    },
  });

  return null;
}
```

The renderer receives a discriminated status:

| Status       | Meaning                               | Argument type       |
| ------------ | ------------------------------------- | ------------------- |
| `inProgress` | Tool arguments may still be streaming | `Partial<T>`        |
| `executing`  | The client handler is running         | `T`                 |
| `complete`   | The tool result is available          | `T` + string result |

Only access required fields after the status becomes `executing`. Keep the
renderer cheap because partial arguments can arrive incrementally.

## Ask for human approval

`useHumanInTheLoop` registers a tool whose handler resolves only when your
component calls `respond`:

```tsx
import { useHumanInTheLoop } from "react-native-ajora";
import { Button, Text, View } from "react-native";
import { z } from "zod";

type RefundArgs = { orderId: string; amount: number };

function RefundApproval({
  args,
  status,
  respond,
}: {
  args: Partial<RefundArgs>;
  status: "inProgress" | "executing" | "complete";
  respond?: (result: unknown) => Promise<void>;
}) {
  if (status === "inProgress") {
    return <Text>Preparing refund request...</Text>;
  }
  if (status === "complete") {
    return <Text>Refund request completed.</Text>;
  }

  return (
    <View>
      <Text>
        Refund {args.amount} for order {args.orderId}?
      </Text>
      <Button title="Approve" onPress={() => respond?.({ approved: true })} />
      <Button title="Decline" onPress={() => respond?.({ approved: false })} />
    </View>
  );
}

export function RefundTool() {
  useHumanInTheLoop<RefundArgs>({
    name: "request_refund",
    description: "Ask the user to approve a refund",
    parameters: z.object({
      orderId: z.string(),
      amount: z.number().nonnegative(),
    }),
    render: RefundApproval,
  });

  return null;
}
```

The tool remains pending while `respond` is unset. Disable or remove duplicate
actions after responding so one user decision cannot resolve the same tool call
twice.

## Renderer arrays

The provider can register renderers without hooks:

```tsx
<AjoraProvider
  runtimeUrl={runtimeUrl}
  renderToolCalls={toolRenderers}
  renderActivityMessages={activityRenderers}
  renderCustomMessages={customMessageRenderers}
>
  {children}
</AjoraProvider>
```

These arrays must be stable. Register runtime-changing tools with
`useFrontendTool`. A wildcard tool renderer can be defined with the tool name
`"*"` and `defineToolCallRenderer`.

## Suggestions

Read suggestions in custom UI:

```tsx
function SuggestionsStatus() {
  const { suggestions, isLoading, reloadSuggestions } = useSuggestions({
    agentId: "default",
  });

  return <Text>{isLoading ? "Loading" : `${suggestions.length} ideas`}</Text>;
}
```

Configure generated suggestions:

```tsx
function FollowUpSuggestions() {
  useConfigureSuggestions({
    instructions: "Suggest concise follow-up questions.",
    minSuggestions: 1,
    maxSuggestions: 3,
    available: "after-first-message",
    consumerAgentId: "default",
  });

  return null;
}
```

Or provide static suggestions:

```tsx
function StaticSuggestions() {
  useConfigureSuggestions({
    suggestions: [
      { title: "Track order", message: "Where is my order?" },
      { title: "Returns", message: "How do returns work?" },
    ],
    available: "before-first-message",
  });

  return null;
}
```

## History and threads

See [Chat UI: History](chat-ui.md#history) for `useHistory`.

`useThreads` is optional and server-specific:

```tsx
function ThreadList({ currentUserId }: { currentUserId: string }) {
  const { threads, isLoading, hasMore, loadMore } = useThreads({
    agentId: "default",
    resourceId: currentUserId,
    pageSize: 20,
  });

  return isLoading ? <Spinner /> : <ThreadPicker threads={threads} />;
}
```

Use one stable `resourceId` per user scope. The runtime must expose compatible
thread endpoints; otherwise implement thread listing in your own service layer
and feed the resulting IDs into `AjoraChat`.

## Thinking and haptics

When the runtime emits AG-UI thinking events, `useLiveThinking` returns:

```tsx
function ThinkingStatus() {
  const { title, text, isActive } = useLiveThinking({ agentId: "default" });

  return isActive ? <Text>{title ?? text}</Text> : null;
}
```

Thinking can contain sensitive model output. Render it only after an explicit
product and privacy decision.

Haptics are off by default. Opt in at the provider and install `expo-haptics`:

```tsx
<AjoraProvider runtimeUrl={runtimeUrl} preferences={{ hapticsEnabled: true }}>
  {children}
</AjoraProvider>
```

Use `useAjoraHaptics()` for your own preference-consistent feedback.

## Next

- Apply [themes and uploader configuration](theming-and-customization.md).
- Check exact hook signatures in the [API reference](api-reference.md).
