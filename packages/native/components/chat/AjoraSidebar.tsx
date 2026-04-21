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
      isModalDefaultOpen={defaultOpen}
    />
  );
}

AjoraSidebar.displayName = "AjoraSidebar";

export default AjoraSidebar;
