import React, { ReactNode } from "react";
import { AjoraContext } from "./AjoraContext";
import { Ajora } from "./hooks/useAjora";

interface AjoraProviderProps {
  children: ReactNode;
  ajora: Ajora;
}

export const AjoraProvider: React.FC<AjoraProviderProps> = ({
  ajora,
  children,
}) => {
  const contextValue = {
    ajora: ajora,
    actionSheet: () => ({
      showActionSheetWithOptions: () => {},
    }),
    getLocale: () => "en",
  };

  return (
    <AjoraContext.Provider value={contextValue}>
      {children}
    </AjoraContext.Provider>
  );
};
