import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

// 미인증 → /login?from= | 온보딩 미완료 → /onboarding (Supabase+UUID 사용자만)

export default function ProtectedRoute() {
  const { isAuthenticated, loading, profileLoading, onboardingCompleted, supabaseConfigured, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--tx)" }}>
        <div style={{ fontSize: 14, color: "var(--tx2)" }}>확인 중…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const from = location.pathname + location.search;
    return <Navigate to={from ? `/login?from=${encodeURIComponent(from)}` : "/login"} replace state={{ from: location.pathname }} />;
  }

  const needOnboardingGate =
    supabaseConfigured &&
    user?.id &&
    /^[0-9a-f-]{36}$/i.test(user.id) &&
    profileLoading === false &&
    onboardingCompleted === false;

  if (supabaseConfigured && user?.id && /^[0-9a-f-]{36}$/i.test(user.id) && profileLoading) {
    return (
      <div style={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--tx)" }}>
        <div style={{ fontSize: 14, color: "var(--tx2)" }}>프로필 확인 중…</div>
      </div>
    );
  }

  if (needOnboardingGate && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
