# API reference

This reference describes the public entry point:

```tsx
import { AjoraChat, useAgent } from "react-native-ajora";
```

Ajora is pre-1.0. TypeScript definitions in the installed package are the
canonical source when a type and this guide differ.

## Components

### `AjoraProvider`

Root provider for runtime connection and shared agent state.

| Prop                      | Type                                  | Default          | Description                                               |
| ------------------------- | ------------------------------------- | ---------------- | --------------------------------------------------------- |
| `children`                | `ReactNode`                           | required         | Descendants that use Ajora                                |
| `runtimeUrl`              | `string`                              | —                | Runtime endpoint; required unless using a local dev agent |
| `headers`                 | `Record<string, string>`              | `{}`             | Headers sent with runtime requests                        |
| `properties`              | `Record<string, unknown>`             | `{}`             | Application properties forwarded to the runtime           |
| `useSingleEndpoint`       | `boolean`                             | `false`          | Selects single AG-UI endpoint transport                   |
| `agents__unsafe_dev_only` | `Record<string, AbstractAgent>`       | `{}`             | Local development agents; not a production server         |
| `renderToolCalls`         | `ReactToolCallRenderer<any>[]`        | —                | Stable tool renderer registry                             |
| `renderActivityMessages`  | `ReactActivityMessageRenderer<any>[]` | —                | Stable activity renderer registry                         |
| `renderCustomMessages`    | `ReactCustomMessageRenderer[]`        | —                | Stable custom-message renderer registry                   |
| `frontendTools`           | `ReactFrontendTool[]`                 | —                | Stable static frontend tool registry                      |
| `humanInTheLoop`          | `ReactHumanInTheLoop[]`               | —                | Stable static interactive-tool registry                   |
| `uploadAttachment`        | `UploadAttachmentFn`                  | —                | Enables attachments and uploads local files               |
| `attachmentLimits`        | `AttachmentLimits`                    | package defaults | Validates count, size, and MIME types                     |
| `preferences`             | `Partial<AjoraRuntimePreferences>`    | package defaults | Client preferences such as haptics                        |

Attachment defaults allow 10 files, 25 MiB per file, and JPEG, PNG, WebP,
HEIC, PDF, or plain text. Override individual fields as needed.

Nested `children` can use `useAjora()` to read:

```ts
const {
  ajora,
  executingToolCallIds,
  runtimeConnectionStatus,
  attachmentsEnabled,
  uploadAttachment,
  attachmentLimits,
} = useAjora();
```

### `AjoraChat`

High-level chat component. It selects an agent, connects a thread, loads
history, renders suggestions, submits turns, and manages draft and error state.

| Prop                    | Type                                  | Default          | Description                          |
| ----------------------- | ------------------------------------- | ---------------- | ------------------------------------ |
| `agentId`               | `string`                              | `"default"`      | Runtime agent to use                 |
| `modelId`               | `string`                              | runtime fallback | Model ID for runs and suggestions    |
| `threadId`              | `string`                              | generated UUID   | Persisted conversation ID            |
| `labels`                | `Partial<AjoraChatLabels>`            | English defaults | UI and accessibility copy            |
| `starterSuggestions`    | `Suggestion[]`                        | —                | Suggestions for the empty state      |
| `isLoading`             | `boolean`                             | `false`          | App-owned loading state              |
| `isModalDefaultOpen`    | `boolean`                             | `true`           | Initial open state for shell configs |
| `inputProps`            | `Partial<AjoraChatInputProps>`        | —                | Composer configuration               |
| `style`                 | `StyleProp<ViewStyle>`                | —                | Root view style                      |
| `onSendError`           | `(error: Error) => void`              | —                | Called when a run fails              |
| `textRenderer`          | `(props) => ReactNode`                | —                | Renders both message roles           |
| `userTextRenderer`      | `(props) => ReactNode`                | —                | Renders only user text               |
| `assistantTextRenderer` | `(props) => ReactNode`                | —                | Renders only assistant text          |
| `onRegenerate`          | `(message: AssistantMessage) => void` | internal         | Overrides regeneration               |
| `onMessageLongPress`    | `(message: Message) => void`          | internal         | Overrides long-press behavior        |
| `autoScroll`            | `boolean`                             | internal default | Follow new and streaming content     |
| `showThinkingIndicator` | `boolean`                             | internal default | Show active-run thinking UI          |
| `showEmptyState`        | `boolean`                             | internal default | Show empty chat UI                   |
| `showLoadingState`      | `boolean`                             | internal default | Show loading UI                      |

Text renderer props currently contain `content`:

```ts
type TextRenderer = (props: { content: string }) => React.ReactNode;
```

#### Chat slots

Pass a component, partial default props, or a supported class string:

| Slot                   | Replaces                          |
| ---------------------- | --------------------------------- |
| `input`                | Composer                          |
| `messageView`          | Individual message row            |
| `scrollView`           | Message list scroller             |
| `suggestionView`       | Suggestion container              |
| `thinkingIndicator`    | Active thinking indicator         |
| `scrollToBottomButton` | Floating scroll-to-bottom control |
| `emptyState`           | Empty conversation UI             |
| `loadingState`         | Initial/history loading UI        |
| `errorMessage`         | Run-error UI                      |

`chatView` replaces the complete view. Slots named in the view take priority
over a rest prop with the same name.

#### Chat style props

| Prop                       | Target                   |
| -------------------------- | ------------------------ |
| `containerStyle`           | Outer chat view          |
| `messageListStyle`         | Message list area        |
| `inputContainerStyle`      | Composer container       |
| `userBubbleStyle`          | User message bubble      |
| `assistantBubbleStyle`     | Assistant message bubble |
| `suggestionContainerStyle` | Suggestions              |
| `scrollContentStyle`       | Scroller content         |

### `AjoraPopup`

Extends the chat props except `chatView`.

| Additional prop | Type       | Description               |
| --------------- | ---------- | ------------------------- |
| `defaultOpen`   | `boolean`  | Initial modal state       |
| `header`        | slot props | Replaces the modal header |

The popup includes `AjoraChatToggleButton` and an animated modal.

### `AjoraSidebar`

Extends the chat props except `chatView`.

| Additional prop        | Type       | Description                                         |
| ---------------------- | ---------- | --------------------------------------------------- |
| `defaultOpen`          | `boolean`  | Opens the bottom sheet on mount; defaults to closed |
| `header`               | slot props | Replaces the sheet header                           |
| `collapsedPlaceholder` | `string`   | Text for the closed composer bar                    |
| `collapsed`            | slot props | Replaces the closed composer affordance             |

### Building blocks

The package exports lower-level components for composition:

- `AjoraChatView`, `AjoraChatScrollView`,
  `AjoraChatScrollToBottomButton`
- `AjoraChatInput`, `AjoraChatAudioRecorder`
- `AjoraChatMessageView`, `AjoraChatUserMessage`,
  `AjoraChatAssistantMessage`
- `AjoraChatSuggestionView`, `AjoraChatSuggestionPill`,
  `AjoraChatSuggestionShimmer`
- `AjoraChatEmptyState`, `AjoraChatLoadingState`,
  `AjoraChatThinkingIndicator`, `AjoraChatThoughtsBubble`
- `MessageAttachments`
- `AjoraChatToolCallsView`, `WildcardToolCallRender`
- `AjoraChatToggleButton`, `AjoraModalHeader`
- `AjoraPopupView`, `AjoraSidebarView`
- `AjoraMentionSuggestions`

Check the exported `*Props` type for each component before composing it outside
the high-level shells.

## Composer

### `AjoraChatInput`

Common props:

| Prop                 | Type                            | Description                   |
| -------------------- | ------------------------------- | ----------------------------- |
| `value`              | `string`                        | Controlled text value         |
| `onChange`           | `(value: string) => void`       | Text change callback          |
| `onSubmitMessage`    | `(value, attachments?) => void` | Submit a turn                 |
| `onStop`             | `() => void`                    | Stop the active run           |
| `isRunning`          | `boolean`                       | Show processing/stop behavior |
| `mode`               | `"input" \| "processing"`       | Composer mode                 |
| `placeholder`        | `string`                        | Input placeholder             |
| `maxLines`           | `number`                        | Maximum expanded lines        |
| `autoFocus`          | `boolean`                       | Focus on mount                |
| `darkMode`           | `boolean`                       | Input-specific dark mode      |
| `showAgentSelector`  | `boolean`                       | Show agent picker affordance  |
| `agents`             | `AgentOption[]`                 | Agent picker options          |
| `selectedAgentId`    | `string`                        | Selected agent                |
| `onAgentSelect`      | `(agent: AgentOption) => void`  | Agent selection               |
| `models`             | `ModelOption[]`                 | Model picker options          |
| `selectedModelId`    | `string`                        | Selected model                |
| `onModelSelect`      | `(model: ModelOption) => void`  | Model selection               |
| `mentionSuggestions` | `MentionSuggestion[]`           | Mention candidates            |
| `onMentionSelect`    | `(suggestion) => void`          | Mention selection             |
| `showAddButton`      | `boolean`                       | Show add affordance           |
| `onAddPress`         | `() => void`                    | Add button callback           |
| `showSettingsButton` | `boolean`                       | Show settings affordance      |
| `onSettingsPress`    | `() => void`                    | Settings callback             |
| `style`              | `StyleProp<ViewStyle>`          | Root style                    |

Subcomponent slots include `textInput`, `sendButton`, `stopButton`,
`startTranscribeButton`, `audioRecorder`, and `children`.

## Hooks

### `useAgent`

```ts
useAgent(options?: {
  agentId?: string;
  updates?: UseAgentUpdate[];
}): { agent: AbstractAgent }
```

`UseAgentUpdate` values:

- `OnMessagesChanged`
- `OnStateChanged`
- `OnRunStatusChanged`

### `useAgentContext`

```ts
useAgentContext({
  description: string;
  value: JsonSerializable;
}): void
```

Registers while mounted and unregisters on cleanup.

### `useFrontendTool`

```ts
useFrontendTool<T extends Record<string, unknown>>(
  tool: ReactFrontendTool<T>,
  deps?: ReadonlyArray<unknown>,
): void
```

`ReactFrontendTool<T>` extends:

```ts
{
  name: string;
  description?: string;
  parameters?: z.ZodType<T>;
  handler?: (args: T, toolCall: ToolCall) => Promise<unknown>;
  followUp?: boolean;
  agentId?: string;
  render?: ReactToolCallRenderer<T>["render"];
}
```

### `useHumanInTheLoop`

```ts
useHumanInTheLoop<T extends Record<string, unknown>>(
  tool: ReactHumanInTheLoop<T>,
  deps?: ReadonlyArray<unknown>,
): void
```

Same registration fields as a frontend tool, except `handler` is managed by
Ajora and `render` is required. The interactive renderer receives `respond`
while the tool is executing.

### `useSuggestions`

```ts
useSuggestions(options?: {
  agentId?: string;
  modelId?: string;
}): {
  suggestions: Suggestion[];
  reloadSuggestions: () => void;
  clearSuggestions: () => void;
  isLoading: boolean;
}
```

### `useConfigureSuggestions`

Accepts either:

```ts
{
  instructions: string;
  minSuggestions?: number;
  maxSuggestions?: number;
  available?: SuggestionAvailability;
  providerAgentId?: string;
  consumerAgentId?: string;
}
```

or:

```ts
{
  suggestions: Array<{
    id?: string;
    title: string;
    message: string;
    icon?: IconName;
    iconFamily?: IconFamily;
  }>;
  available?: SuggestionAvailability;
  consumerAgentId?: string;
}
```

`SuggestionAvailability` is `"before-first-message"`,
`"after-first-message"`, `"always"`, or `"disabled"`.

### `useHistory`

```ts
useHistory({
  agentId?: string;
  threadId?: string | null;
  pageSize?: number;
}): {
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => Promise<void>;
  reload: () => Promise<void>;
}
```

The default page size is 50.

### `useThreads`

```ts
useThreads({
  agentId?: string;
  resourceId: string;
  pageSize?: number;
}): {
  threads: ThreadRecord[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => Promise<void>;
  reload: () => Promise<void>;
  createThread: (
    request?: Omit<CreateThreadRequest, "signal">,
  ) => Promise<ThreadRecord>;
}
```

The default page size is 20.

### `useLiveThinking`

```ts
useLiveThinking(options?: {
  agentId?: string;
}): {
  title?: string;
  text: string;
  isActive: boolean;
}
```

### `useAttachmentUploader`

```ts
useAttachmentUploader({
  uploadAttachment?: UploadAttachmentFn;
  limits?: AttachmentLimits;
}): {
  attachments: FileAttachment[];
  add: (files: FileAttachment[]) => {
    accepted: FileAttachment[];
    rejected: Array<{ file: FileAttachment; reason: string }>;
  };
  remove: (id: string) => void;
  retry: (id: string) => void;
  clear: () => void;
  allSettled: boolean;
  isUploading: boolean;
  hasErrors: boolean;
}
```

### `useAjoraHaptics`

```ts
useAjoraHaptics(): {
  impactLight: () => void;
  impactMedium: () => void;
  notifySuccess: () => void;
  notifyError: () => void;
}
```

Callbacks no-op unless the provider sets `preferences.hapticsEnabled` and
`expo-haptics` is installed.

### Renderer hooks

- `useRenderToolCall()` returns
  `({ toolCall, toolMessage? }) => ReactElement | null`.
- `useRenderActivityMessage()` returns
  `{ renderActivityMessage, findRenderer }`.
- `useRenderCustomMessages()` returns a message renderer or `null` when no
  chat configuration exists.

## Themes

Theme exports include:

- `AjoraThemeProvider`
- `lightTheme`, `darkTheme`
- `createAjoraTheme`
- `themePresets`
- `createPresetTheme`, `getVariantConfig`, `getSizeConfig`
- `useAjoraTheme`, `useAjoraColors`, `useAjoraSpacing`
- `AjoraTheme`, `AjoraColors`, `AjoraTypography`, `AjoraSpacing`,
  `AjoraBorderRadius`, `AjoraShadows`

Read the [theming guide](theming-and-customization.md) for complete examples.

## Tool and renderer types

Exported types include:

- `FrontendTool<T>`
- `ReactFrontendTool<T>`
- `ReactHumanInTheLoop<T>`
- `ReactToolCallRenderer<T>`
- `ReactActivityMessageRenderer<T>`
- `ReactCustomMessageRenderer`
- `ToolCallStatus`
- `defineToolCallRenderer`

`ToolCallStatus` is `"inProgress"`, `"executing"`, or `"complete"`.

## Other utilities

The package also exports file helpers, slot utilities, theme presets,
animation config helpers, accessibility config helpers, and uploader types.
For package-level composition, those helpers are supported from the root
import; do not rely on internal file paths.
