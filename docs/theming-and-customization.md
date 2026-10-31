# Theming and customization

Ajora exposes a theme provider, preset themes, direct style props, and
component slots. Start with the theme so every default component inherits the
same design tokens.

## Use a preset

```tsx
import {
  AjoraProvider,
  AjoraThemeProvider,
  themePresets,
} from "react-native-ajora";

<AjoraProvider runtimeUrl={runtimeUrl}>
  <AjoraThemeProvider theme={themePresets.claude}>
    <App />
  </AjoraThemeProvider>
</AjoraProvider>;
```

Available presets are `light`, `dark`, `gemini`, `chatgpt`, and `claude`.

Use `darkMode` with a partial theme to start from Ajora's default dark colors:

```tsx
<AjoraThemeProvider
  darkMode
  theme={{ colors: { primary: "#7C3AED", userBubble: "#6D28D9" } }}
>
  {children}
</AjoraThemeProvider>
```

## Create a reusable theme

`createAjoraTheme` deep-merges overrides into a light or dark base:

```tsx
import { createAjoraTheme } from "react-native-ajora";

export const brandTheme = createAjoraTheme(
  {
    colors: {
      primary: "#0F766E",
      primaryVariant: "#115E59",
      userBubble: "#0F766E",
      userBubbleText: "#FFFFFF",
      assistantBubble: "#F0FDFA",
      assistantBubbleText: "#134E4A",
    },
    typography: {
      regular: "Inter-Regular",
      medium: "Inter-Medium",
      bold: "Inter-Bold",
    },
    borderRadius: {
      md: 10,
      lg: 16,
    },
  },
  "light",
);
```

Define custom fonts with `expo-font` or your app's font loader before rendering
them. A missing family can cause text to disappear or fall back unexpectedly.

## Theme anatomy

| Token group    | Controls                                                                |
| -------------- | ----------------------------------------------------------------------- |
| `colors`       | Backgrounds, surfaces, text, borders, status, bubbles, input, and icons |
| `typography`   | Regular, medium, and bold font families; sizes; line heights            |
| `spacing`      | Shared `xs` through `xxl` spacing scale                                 |
| `borderRadius` | Shared `none` through `full` radii                                      |
| `shadows`      | `none`, `sm`, `md`, and `lg` shadow presets                             |

Read tokens in custom components instead of hard-coding defaults:

```tsx
import { useAjoraColors, useAjoraSpacing } from "react-native-ajora";

function CustomBanner() {
  const colors = useAjoraColors();
  const spacing = useAjoraSpacing();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        padding: spacing.md,
      }}
    >
      <Text style={{ color: colors.text }}>Connected</Text>
    </View>
  );
}
```

`useAjoraTheme()` returns the complete merged theme.

## Presets by layout

`createPresetTheme` combines a visual variant and size:

```tsx
import { AjoraThemeProvider, createPresetTheme } from "react-native-ajora";

<AjoraThemeProvider theme={createPresetTheme("compact", "sm", "dark")}>
  {children}
</AjoraThemeProvider>;
```

Available variants are `default`, `minimal`, `bubbles`, `cards`, and
`compact`. Sizes are `sm`, `md`, and `lg`. Color schemes are `light`, `dark`,
and `system`; resolve `system` in your app before choosing a base theme.

## Direct style overrides

For local exceptions, use chat style props:

```tsx
<AjoraChat
  containerStyle={{ backgroundColor: colors.background }}
  inputContainerStyle={{ paddingHorizontal: 16 }}
  userBubbleStyle={{ borderRadius: 18 }}
  assistantBubbleStyle={{ borderRadius: 18 }}
/>
```

Prefer tokens for repeated patterns. Direct styles are best for one-off layout
constraints.

## Replace a component

The view exposes slots for its major regions. Replace the composer:

```tsx
import {
  AjoraChat,
  AjoraChatInput,
  type AjoraChatInputProps,
} from "react-native-ajora";

function Composer(props: AjoraChatInputProps) {
  return <AjoraChatInput {...props} autoFocus />;
}

<AjoraChat input={Composer} />;
```

Replace message rendering:

```tsx
<AjoraChat assistantTextRenderer={renderAssistantMarkdown} />
```

If you replace a component, keep the props that Ajora passes through,
especially `onSubmitMessage`, `onStop`, `isRunning`, and message data.

## Theme custom components

Hooks remain available inside custom UI:

```tsx
function AssistantMarkdown({ content }: { content: string }) {
  const theme = useAjoraTheme();

  return (
    <Markdown
      style={{
        body: {
          color: theme.colors.assistantBubbleText,
          fontSize: theme.typography.sizes.md,
        },
      }}
    >
      {content}
    </Markdown>
  );
}
```

## Attachments

The attachment button is hidden until the provider receives an
`uploadAttachment` function. Ajora handles picking, validation, progress,
cancellation, retry state, and sends the resulting remote URL in the message.

```tsx
<AjoraProvider
  runtimeUrl={runtimeUrl}
  attachmentLimits={{
    maxAttachments: 4,
    maxFileSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
  }}
  uploadAttachment={async (file, { signal, onProgress }) => {
    const body = new FormData();
    body.append("file", {
      uri: file.uri,
      name: file.displayName,
      type: file.mimeType,
    } as unknown as Blob);

    // uploadWithProgress is a small wrapper around your storage transport.
    return uploadWithProgress({
      url: "https://api.example.com/uploads",
      body,
      signal,
      onProgress,
    });
  }}
>
  <AjoraChat />
</AjoraProvider>
```

The uploader contract is:

1. Resolve `{ url, key? }` after the file is available to the runtime.
2. Call `onProgress` with values from `0` to `100`.
3. Observe `signal` and reject with an `AbortError` when canceled.
4. Reject with a normal `Error` for retryable failures.

Never return a local `file://` URL as the uploaded URL; remote runtimes cannot
read the device filesystem.

`file:` URIs, local device paths, and raw picked files should stay in the app
until your uploader has transferred them to trusted storage. Signed URLs
should be short-lived and scoped to the intended user.

## Accessibility

Theme contrast is not automatically validated. Test light and dark themes
against WCAG contrast targets, hold text size large enough to remain legible,
and verify the UI with screen readers. The package exports animation and
accessibility configuration helpers; respect the device's reduced-motion
setting when creating custom animation.

## Next

- Review [chat component props](chat-ui.md).
- Use exact type names from the [API reference](api-reference.md).
