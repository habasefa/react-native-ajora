# HTTP Request Patch for React Native

## Overview

This is a temporary workaround to fix the "Failed to getReader() from response" error that occurs in React Native environments when using `@ag-ui/client`.

## Problem

React Native's built-in `fetch` implementation doesn't support `ReadableStream` and `response.body.getReader()`, which causes streaming requests to fail with the error:
```
Failed to getReader() from response
```

## Solution

The `patchedRunHttpRequest` function:

1. **Detects React Native environment** - Checks if the code is running in React Native
2. **Uses expo/fetch when available** - If `expo/fetch` is installed, it uses it for streaming support
3. **Falls back gracefully** - If `expo/fetch` is not available or doesn't support streaming, it falls back to the original `runHttpRequest` implementation (which uses EventSource)

## Usage

The patch is automatically applied in `ProxiedAjoraRuntimeAgent` when making HTTP requests. No additional configuration is needed.

## Requirements

For optimal streaming support in React Native, install `expo/fetch`:

```bash
npm install expo/fetch
# or
yarn add expo/fetch
```

If `expo/fetch` is not available, the code will fall back to EventSource-based streaming, which should still work but may have different behavior.

## When to Remove

This patch should be removed once `@ag-ui/client` is updated to handle React Native streaming properly. The fix in `ag-ui` should:
- Detect React Native environments
- Use `expo/fetch` when available
- Fall back to EventSource when needed

## Files Modified

- `packages/shared/http-request-patch.ts` - The patch implementation
- `packages/core/agent.ts` - Uses the patched version instead of direct `runHttpRequest` calls

