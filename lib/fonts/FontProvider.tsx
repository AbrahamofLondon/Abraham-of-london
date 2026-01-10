"use client";
import * as React from "react";

type Ctx = { loaded: boolean };

const FontContext = React.createContext<Ctx>({ loaded: true });

export const FontProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <FontContext.Provider value={{ loaded: true }}>
      {children}
    </FontContext.Provider>
  );
};

export function useFonts(): Ctx {
  return React.useContext(FontContext);
}


