import { createClient } from "@supabase/supabase-js";

// 브라우저용 Supabase 클라이언트 — RLS·Auth·Storage·Realtime. pgvector는 DB에서 확장 활성화 후 사용.

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let browserClient;

/**
 * 싱글톤 브라우저 클라이언트. 환경변수 없으면 null 반환(빌드·로컬 미설정 시).
 * @returns {import("@supabase/supabase-js").SupabaseClient | null}
 */
export function getSupabaseBrowserClient() {
  if (!url || !anonKey) return null;
  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}

/**
 * 클라이언트 필수 시 사용. 미설정이면 명확한 에러.
 */
export function requireSupabaseBrowserClient() {
  const c = getSupabaseBrowserClient();
  if (!c) {
    throw new Error(
      "Supabase 미설정: 루트에 .env에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 를 설정하세요."
    );
  }
  return c;
}

/** Auth REST 호출용 (세션 목록 시도 등). */
export function getSupabaseAuthConfig() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL || "",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  };
}
