# Troubleshooting

Start by identifying which layer failed: package installation, native launch,
runtime connection, agent metadata, thread history, or a run.

## The app will not bundle

### `Cannot find module` for a peer dependency

Install both the package and its peers:

```bash
npx expo install --check
npx expo-doctor
```

For npm projects, clear a partially installed tree:

```bash
npm ci
npx expo start --clear
```

Do not suppress peer-dependency failures with `--legacy-peer-deps` until you
have identified the conflicting package.

### Reanimated worklet error

Confirm the Babel plugin required by the installed Reanimated version is last
in the plugin list, then restart with a cleared cache:

```bash
npx expo start --clear
```

For a development build, rebuild after changing Babel or native dependencies.
If your Reanimated version requires `react-native-worklets/plugin`, use that
plugin instead of the older `react-native-reanimated/plugin`.

### Vector icons show missing glyphs

1. Confirm every `@react-native-vector-icons/*` package used by the default UI
   is installed.
2. Add each required config plugin to Expo configuration.
3. Run `npx expo prebuild`.
4. Rebuild the native app.

Metro restart alone does not apply config-plugin changes.

## The UI renders in an unexpected place

The chat requires a bounded height:

```tsx
<SafeAreaView style={{ flex: 1 }}>
  <AjoraChat style={{ flex: 1 }} />
</SafeAreaView>
```

Put `AjoraProvider` above any component that uses Ajora. Wrap the root in
`GestureHandlerRootView` and `SafeAreaProvider`.

For `AjoraPopup` and `AjoraSidebar`, mount the shell as a sibling overlay over
full-screen host content. Avoid placing it in a clipped card or a view whose
layout is zero-sized.

## The chat says the runtime URL is missing

`runtimeUrl` was not supplied and no local development agent was registered.
Read the environment value before rendering:

```tsx
const runtimeUrl = process.env.EXPO_PUBLIC_RUNTIME_URL;

if (!runtimeUrl) {
  throw new Error("EXPO_PUBLIC_RUNTIME_URL is required");
}
```

Restart Expo after changing `.env`. Environment variables are inlined by the
bundler and are not re-read by a running packager.

## The device cannot reach the runtime

`localhost` refers to the device, not the computer running the server.

- iOS Simulator: `http://localhost:3000` may work.
- Android emulator: use `http://10.0.2.2:3000`.
- Physical device: use your computer's LAN IP or a tunnel.
- Production: use HTTPS.

Test the runtime URL externally before debugging the mobile app. On Android,
plain HTTP may be blocked by network security policy; prefer HTTPS or an
explicit development-only exception.

## The runtime connects but the agent is missing

The error should include the runtime URL and known agent IDs. Confirm that the
runtime's metadata exposes the exact `agentId` used by `AjoraChat`.

```tsx
<AjoraChat agentId="support" />
```

The value is case-sensitive. `"default"` is only a fallback, not an agent that
every runtime is guaranteed to provide.

## Every request returns 404

Verify transport mode:

- A standard REST runtime normally uses `useSingleEndpoint={false}`.
- A single-endpoint AG-UI runtime should use `useSingleEndpoint`.

Do not place the REST path on the end of a single-endpoint URL unless your
runtime documentation says it is required.

## Requests fail with 401 or 403

Pass an authentication header through `AjoraProvider`:

```tsx
<AjoraProvider
  runtimeUrl={runtimeUrl}
  headers={{ Authorization: `Bearer ${accessToken}` }}
>
  {children}
</AjoraProvider>
```

Confirm the token is valid from the device, has the correct audience, and can
access the selected agent. A token in `EXPO_PUBLIC_*` is public to the app
bundle; never use a long-lived server secret there.

## Messages appear but sends fail

Check these in order:

1. The selected model ID exists in runtime metadata.
2. The agent allows the selected model.
3. The runtime accepts the current transport.
4. Authentication is still valid.
5. The runtime implements the run and streaming events expected by AG-UI.

Use `onSendError` to report the actual failure while preserving the built-in
retry UI.

## History never loads

History requires runtime support for loading a thread. Confirm that:

- The `threadId` is not `null` or malformed.
- The runtime persists messages for that agent and thread.
- The authenticated user owns the thread.
- The server supports the history route expected by your installed version.

`useHistory({ threadId: null })` is intentionally idle.

## Suggestions do not appear

- Dynamic suggestions need a runtime that can generate them.
- Static suggestions appear only when the empty state is shown.
- `available: "disabled"` removes the configuration.
- Confirm suggestions are scoped to the active `consumerAgentId`.
- A running agent can defer suggestion reload until the run ends.

To diagnose custom UI, render `useSuggestions()` output separately and verify
its `isLoading` state.

## A tool is called but does not execute

Names must match between the agent's declared tool and `useFrontendTool`.
Validate that:

- The tool component is mounted under `AjoraProvider`.
- `agentId` does not exclude the active agent.
- The parameter schema matches the runtime's argument schema.
- The runtime actually supports frontend tool execution.

Watch the Metro logs for duplicate-tool or handler errors.

## Human-in-the-loop UI stays pending

The interactive tool resolves only when its renderer calls `respond`. Ensure
the tool is in `executing` status before showing approval controls, and call
`respond` with the value the runtime expects.

## Attachments are unavailable

Without `uploadAttachment`, Ajora intentionally hides the add-file control.
Enable it at the provider:

```tsx
<AjoraProvider
  runtimeUrl={runtimeUrl}
  uploadAttachment={async (file, { signal, onProgress }) => {
    // Upload and return { url: "https://...", key?: "..." }
  }}
>
  {children}
</AjoraProvider>
```

Your uploader must observe `signal`, report `0`–`100` progress, and return a
remote URL. A local `file://` URL will not be usable by the runtime.

## Keyboard or composer layout

- Keep the chat inside a flex container.
- Install `react-native-keyboard-controller` at the Expo-compatible version.
- Rebuild after changing native packages.
- Test on both Android and iOS; keyboard event timing differs.
- Avoid fixed heights that do not leave room for the keyboard.

## Still blocked?

Open a [GitHub issue](https://github.com/habasefa/react-native-ajora/issues/new?template=bug.yml)
with:

- Ajora, Expo, React Native, and React versions;
- platform and device/simulator;
- the smallest behavior that reproduces the issue;
- relevant Metro or native logs with secrets removed;
- whether the runtime works from a non-Ajora client.

For security issues, follow [SECURITY.md](../SECURITY.md) instead of opening a
public issue.
