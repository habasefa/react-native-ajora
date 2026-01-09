import React, { useMemo } from "react";
import { AjoraChat, AjoraChatProps } from "./AjoraChat";
import AjoraChatView, { AjoraChatViewProps } from "./AjoraChatView";
import { AjoraSidebarView, AjoraSidebarViewProps } from "./AjoraSidebarView";

export type AjoraSidebarProps = Omit<AjoraChatProps, "chatView"> & {
  header?: AjoraSidebarViewProps["header"];
  defaultOpen?: boolean;
};

export function AjoraSidebar({ header, defaultOpen, ...chatProps }: AjoraSidebarProps) {
  const SidebarViewOverride = useMemo(() => {
    const Component: React.FC<AjoraChatViewProps> = (viewProps) => {
      const { header: viewHeader, ...restProps } = viewProps as AjoraSidebarViewProps;

      return (
        <AjoraSidebarView
          {...(restProps as AjoraSidebarViewProps)}
          header={header ?? viewHeader}
        />
      );
    };

    return Object.assign(Component, AjoraChatView);
  }, [header]);

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
