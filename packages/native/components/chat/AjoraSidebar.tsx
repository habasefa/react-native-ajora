import React, { useMemo } from "react";
import { AjoraChat, AjoraChatProps } from "./AjoraChat";
import AjoraChatView, { AjoraChatViewProps } from "./AjoraChatView";
import { AjoraSidebarView, AjoraSidebarViewProps } from "./AjoraSidebarView";

export type AjoraSidebarProps = Omit<AjoraChatProps, "chatView"> & {
  header?: AjoraSidebarViewProps["header"];
  defaultOpen?: boolean;
  /** Placeholder text for the collapsed input bar */
  collapsedPlaceholder?: string;
};

export function AjoraSidebar({
  header,
  defaultOpen,
  collapsedPlaceholder,
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
        />
      );
    };

    return Object.assign(Component, AjoraChatView);
  }, [header, collapsedPlaceholder]);

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
