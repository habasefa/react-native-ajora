# Getting started

This guide takes an empty React Native or Expo application to a working Ajora
chat screen. Ajora renders the mobile interface; your application must also
provide an agent runtime URL.

## Prerequisites

- Node.js 18 or newer.
- An Expo SDK 54 project or a bare React Native 0.81+ project.
- A CopilotKit-compatible runtime or another service implementing the
  AG-UI protocol used by Ajora.
- A device or simulator that can reach that runtime.

The repository is tested against Expo SDK 54, React Native 0.81, and React 19.
Older combinations may work when peer constraints allow them, but treat them
as untested.

## 1. Install Ajora and peer dependencies

Install the package:

```bash
npm install react-native-ajora
```

Expo projects should use `expo install` so native packages match the project's
SDK:

```bash
npx expo install \
  expo react-native-reanimated react-native-keyboard-controller \
  react-native-svg react-native-gesture-handler react-native-safe-area-context \
  @gorhom/bottom-sheet @shopify/flash-list moti \
  expo-clipboard expo-document-picker expo-file-system expo-image-picker \
  expo-linear-gradient expo-linking @expo/react-native-action-sheet
```

Install the icon families imported by the bundled UI:

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

Do not mix React Native versions inside one app. Run `npx expo install
--check` or `npx expo-doctor` after installation.

### Optional packages

`react-native-streamdown` and `react-native-enriched-markdown` are optional
rich-content integrations. The base chat UI does not require either package.
Expo Haptics is also optional; Ajora enables haptics only when explicitly
requested through provider preferences.

If your application imports Zod to define frontend tool schemas, install it as
a direct application dependency:

```bash
npm install zod
```

## 2. Register Expo config plugins

The scoped vector-icon packages use Expo config plugins. Your `app.json` or
`app.config.js` should include each registered family:

```json
{
  "expo": {
    "plugins": [
      "@react-native-vector-icons/ant-design",
      "@react-native-vector-icons/entypo",
      "@react-native-vector-icons/evil-icons",
      "@react-native-vector-icons/feather",
      "@react-native-vector-icons/fontawesome",
      "@react-native-vector-icons/fontawesome5",
      "@react-native-vector-icons/fontawesome6",
      "@react-native-vector-icons/foundation",
      "@react-native-vector-icons/ionicons",
      "@react-native-vector-icons/material-design-icons",
      "@react-native-vector-icons/material-icons",
      "@react-native-vector-icons/octicons",
      "@react-native-vector-icons/simple-line-icons",
      "@react-native-vector-icons/zocial"
    ]
  }
}
```

Then regenerate native projects when using a development build:

```bash
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

Use a development build when any custom native module is unavailable in Expo
Go. Re-run `prebuild` after changing plugins or native configuration.

## 3. Configure Reanimated

Follow the setup for the Reanimated version selected by Expo. For the
Reanimated 3 template used by this repository, add its Babel plugin last:

```js
module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-reanimated/plugin"],
  };
};
```

If your project uses the Reanimated version whose installer requires the
worklets plugin instead, follow the official Reanimated migration guide. Do
not add both plugins.

## 4. Put the app inside the required roots

Three layers are important:

1. `GestureHandlerRootView` from `react-native-gesture-handler` must fill the
   screen.
2. `SafeAreaProvider` should wrap the app so safe-area insets are available.
3. `AjoraProvider` must wrap every Ajora component and hook.

```tsx
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AjoraProvider, AjoraThemeProvider } from "react-native-ajora";

export default function Root() {
  const runtimeUrl = process.env.EXPO_PUBLIC_RUNTIME_URL;

  if (!runtimeUrl) {
    throw new Error("EXPO_PUBLIC_RUNTIME_URL is required");
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AjoraProvider runtimeUrl={runtimeUrl} useSingleEndpoint>
          <AjoraThemeProvider>
            <SafeAreaView style={{ flex: 1 }}>{/* screens */}</SafeAreaView>
          </AjoraThemeProvider>
        </AjoraProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

Never put an empty string in `runtimeUrl`. Read and validate environment
configuration before constructing the provider.

## 5. Render a chat

The compact start uses the default chat view:

```tsx
import { AjoraChat } from "react-native-ajora";

export function AssistantScreen() {
  return <AjoraChat agentId="default" />;
}
```

`AjoraChat` creates a thread ID when none is supplied, connects that thread,
loads recent history, renders messages and suggestions, and sends new turns.
Pass a stable `threadId` when thread selection lives in your own state.

To start with a specific model, pass the model ID returned by your runtime:

```tsx
<AjoraChat agentId="default" modelId="your-model-id" />
```

The runtime and agent ID must agree. If your runtime only exposes `support`,
then `agentId="default"` will fail even though the UI can render.

## 6. Configure the runtime URL

For Expo, expose a development URL with an `EXPO_PUBLIC_` variable:

```bash
EXPO_PUBLIC_RUNTIME_URL=http://192.168.1.20:3000/api/copilotkit
```

Use HTTPS in production. Configure authentication through `headers` and avoid
shipping secrets in public client environment variables:

```tsx
<AjoraProvider
  runtimeUrl={runtimeUrl}
  useSingleEndpoint
  headers={{
    Authorization: `Bearer ${accessToken}`,
  }}
>
  {children}
</AjoraProvider>
```

The token must be available before the provider is created:

```tsx
const headers = { Authorization: `Bearer ${accessToken}` };

<AjoraProvider runtimeUrl={runtimeUrl} headers={headers}>
  {children}
</AjoraProvider>;
```

For rotating tokens, keep the provider at a stable level and update the
`headers` object through your app state.

## 7. Verify the integration

Use this sequence when debugging a first integration:

1. Confirm the runtime responds from the device browser or a network client.
2. Confirm `/info` exposes the agent ID used by `AjoraChat`.
3. Confirm the transport matches the runtime: `useSingleEndpoint` must be set
   for single-endpoint servers.
4. Clear Metro's cache after Babel or native dependency changes.
5. Rebuild the native app after adding config plugins or native modules.

If the screen renders but turns fail, the issue is usually runtime
configuration rather than the chat component. Start with the
[troubleshooting guide](troubleshooting.md).

## Bare React Native checklist

For non-Expo applications:

1. Install the same peer dependencies using versions compatible with your
   React Native release.
2. Follow each native dependency's autolinking and Reanimated setup.
3. Configure vector-icon font registration according to the installed
   `@react-native-vector-icons/*` packages.
4. Register `react-native-gesture-handler` at the app entry if your navigation
   setup requires it.
5. Reinstall iOS pods and rebuild Android after adding native modules.

Ajora's current native code lives in the package source and is resolved by the
React Native export. Do not manually copy modules from `node_modules` into your
app.

## Next steps

- Learn the [runtime model and thread lifecycle](core-concepts.md).
- Customize the [chat, popup, or sidebar UI](chat-ui.md).
- Add [agent context and frontend tools](hooks-and-tools.md).
