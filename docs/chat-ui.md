# Chat UI

Ajora provides three complete shells and a set of lower-level components:

- `AjoraChat`: a full-screen chat.
- `AjoraPopup`: a modal chat opened by a floating toggle.
- `AjoraSidebar`: a collapsed input bar that opens a bottom sheet.

All three use the same connection, history, suggestions, and tool rendering.

## Full-screen chat

```tsx
<AjoraChat
  agentId="default"
  threadId={activeThreadId}
  labels={{
    chatInputPlaceholder: "Ask about your account...",
    chatDisclaimerText: "AI can make mistakes. Check important information.",
  }}
/>
```

The parent must give the chat a bounded height. A safe pattern is:

```tsx
<SafeAreaView style={{ flex: 1 }}>
  <AjoraChat style={{ flex: 1 }} />
</SafeAreaView>
```

## Floating popup

`AjoraPopup` renders a toggle button and a modal containing the chat. The
default state is open; set `defaultOpen={false}` for a closed launcher:

```tsx
export function SupportRoot() {
  return (
    <View style={{ flex: 1 }}>
      <AppNavigator />
      <AjoraPopup agentId="support" defaultOpen={false} />
    </View>
  );
}
```

The popup should be mounted above the screen that it overlays. Give its
container a full-screen layout when the trigger needs to float over the
entire navigator.

## Sidebar sheet

`AjoraSidebar` shows a collapsed composer bar while closed and expands into a
bottom sheet when pressed. Its resting state is closed; pass `defaultOpen` to
open it immediately.

```tsx
export function AppShell() {
  return (
    <View style={{ flex: 1 }}>
      <MainContent />
      <AjoraSidebar
        agentId="default"
        defaultOpen={false}
        collapsedPlaceholder="Ask Ajora..."
      />
    </View>
  );
}
```

The sidebar uses an absolute overlay and should be a sibling of your content,
not a child of a small, clipped view.

## Common chat props

| Prop                    | Type                           | Purpose                                            |
| ----------------------- | ------------------------------ | -------------------------------------------------- |
| `agentId`               | `string`                       | Selects the runtime agent; defaults to `"default"` |
| `threadId`              | `string`                       | Selects or creates a conversation                  |
| `modelId`               | `string`                       | Selects the runtime model                          |
| `labels`                | `Partial<AjoraChatLabels>`     | Replaces bundled accessibility and UI copy         |
| `starterSuggestions`    | `Suggestion[]`                 | Shows static suggestions in the empty state        |
| `isLoading`             | `boolean`                      | Shows app-owned initialization/loading state       |
| `isModalDefaultOpen`    | `boolean`                      | Sets the initial popup/sidebar state               |
| `inputProps`            | `Partial<AjoraChatInputProps>` | Controls composer text, pickers, and icons         |
| `style`                 | `ViewStyle`                    | Overrides the root chat style                      |
| `textRenderer`          | function                       | Renders both message roles                         |
| `userTextRenderer`      | function                       | Renders only user message text                     |
| `assistantTextRenderer` | function                       | Renders only assistant message text                |

See the [API reference](api-reference.md) for the complete public prop list.

## Suggestions

Static starter suggestions are useful before an agent has context:

```tsx
import type { Suggestion } from "react-native-ajora";

const starters: Suggestion[] = [
  {
    id: "billing",
    title: "Billing",
    message: "Help me understand my latest bill",
    icon: "receipt-outline",
    iconFamily: "Ionicons",
  },
  {
    id: "account",
    title: "Account",
    message: "How do I update my profile?",
    icon: "person-outline",
    iconFamily: "Ionicons",
  },
];

<AjoraChat starterSuggestions={starters} />;
```

Dynamic suggestions are configured with a hook mounted under the provider:

```tsx
function SupportSuggestions() {
  useConfigureSuggestions({
    instructions:
      "Suggest short next questions for a customer-support conversation.",
    minSuggestions: 1,
    maxSuggestions: 3,
    available: "after-first-message",
  });

  return null;
}
```

The config can be static (`suggestions`) or dynamic (`instructions`). Use
`available: "disabled"` to turn suggestions off. Scope a config with
`consumerAgentId` when multiple agents are on the same screen.

## History

`AjoraChat` uses `useHistory` internally. It loads the latest page, exposes
older-message pagination, and prevents stale responses from overwriting a
newer thread selection.

For a custom list, call `useHistory` yourself:

```tsx
function HistoryControls({
  activeThreadId,
}: {
  activeThreadId: string | undefined;
}) {
  const history = useHistory({
    agentId: "default",
    threadId: activeThreadId,
    pageSize: 40,
  });

  return history.hasMore ? (
    <Button
      title={history.isLoadingMore ? "Loading..." : "Load earlier"}
      disabled={history.isLoadingMore}
      onPress={history.loadMore}
    />
  ) : null;
}
```

Do not render and control the same message array from two independent agent
instances. Reuse the `agentId` and `threadId` consistently across chat and
history hooks.

## Composer customization

Use `inputProps` for common controls:

```tsx
<AjoraChat
  inputProps={{
    value: message,
    onChange: setMessage,
    placeholder: "Describe the issue",
    maxLines: 5,
    showAgentSelector: true,
    agents,
    selectedAgentId,
    onAgentSelect: (agent) => setSelectedAgentId(agent.id),
    models,
    selectedModelId,
    onModelSelect: (model) => setSelectedModelId(model.id),
  }}
/>
```

For a fully custom composer, pass the `input` slot. A slot component receives
the normal `AjoraChatInputProps`, including Ajora's send and stop handlers:

```tsx
import {
  AjoraChat,
  AjoraChatInput,
  type AjoraChatInputProps,
} from "react-native-ajora";

function BrandedComposer(props: AjoraChatInputProps) {
  return (
    <AjoraChatInput
      {...props}
      placeholder="How can the team help?"
      style={{ marginHorizontal: 12 }}
    />
  );
}

export function Screen() {
  return <AjoraChat input={BrandedComposer} />;
}
```

## Slots

The chat view supports component slots for the message list, composer,
suggestions, thinking indicator, empty state, loading state, and error UI.

```tsx
<AjoraChat
  messageView={CustomMessageRow}
  emptyState={WelcomePanel}
  thinkingIndicator={BrandedThinking}
/>
```

Slot values may be:

- a React component with the slot's expected props;
- a partial props object for the default component;
- a string passed as `className` for integrations that support it.

Prefer stable component references. Components declared inside render create a
new type on every render and can reset subtree state.

## Message text

Side-specific text renderers make it possible to keep Markdown for assistant
messages while keeping user text plain:

```tsx
<AjoraChat
  userTextRenderer={({ content }) => <Text>{content}</Text>}
  assistantTextRenderer={({ content }) => <CustomMarkdown source={content} />}
/>
```

Keep renderers pure and memoized. They may be called repeatedly while tokens
stream into the current assistant message.

## Style overrides

Use the theme for design-system consistency:

```tsx
<AjoraChat
  containerStyle={{ backgroundColor: "#F7F7F5" }}
  userBubbleStyle={{ borderRadius: 16 }}
  assistantBubbleStyle={{ borderRadius: 16 }}
/>
```

Available direct style props include `containerStyle`, `messageListStyle`,
`inputContainerStyle`, `userBubbleStyle`, `assistantBubbleStyle`,
`suggestionContainerStyle`, and `scrollContentStyle`.

## Labels and accessibility

Every visible control has a default accessibility label. Override copy through
`labels`:

```tsx
<AjoraChat
  labels={{
    chatToggleOpenLabel: "Open support chat",
    chatToggleCloseLabel: "Close support chat",
    assistantMessageToolbarRegenerateLabel: "Create another response",
    chatLoadingConnecting: "Connecting to support...",
  }}
/>
```

Do not communicate status with color alone. If you replace a control, preserve
its role, label, focus target, and disabled state.

## Errors

The bundled chat catches run failures, shows a retry affordance, and calls
`onSendError`. Use that callback for telemetry without replacing the built-in
recovery flow:

```tsx
<AjoraChat
  onSendError={(error) => {
    analytics.track("agent_send_failed", { message: error.message });
  }}
/>
```
