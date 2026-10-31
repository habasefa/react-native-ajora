# Example App

A React Native Expo app demonstrating `react-native-ajora` with a [prepx-ai](https://github.com/habasefa/prepx-ai) backend.

## Prerequisites

- Node.js 18+
- A running prepx-ai server (default: `http://localhost:3000`)

## Setup

1. Start the prepx-ai server:

```bash
cd path/to/prepx-ai
npm run start:dev
```

2. Install dependencies:

```bash
cd example-app
npm install
```

3. (Optional) Configure the server URL in `.env`:

```
EXPO_PUBLIC_RUNTIME_URL=http://localhost:3000/api/copilotkit
```

For a physical device, use your machine's LAN IP instead of `localhost`.

4. Run the app:

```bash
# iOS
npm run ios

# Android
npm run android
```

## How it works

The app uses `AjoraProvider` to connect to prepx-ai's Express single-route endpoint (`/api/copilotkit`), then renders `AjoraChat` for a full AI chat experience.

```tsx
<AjoraProvider runtimeUrl="http://localhost:3000/api/copilotkit" useSingleEndpoint>
  <AjoraChat agentId="default" />
</AjoraProvider>
```

Available agents from prepx-ai: `default` (Magnus), `llm`, `study`.
