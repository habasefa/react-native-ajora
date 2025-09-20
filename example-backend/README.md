# AI Backend Server

This Express server provides AI functionality for the React Native Ajora app.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set your Google API key (optional, defaults to hardcoded key):

   ```bash
   export GOOGLE_API_KEY="your-api-key-here"
   ```

3. Start the server:
   ```bash
   npm start
   # or
   ./start.sh
   ```

## Endpoints

- `GET /` - Health check
- `POST /api/stream` - Streaming AI responses
- `POST /api/chat` - Non-streaming AI responses

## Usage

The server will run on port 3000. Make sure to update the `API_BASE_URL` in `example/app/api.ts` to match your machine's IP address.

Example request:

```bash
curl -X POST http://localhost:3000/api/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "Hello, how are you?"}'
```
