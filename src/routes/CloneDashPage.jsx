import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import CloneDash from "../master/CloneDash";
import { useAppState } from "../contexts/AppStateContext";

// /dashboard/:cloneId — 클론 대시보드. myClones에서 cloneId 조회.

export default function CloneDashPage() {
  const { cloneId } = useParams();
  const navigate = useNavigate();
  const { activeMyClone, myClones, setActiveMyClone, updateActiveMyClone } = useAppState();

  const clone = myClones.find((c) => c.id === cloneId) || (activeMyClone?.id === cloneId ? activeMyClone : null);
  useEffect(() => {
    if (clone) setActiveMyClone(clone);
  }, [clone?.id]);

  if (!clone || clone.id !== cloneId) {
    const fallback = myClones[0];
    if (fallback) return <Navigate to={`/dashboard/${fallback.id}`} replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <CloneDash
      clone={clone}
      setClone={(fn) => updateActiveMyClone(typeof fn === "function" ? fn : () => fn)}
      onBack={() => navigate("/dashboard")}
      setView={navigate}
    />
  );
}
