import React from "react";

// ============================================================================
// Types
// ============================================================================

/**
 * Props for a slot component
 */
export type SlotProps<T> = T & {
  children?: React.ReactNode;
};

/**
 * Type for declaring slot components in a parent component
 */
export type WithSlots<
  TSlots extends Record<string, React.ComponentType<any>>,
  TRestProps = {}
> = TRestProps & {
  [K in keyof TSlots]?: React.ReactElement<
    React.ComponentProps<TSlots[K]>
  > | null;
} & {
  children?: (
    slots: {
      [K in keyof TSlots]: React.ReactElement<React.ComponentProps<TSlots[K]>>;
    } & TRestProps
  ) => React.ReactNode;
};

// ============================================================================
// Slot Rendering Utility
// ============================================================================

/**
 * Renders a slot with fallback to default component
 *
 * @param slotElement - The custom slot element provided by user
 * @param DefaultComponent - The default component to use if no custom slot
 * @param defaultProps - Props to pass to the default component
 * @returns The rendered slot element
 *
 * @example
 * ```tsx
 * const BoundHeader = renderSlot(header, ThreadDrawer.Header, {
 *   title: "Chats",
 *   onClose: handleClose,
 * });
 * ```
 */
export function renderSlot<T extends {}>(
  slotElement: React.ReactElement<T> | null | undefined,
  DefaultComponent: React.ComponentType<T>,
  defaultProps: T
): React.ReactElement<T> {
  if (slotElement) {
    // Clone the slot element and merge with default props
    return React.cloneElement(slotElement, {
      ...defaultProps,
      ...slotElement.props,
    });
  }

  return <DefaultComponent {...defaultProps} />;
}

/**
 * Creates a slot component with proper typing
 *
 * @param Component - The component to wrap as a slot
 * @returns A slot component
 */
export function createSlot<P extends {}>(
  Component: React.ComponentType<P>
): React.FC<SlotProps<P>> {
  const SlotComponent: React.FC<SlotProps<P>> = (props) => {
    return <Component {...props} />;
  };

  return SlotComponent;
}

export default { renderSlot, createSlot };
