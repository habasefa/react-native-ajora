# CopilotKit Hono Server Example

A standalone Hono server running CopilotKit runtime with BuiltInAgent.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up your API key (choose one):

```bash
# OpenAI
export OPENAI_API_KEY=your_openai_api_key

# Or Anthropic
export ANTHROPIC_API_KEY=your_anthropic_api_key

# Or Google
export GOOGLE_API_KEY=your_google_api_key
```

3. Run the server:

```bash
npm run dev
```

The server will start on `http://localhost:4000` (or the port specified in `PORT` env var).

## Endpoints

- **Health Check**: `GET http://localhost:4000/`
- **CopilotKit API**: `POST http://localhost:4000/api/copilotkit`

## Usage with React Native Ajora

Point your `AjoraProvider` to this server:

```tsx
<AjoraProvider
  runtimeUrl="http://localhost:4000/api/copilotkit"
  useSingleEndpoint={true}
>
  {/* Your app */}
</AjoraProvider>
```

## Configuration

- Default port: `4000` (set `PORT` env var to change)
- Default agent: `default` (using BuiltInAgent)
- Model selection: Automatically selects based on available API keys (OpenAI > Anthropic > Google)
