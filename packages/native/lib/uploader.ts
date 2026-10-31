import type { FileAttachment } from "./fileSystem";

/**
 * Result of a successful attachment upload.
 */
export interface UploadResult {
  /** Public or signed URL for the uploaded asset. */
  url: string;
  /**
   * Storage key/identifier (e.g., S3 object key). Optional because not every
   * backend exposes one; when present, the library uses it for cancellation
   * cleanup and server-side message linking.
   */
  key?: string;
}

/**
 * Context passed to an upload function. Supports cancellation and progress.
 */
export interface UploadContext {
  /**
   * Abort signal. Implementations MUST observe this and reject with an
   * AbortError (or DOMException name === "AbortError") when triggered.
   */
  signal: AbortSignal;
  /**
   * Progress callback. Value is 0-100 to match {@link FileAttachment.uploadProgress}.
   * Callers should throttle upstream if events are frequent.
   */
  onProgress: (progress: number) => void;
}

/**
 * Consumer-provided function that uploads a local file and returns its remote URL.
 *
 * Contract:
 * - Resolve with {@link UploadResult} on success.
 * - Reject with an AbortError if `ctx.signal` fires.
 * - Reject with any other Error on failure; the library surfaces it via
 *   {@link FileAttachment.uploadError}.
 */
export type UploadAttachmentFn = (
  file: FileAttachment,
  ctx: UploadContext,
) => Promise<UploadResult>;

/**
 * Limits applied to attachments before they are accepted into the composer.
 * Consumers may override any field; unspecified fields fall back to
 * {@link DEFAULT_ATTACHMENT_LIMITS}.
 */
export interface AttachmentLimits {
  /** Max attachments per message. */
  maxAttachments?: number;
  /** Max per-file size in bytes. */
  maxFileSizeBytes?: number;
  /**
   * Allowed MIME types. Supports exact match (`"image/png"`) and wildcard
   * suffix (`"image/*"`). Empty array disables attachments entirely.
   */
  allowedMimeTypes?: string[];
}

/**
 * Default attachment limits. Chosen to be conservative and match typical
 * multimodal model provider capabilities.
 */
export const DEFAULT_ATTACHMENT_LIMITS: Required<AttachmentLimits> = {
  maxAttachments: 10,
  maxFileSizeBytes: 25 * 1024 * 1024,
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "application/pdf",
    "text/plain",
  ],
};
