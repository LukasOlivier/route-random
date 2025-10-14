"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type RouteMode = "time" | "distance";

interface RouteModeContextType {
  mode: RouteMode;
  toggleMode: () => void;
}

const RouteModeContext = createContext<RouteModeContextType | undefined>(
  undefined
);

export function RouteModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<RouteMode>("time");

  const toggleMode = () => {
    setMode((prev) => (prev === "time" ? "distance" : "time"));
  };

  return (
    <RouteModeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </RouteModeContext.Provider>
  );
}

export function useRouteMode() {
  const context = useContext(RouteModeContext);
  if (context === undefined) {
    throw new Error("useRouteMode must be used within a RouteModeProvider");
  }
  return context;
}
