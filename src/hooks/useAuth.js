import { useMemo, useState } from "react";

// 인증 세션 — Phase 6에서 Supabase onAuthStateChange·getSession과 연동. 현재는 플레이스홀더(user·loading).

export function useAuth() {
  const [user, setUser] = useState(null);
  const loading = false;

  return useMemo(() => ({ user, setUser, loading }), [user]);
}
