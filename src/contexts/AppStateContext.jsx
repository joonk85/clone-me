import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { INIT_MY_CLONES } from "../lib/mockData";

const MASTER_MODE_KEY = "clone_me_master_mode";

function readMasterMode() {
  try {
    const v = localStorage.getItem(MASTER_MODE_KEY);
    if (v === "member" || v === "master") return v;
  } catch (_) {}
  return "member";
}

// 앱 공유 상태 — 역할·선택 클론·구독·마이클론·멤버/마스터 모드 등. Router와 함께 사용.
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
  const [masterMode, setMasterModeState] = useState(readMasterMode);

  const setMasterMode = useCallback((mode) => {
    if (mode !== "member" && mode !== "master") return;
    setMasterModeState(mode);
    try {
      localStorage.setItem(MASTER_MODE_KEY, mode);
    } catch (_) {}
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === MASTER_MODE_KEY && (e.newValue === "member" || e.newValue === "master")) {
        setMasterModeState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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
      masterMode,
      setMasterMode,
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
      masterMode,
      setMasterMode,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
