import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  CopilotRuntime,
  createCopilotEndpointSingleRoute,
  InMemoryAgentRunner,
} from "@copilotkitnext/runtime";
import { BuiltInAgent } from "@copilotkitnext/agent";

/**
 * Determines which model to use based on available API keys.
 * Priority: OpenAI > Anthropic > Google > OpenAI (default)
 */
const determineModel = () => {
  if (process.env.OPENAI_API_KEY?.trim()) {
    return "openai/gpt-4o";
  }
  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    return "anthropic/claude-sonnet-4.5";
  }
  if (process.env.GOOGLE_API_KEY?.trim()) {
    return "google/gemini-2.5-pro";
  }
  return "openai/gpt-4o";
};

// Create the agent
const agent = new BuiltInAgent({
  model: determineModel(),
  prompt: "You are a helpful AI assistant.",
  temperature: 0.7,
});

// Create the CopilotRuntime with the agent
const runtime = new CopilotRuntime({
  agents: {
    default: agent,
  },
  runner: new InMemoryAgentRunner(),
});

// Create the CopilotKit endpoint (single-route for better compatibility)
const copilotApp = createCopilotEndpointSingleRoute({
  runtime,
  basePath: "/api/copilotkit",
});

// Create the main Hono app
const app = new Hono();

// Enable CORS for development (adjust origin as needed)
app.use(
  "*",
  cors({
    origin: "*", // In production, specify allowed origins
    allowMethods: ["GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposeHeaders: ["Content-Type"],
    credentials: true,
    maxAge: 86400,
  })
);

// Mount the CopilotKit endpoint
app.route("/", copilotApp);

// Start the server
const port = Number(process.env.PORT || 4000);
serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`🚀 CopilotKit runtime server is running!`);
    console.log(`📍 Server: http://localhost:${info.port}`);
    console.log(`🔗 Endpoint: http://localhost:${info.port}/api/copilotkit`);
    console.log(`\n💡 Make sure to set one of these environment variables:`);
    console.log(`   - OPENAI_API_KEY`);
    console.log(`   - ANTHROPIC_API_KEY`);
    console.log(`   - GOOGLE_API_KEY`);
  }
);
