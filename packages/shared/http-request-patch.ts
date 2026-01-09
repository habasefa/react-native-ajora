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
 * Detects if we're in a React Native environment
 */
function isReactNative(): boolean {
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
}

/**
 * Gets expo/fetch if available, otherwise returns null
 */
function getExpoFetch(): typeof fetch | null {
  if (!isReactNative()) {
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
}

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
  const expoFetch = getExpoFetch();
  if (expoFetch) {
    // Use expo/fetch which supports streaming
    return defer(() => from(expoFetch(url, requestInit))).pipe(
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

        const body = response.body;
        if (!body) {
          // Fall back to original implementation (which will use EventSource)
          return originalRunHttpRequest(url, requestInit);
        }

        if (typeof body.getReader !== "function") {
          // Fall back to original implementation (which will use EventSource)
          return originalRunHttpRequest(url, requestInit);
        }

        const reader = body.getReader();
        if (!reader) {
          // Fall back to original implementation (which will use EventSource)
          return originalRunHttpRequest(url, requestInit);
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
              throw error;
            });
          };
        });
      })
    );
  }

  // Not in React Native or expo/fetch not available, use original implementation
  return originalRunHttpRequest(url, requestInit);
}
