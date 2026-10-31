import { useCallback, useEffect, useRef, useState } from "react";
import type { FileAttachment } from "../lib/fileSystem";
import {
  DEFAULT_ATTACHMENT_LIMITS,
  type AttachmentLimits,
  type UploadAttachmentFn,
} from "../lib/uploader";

export interface AttachmentAddResult {
  accepted: FileAttachment[];
  rejected: Array<{ file: FileAttachment; reason: string }>;
}

export interface UseAttachmentUploaderOptions {
  uploadAttachment?: UploadAttachmentFn;
  limits?: AttachmentLimits;
}

export interface UseAttachmentUploaderResult {
  attachments: FileAttachment[];
  add: (files: FileAttachment[]) => AttachmentAddResult;
  remove: (id: string) => void;
  retry: (id: string) => void;
  clear: () => void;
  /** No attachments, or every attachment is terminal "uploaded". */
  allSettled: boolean;
  /** Any attachment currently uploading. Send button should be disabled. */
  isUploading: boolean;
  /** Any attachment in error state. User must retry or remove. */
  hasErrors: boolean;
}

const PROGRESS_THROTTLE_MS = 100;

function mimeAllowed(mime: string, allowed: readonly string[]): boolean {
  for (const pattern of allowed) {
    if (pattern === mime) return true;
    if (pattern.endsWith("/*") && mime.startsWith(pattern.slice(0, -1))) {
      return true;
    }
  }
  return false;
}

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; code?: string };
  return e.name === "AbortError" || e.code === "ABORT_ERR";
}

/**
 * Owns the lifecycle of in-progress attachment uploads for a single composer.
 *
 * Responsibilities:
 * - Validate files against {@link AttachmentLimits} before they enter state
 *   (rejected files are returned to the caller, never added to the list).
 * - Start an upload per accepted file with its own AbortController.
 * - Throttle progress updates to avoid re-render storms.
 * - Abort in-flight uploads on remove/clear/unmount.
 * - Expose gating flags (`isUploading`, `hasErrors`, `allSettled`) so the UI
 *   can block send until every attachment is terminal.
 */
export function useAttachmentUploader(
  options: UseAttachmentUploaderOptions,
): UseAttachmentUploaderResult {
  const { uploadAttachment, limits } = options;

  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const controllers = useRef<Map<string, AbortController>>(new Map());
  const lastProgressAt = useRef<Map<string, number>>(new Map());

  // Track the latest uploadAttachment so retry() always calls the current one
  // even if the provider swapped it between mount and retry.
  const uploadFnRef = useRef<UploadAttachmentFn | undefined>(uploadAttachment);
  uploadFnRef.current = uploadAttachment;

  // Resolve limits once per render; used only inside add() where we need the
  // current values. Spread against defaults so consumer overrides can be partial.
  const resolvedLimits = {
    ...DEFAULT_ATTACHMENT_LIMITS,
    ...(limits ?? {}),
  };

  const startUpload = useCallback((file: FileAttachment) => {
    const uploader = uploadFnRef.current;
    if (!uploader) {
      setAttachments((prev) =>
        prev.map((a) =>
          a.id === file.id
            ? {
                ...a,
                uploadState: "error",
                uploadError: {
                  message: "Upload handler not configured",
                  retryable: false,
                },
              }
            : a,
        ),
      );
      return;
    }

    const controller = new AbortController();
    controllers.current.set(file.id, controller);
    lastProgressAt.current.set(file.id, 0);

    const onProgress = (progress: number) => {
      if (controller.signal.aborted) return;
      const clamped = Math.max(0, Math.min(100, progress));
      const now = Date.now();
      const last = lastProgressAt.current.get(file.id) ?? 0;
      // Always let terminal progress (100) through so the UI lands on a clean
      // full bar even when the uploader fires rapid 99→100 updates.
      if (clamped < 100 && now - last < PROGRESS_THROTTLE_MS) return;
      lastProgressAt.current.set(file.id, now);
      setAttachments((prev) =>
        prev.map((a) =>
          a.id === file.id ? { ...a, uploadProgress: clamped } : a,
        ),
      );
    };

    uploader(file, { signal: controller.signal, onProgress })
      .then((result) => {
        if (controller.signal.aborted) return;
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === file.id
              ? {
                  ...a,
                  uploadState: "uploaded",
                  uploadProgress: 100,
                  remoteUrl: result.url,
                  remoteKey: result.key,
                  uploadError: undefined,
                }
              : a,
          ),
        );
      })
      .catch((err: unknown) => {
        if (isAbortError(err) || controller.signal.aborted) return;
        const message =
          err instanceof Error && err.message ? err.message : "Upload failed";
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === file.id
              ? {
                  ...a,
                  uploadState: "error",
                  uploadError: { message, retryable: true },
                }
              : a,
          ),
        );
      })
      .finally(() => {
        // Only clear if this controller is still the active one — a retry()
        // between now and the .finally() may have installed a newer controller.
        if (controllers.current.get(file.id) === controller) {
          controllers.current.delete(file.id);
        }
      });
  }, []);

  const add = useCallback(
    (files: FileAttachment[]): AttachmentAddResult => {
      const accepted: FileAttachment[] = [];
      const rejected: AttachmentAddResult["rejected"] = [];

      const { maxAttachments, maxFileSizeBytes, allowedMimeTypes } =
        resolvedLimits;

      const remainingCapacity = Math.max(
        0,
        maxAttachments - attachments.length,
      );

      for (const file of files) {
        if (accepted.length >= remainingCapacity) {
          rejected.push({
            file,
            reason: `Attachment limit reached (${maxAttachments}).`,
          });
          continue;
        }
        if (file.size !== undefined && file.size > maxFileSizeBytes) {
          rejected.push({
            file,
            reason: `File exceeds max size of ${maxFileSizeBytes} bytes.`,
          });
          continue;
        }
        if (!mimeAllowed(file.mimeType, allowedMimeTypes)) {
          rejected.push({
            file,
            reason: `File type "${file.mimeType}" is not allowed.`,
          });
          continue;
        }
        accepted.push({
          ...file,
          uploadState: "uploading",
          uploadProgress: 0,
          uploadError: undefined,
          remoteUrl: undefined,
          remoteKey: undefined,
        });
      }

      if (accepted.length > 0) {
        setAttachments((prev) => [...prev, ...accepted]);
        accepted.forEach(startUpload);
      }

      return { accepted, rejected };
    },
    [
      attachments.length,
      resolvedLimits.maxAttachments,
      resolvedLimits.maxFileSizeBytes,
      resolvedLimits.allowedMimeTypes,
      startUpload,
    ],
  );

  const remove = useCallback((id: string) => {
    const controller = controllers.current.get(id);
    if (controller) {
      controller.abort();
      controllers.current.delete(id);
    }
    lastProgressAt.current.delete(id);
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const retry = useCallback(
    (id: string) => {
      let target: FileAttachment | undefined;
      setAttachments((prev) => {
        const found = prev.find((a) => a.id === id);
        if (!found || found.uploadState !== "error") return prev;
        target = found;
        return prev.map((a) =>
          a.id === id
            ? {
                ...a,
                uploadState: "uploading",
                uploadProgress: 0,
                uploadError: undefined,
              }
            : a,
        );
      });
      if (target) {
        // Defer so the state update commits before the upload callback fires.
        queueMicrotask(() => {
          // Re-fetch — the previous closure may be stale if remove() ran.
          if (controllers.current.has(id)) return;
          startUpload(target as FileAttachment);
        });
      }
    },
    [startUpload],
  );

  const clear = useCallback(() => {
    for (const controller of controllers.current.values()) {
      controller.abort();
    }
    controllers.current.clear();
    lastProgressAt.current.clear();
    setAttachments([]);
  }, []);

  useEffect(() => {
    const active = controllers.current;
    return () => {
      for (const controller of active.values()) {
        controller.abort();
      }
      active.clear();
    };
  }, []);

  const isUploading = attachments.some((a) => a.uploadState === "uploading");
  const hasErrors = attachments.some((a) => a.uploadState === "error");
  const allSettled =
    attachments.length === 0 ||
    attachments.every((a) => a.uploadState === "uploaded");

  return {
    attachments,
    add,
    remove,
    retry,
    clear,
    allSettled,
    isUploading,
    hasErrors,
  };
}
