import { useMemo, useState } from "react";

// 단일 클론 객체 로컬 상태 — 대시보드 편집·채팅 진입 등에서 initial로 주입 후 setClone으로 갱신.

export function useClone(initial = null) {
  const [clone, setClone] = useState(initial);
  return useMemo(() => ({ clone, setClone }), [clone]);
}
