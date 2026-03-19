import { createContext, useContext, useCallback } from "react";

const AppRailContext = createContext({ refreshRail: () => {} });

export function AppRailProvider({ refreshRail, children }) {
  return (
    <AppRailContext.Provider value={{ refreshRail }}>
      {children}
    </AppRailContext.Provider>
  );
}

export function useAppRail() {
  return useContext(AppRailContext);
}
