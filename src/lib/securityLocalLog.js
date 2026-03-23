/** 브라우저 로컬 보안 이벤트 로그 (로그인 성공/실패, 비밀번호 변경). 서버 감사 로그는 Phase 3. */

const STORAGE_KEY = "clone_me_security_log_v1";
const MAX_ENTRIES = 200;

/**
 * @param {{ type: 'login_success' | 'login_failed' | 'password_changed', success: boolean, detail?: string }} entry
 */
export function appendSecurityLog(entry) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const row = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `se-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ts: Date.now(),
      type: entry.type,
      success: entry.success,
      detail: entry.detail || "",
    };
    list.unshift(row);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
  } catch {
    /* ignore quota / private mode */
  }
}

/** @returns {Array<{ id: string, ts: number, type: string, success: boolean, detail: string }>} */
export function readSecurityLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
