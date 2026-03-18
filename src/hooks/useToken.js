import { useMemo, useState } from "react";

// 토큰 잔액 — Phase 3에서 Supabase RPC/테이블 조회로 동기화. 현재는 데모용 setBalance만.

export function useToken() {
  const [balance, setBalance] = useState(0);
  return useMemo(() => ({ balance, setBalance }), [balance]);
}
