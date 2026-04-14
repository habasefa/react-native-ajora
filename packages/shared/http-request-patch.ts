/**
 * Patch for runHttpRequest to support React Native streaming via expo/fetch
 * This is a temporary workaround until ag-ui is fixed
 */

import { Observable, from, defer, throwError } from "rxjs";
import { mergeMap, switchMap } from "rxjs/operators";

// Local type definitions matching @ag-ui/client
enum HttpEventType {
  HEADERS = "headers",
  DATA = "data",
}

interface HttpDataEvent {
  type: HttpEventType.DATA;
  data?: Uint8Array;
}

interface HttpHeadersEvent {
  type: HttpEventType.HEADERS;
  status: number;
  headers: Headers;
}

type HttpEvent = HttpDataEvent | HttpHeadersEvent;

/**
 * Detects if we're in a React Native environment.
 * Cached at module level — the runtime environment never changes.
 */
const _isReactNative: boolean = (() => {
  return (
    (typeof navigator !== "undefined" && navigator.product === "ReactNative") ||
    (typeof global !== "undefined" &&
      (global as any).navigator?.product === "ReactNative") ||
    (typeof navigator !== "undefined" &&
      (navigator as any).userAgent === "ReactNative") ||
    (typeof global !== "undefined" &&
      typeof (global as any).require !== "undefined" &&
      typeof (global as any).require.resolve === "function" &&
      (() => {
        try {
          (global as any).require.resolve("react-native");
          return true;
        } catch {
          return false;
        }
      })())
  );
})();

/**
 * Resolves expo/fetch once at module load. Cached so we don't pay the
 * try/catch cost on every HTTP request.
 */
const _expoFetch: typeof fetch | null = (() => {
  if (!_isReactNative) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const expoFetch = require("expo/fetch");
    if (expoFetch && typeof expoFetch.default === "function") {
      return expoFetch.default;
    }
    if (expoFetch && typeof expoFetch.fetch === "function") {
      return expoFetch.fetch;
    }
  } catch {
    // expo/fetch not available
  }

  return null;
})();

/**
 * Patched version of runHttpRequest that uses expo/fetch in React Native
 * This fixes the "Failed to getReader() from response" error
 */
export function patchedRunHttpRequest(
  url: string,
  requestInit: RequestInit,
  originalRunHttpRequest: (
    url: string,
    requestInit: RequestInit
  ) => Observable<HttpEvent>
): Observable<HttpEvent> {
  // In React Native, try to use expo/fetch for streaming support
  if (_expoFetch) {
    // Use expo/fetch which supports streaming
    return defer(() => {
      return from(_expoFetch(url, requestInit));
    }).pipe(
      switchMap((response) => {
        if (!response.ok) {
          const contentType = response.headers.get("content-type") || "";
          return from(response.text()).pipe(
            mergeMap((text) => {
              let payload: unknown = text;
              if (contentType.includes("application/json")) {
                try {
                  payload = JSON.parse(text);
                } catch {
                  /* keep raw text */
                }
              }
              const err: any = new Error(
                `HTTP ${response.status}: ${typeof payload === "string" ? payload : JSON.stringify(payload)}`
              );
              err.status = response.status;
              err.payload = payload;
              return throwError(() => err);
            })
          );
        }

        const headersEvent: HttpEvent = {
          type: HttpEventType.HEADERS,
          status: response.status,
          headers: response.headers,
        };

        // The whole reason this patch exists is that `originalRunHttpRequest`
        // (from @ag-ui/client) crashes on React Native with
        // "Failed to getReader() from response". So if expo/fetch hands us
        // back a response without a usable streaming body, falling back to
        // the original path is guaranteed to fail — and worse, the failure
        // mode there is a cryptic runtime error that hides the real cause
        // (expo/fetch misconfigured, Hermes polyfills missing, etc.).
        //
        // Throw a loud, clearly-labeled error so the caller sees what
        // actually happened. `runAgent` / `connectAgent` will surface it
        // as a RUN_FAILED / onError and the chat UI can render a real
        // message instead of silently freezing.
        const body = response.body;
        if (!body) {
          return throwError(
            () =>
              new Error(
                "[ajora] expo/fetch returned a response with no body — " +
                  "streaming is not available on this runtime. Ensure " +
                  "`expo/fetch` is installed and that the server is sending " +
                  "Content-Type: text/event-stream.",
              ),
          );
        }

        if (typeof body.getReader !== "function") {
          return throwError(
            () =>
              new Error(
                "[ajora] expo/fetch returned a response body without " +
                  "`getReader()` — streaming is not supported. Check that " +
                  "`expo` is at a version that exports a WHATWG-compatible " +
                  "ReadableStream from `expo/fetch`.",
              ),
          );
        }

        const reader = body.getReader();
        if (!reader) {
          return throwError(
            () =>
              new Error(
                "[ajora] expo/fetch response body.getReader() returned " +
                  "null/undefined — cannot stream SSE events.",
              ),
          );
        }

        return new Observable<HttpEvent>((subscriber) => {
          subscriber.next(headersEvent);

          (async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const dataEvent: HttpEvent = {
                  type: HttpEventType.DATA,
                  data: value,
                };
                subscriber.next(dataEvent);
              }
              subscriber.complete();
            } catch (error) {
              subscriber.error(error);
            }
          })();

          return () => {
            reader.cancel().catch((error) => {
              if ((error as DOMException)?.name === "AbortError") {
                return;
              }
              // Log instead of throw — throwing inside an RxJS teardown
              // causes an unhandled exception that crashes the app.
              console.error("[ajora] reader.cancel() failed:", error);
            });
          };
        });
      })
    );
  }

  // Not in React Native or expo/fetch not available, use original implementation.
  return originalRunHttpRequest(url, requestInit);
}
