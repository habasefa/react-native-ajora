import React, { useMemo } from "react";
import { AjoraChat, AjoraChatProps } from "./AjoraChat";
import AjoraChatView, { AjoraChatViewProps } from "./AjoraChatView";
import { AjoraPopupView, AjoraPopupViewProps } from "./AjoraPopupView";

export type AjoraPopupProps = Omit<AjoraChatProps, "chatView"> & {
  header?: AjoraPopupViewProps["header"];
  defaultOpen?: boolean;
};

export function AjoraPopup({
  header,
  defaultOpen,
  ...chatProps
}: AjoraPopupProps) {
  const PopupViewOverride = useMemo(() => {
    const Component: React.FC<AjoraChatViewProps> = (viewProps) => {
      const {
        header: viewHeader,
        ...restProps
      } = viewProps as AjoraPopupViewProps;

      return (
        <AjoraPopupView
          {...(restProps as AjoraPopupViewProps)}
          header={header ?? viewHeader}
        />
      );
    };

    return Object.assign(Component, AjoraChatView);
  }, [header]);

  return (
    <AjoraChat
      {...chatProps}
      chatView={PopupViewOverride}
      isModalDefaultOpen={defaultOpen}
    />
  );
}

AjoraPopup.displayName = "AjoraPopup";

export default AjoraPopup;
