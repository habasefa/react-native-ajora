/// <reference types="vitest/globals" />

// `react-test-renderer` ships no types and `@types/react-test-renderer` is
// not installed. Minimal ambient declaration for the surface the native
// hook specs use (node-env tests can't use @testing-library/react here).
declare module "react-test-renderer" {
  import type { ReactElement } from "react";
  export interface ReactTestRenderer {
    update(element: ReactElement): void;
    unmount(): void;
    toJSON(): unknown;
  }
  export function create(element: ReactElement): ReactTestRenderer;
  export function act(callback: () => void | Promise<void>): void;
  const _default: { create: typeof create; act: typeof act };
  export default _default;
}
