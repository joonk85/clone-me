import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

/**
 * 로그인·회원가입·인증 콜백 전용.
 * 이미 로그인된 사용자는 `/`로 보냄 (비로그인만 하위 라우트 표시).
 */
export default function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          color: "var(--tx2)",
          fontFamily: "var(--fn)",
          fontSize: "var(--fs-caption)",
        }}
      >
        확인 중…
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
