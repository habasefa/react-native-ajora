import { Context } from "@ag-ui/client";
import { randomUUID } from "@ajora-ai/shared";
import type { AjoraCore } from "./core";
import { AjoraCoreFriendsAccess } from "./core";

/**
 * Manages context storage and lifecycle for AjoraCore.
 * Context represents additional information available to agents during execution.
 */
export class ContextStore {
  private _context: Record<string, Context> = {};

  constructor(private core: AjoraCore) {}

  /**
   * Get all context entries as a readonly record
   */
  get context(): Readonly<Record<string, Context>> {
    return this._context;
  }

  /**
   * Add a new context entry
   * @returns The ID of the created context entry
   */
  addContext({ description, value }: Context): string {
    const id = randomUUID();
    this._context[id] = { description, value };
    void this.notifySubscribers();
    return id;
  }

  /**
   * Remove a context entry by ID
   */
  removeContext(id: string): void {
    delete this._context[id];
    void this.notifySubscribers();
  }

  /**
   * Notify all subscribers of context changes
   */
  private async notifySubscribers(): Promise<void> {
    await (this.core as unknown as AjoraCoreFriendsAccess).notifySubscribers(
      (subscriber) =>
        subscriber.onContextChanged?.({
          ajora: this.core,
          context: this._context,
        }),
      "Subscriber onContextChanged error:"
    );
  }
}
