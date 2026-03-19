import { createContext, useContext, useState, useCallback } from "react";

const PageTitleContext = createContext({ title: null, setPageTitle: () => {} });

export function PageTitleProvider({ children }) {
  const [title, setTitle] = useState(null);
  const setPageTitle = useCallback((t) => setTitle(typeof t === "string" ? t : null), []);
  return (
    <PageTitleContext.Provider value={{ title, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  return useContext(PageTitleContext);
}
