import React, { useMemo } from "react";
import { AjoraChat, AjoraChatProps } from "./AjoraChat";
import AjoraChatView, { AjoraChatViewProps } from "./AjoraChatView";
import { AjoraSidebarView, AjoraSidebarViewProps } from "./AjoraSidebarView";

export type AjoraSidebarProps = Omit<AjoraChatProps, "chatView"> & {
  header?: AjoraSidebarViewProps["header"];
  defaultOpen?: boolean;
  /** Placeholder text for the collapsed input bar */
  collapsedPlaceholder?: string;
  /**
   * Override the collapsed affordance shown while the sheet is closed.
   * Forwarded to {@link AjoraSidebarView}. Receives `onPress` to open
   * the sheet.
   */
  collapsed?: AjoraSidebarViewProps["collapsed"];
};

export function AjoraSidebar({
  header,
  defaultOpen,
  collapsedPlaceholder,
  collapsed,
  ...chatProps
}: AjoraSidebarProps) {
  const SidebarViewOverride = useMemo(() => {
    const Component: React.FC<AjoraChatViewProps> = (viewProps) => {
      const { header: viewHeader, ...restProps } = viewProps as AjoraSidebarViewProps;

      return (
        <AjoraSidebarView
          {...(restProps as AjoraSidebarViewProps)}
          header={header ?? viewHeader}
          collapsedPlaceholder={collapsedPlaceholder}
          collapsed={collapsed}
        />
      );
    };

    return Object.assign(Component, AjoraChatView);
  }, [header, collapsedPlaceholder, collapsed]);

  return (
    <AjoraChat
      {...chatProps}
      chatView={SidebarViewOverride}
      // A sidebar is the *collapsed* affordance plus a sheet: its resting
      // state is the bar, and the sheet is the thing a tap opens. Letting the
      // configuration default to open (which it does when this prop is
      // `undefined`) hid the bar on mount while the sheet stayed closed at
      // index -1, so the host screen showed nothing at all. Collapsed is the
      // only safe default; consumers that want the sheet up on mount pass
      // `defaultOpen`.
      isModalDefaultOpen={defaultOpen ?? false}
    />
  );
}

AjoraSidebar.displayName = "AjoraSidebar";

export default AjoraSidebar;
