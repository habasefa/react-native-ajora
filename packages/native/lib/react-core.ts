import {
  ReactActivityMessageRenderer,
  ReactToolCallRenderer,
  ReactCustomMessageRenderer,
} from "../types";
import {
  AjoraCore,
  AjoraCoreConfig,
  AjoraCoreSubscriber,
  AjoraCoreSubscription,
} from "../../core";

export interface AjoraCoreReactConfig extends AjoraCoreConfig {
  renderToolCalls?: ReactToolCallRenderer<any>[];
  renderActivityMessages?: ReactActivityMessageRenderer<any>[];
  renderCustomMessages?: ReactCustomMessageRenderer[];
}

export interface AjoraCoreReactSubscriber extends AjoraCoreSubscriber {
  onRenderToolCallsChanged?: (event: {
    ajora: AjoraCore;
    renderToolCalls: ReactToolCallRenderer<any>[];
  }) => void | Promise<void>;
}

export class AjoraCoreReact extends AjoraCore {
  private _renderToolCalls: ReactToolCallRenderer<any>[] = [];
  private _renderCustomMessages: ReactCustomMessageRenderer[] = [];
  private _renderActivityMessages: ReactActivityMessageRenderer<any>[] = [];

  constructor(config: AjoraCoreReactConfig) {
    super(config);
    this._renderToolCalls = config.renderToolCalls ?? [];
    this._renderCustomMessages = config.renderCustomMessages ?? [];
    this._renderActivityMessages = config.renderActivityMessages ?? [];
  }

  get renderCustomMessages(): Readonly<ReactCustomMessageRenderer[]> {
    return this._renderCustomMessages;
  }

  get renderActivityMessages(): Readonly<ReactActivityMessageRenderer<any>>[] {
    return this._renderActivityMessages;
  }

  get renderToolCalls(): Readonly<ReactToolCallRenderer<any>>[] {
    return this._renderToolCalls;
  }

  setRenderToolCalls(renderToolCalls: ReactToolCallRenderer<any>[]): void {
    this._renderToolCalls = renderToolCalls;

    void this.notifySubscribers((subscriber) => {
      const reactSubscriber = subscriber as AjoraCoreReactSubscriber;
      if (reactSubscriber.onRenderToolCallsChanged) {
        reactSubscriber.onRenderToolCallsChanged({
          ajora: this,
          renderToolCalls: this.renderToolCalls,
        });
      }
    }, "Subscriber onRenderToolCallsChanged error:");
  }

  subscribe(subscriber: AjoraCoreReactSubscriber): AjoraCoreSubscription {
    // - TS types mismatch slightly but runtime is fine
    return super.subscribe(subscriber);
  }
}
