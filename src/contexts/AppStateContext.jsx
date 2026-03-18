import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { INIT_MY_CLONES } from "../lib/mockData";

// 앱 공유 상태 — 역할·선택 클론·구독·마이클론 등. Router와 함께 사용.
const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [role, setRole] = useState("buyer");
  const [activeClone, setActiveClone] = useState(null);
  const [viewingClone, setViewingClone] = useState(null);
  const [subscribed, setSubscribed] = useState([]);
  const [freeUsed, setFreeUsed] = useState({});
  const [surveyDone, setSurveyDone] = useState([]);
  const [myClones, setMyClones] = useState(INIT_MY_CLONES);
  const [activeMyClone, setActiveMyClone] = useState(null);

  const updateActiveMyClone = useCallback((fn) => {
    setMyClones((prev) => prev.map((c) => (c.id === activeMyClone?.id ? { ...c, ...fn(c) } : c)));
    setActiveMyClone((prev) => (prev ? { ...prev, ...fn(prev) } : prev));
  }, [activeMyClone?.id]);

  const addMyClone = useCallback((clone) => {
    setMyClones((prev) => [...prev, clone]);
  }, []);

  const value = useMemo(
    () => ({
      role,
      setRole,
      activeClone,
      setActiveClone,
      viewingClone,
      setViewingClone,
      subscribed,
      setSubscribed,
      freeUsed,
      setFreeUsed,
      surveyDone,
      setSurveyDone,
      myClones,
      setMyClones,
      activeMyClone,
      setActiveMyClone,
      updateActiveMyClone,
      addMyClone,
    }),
    [
      role,
      activeClone,
      viewingClone,
      subscribed,
      freeUsed,
      surveyDone,
      myClones,
      activeMyClone,
      updateActiveMyClone,
      addMyClone,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
