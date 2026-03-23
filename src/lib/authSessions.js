import { getSupabaseAuthConfig } from "./supabase";

/** @param {string} accessToken */
export function decodeJwtPayload(accessToken) {
  try {
    const p = accessToken.split(".")[1];
    if (!p) return null;
    const pad = p.length % 4 === 2 ? "==" : p.length % 4 === 3 ? "=" : "";
    const json = atob(p.replace(/-/g, "+").replace(/_/g, "/") + pad);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** @param {string} [ua] */
export function browserFromUA(ua = "") {
  if (/Edg\//.test(ua)) return "Microsoft Edge";
  if (/Chrome\//.test(ua) && !/Edg|OPR\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua) && !/Chrom|Android/.test(ua)) return "Safari";
  if (/OPR\//.test(ua)) return "Opera";
  return "Web browser";
}

/** @param {string} [ua] */
export function deviceNameFromUA(ua = "") {
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android device";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/Linux/.test(ua)) return "Linux";
  return "This device";
}

/**
 * @param {import("@supabase/supabase-js").Session} session
 */
export function buildLocalSessionRow(session) {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const claims = decodeJwtPayload(session.access_token);
  const sid = claims?.session_id || "current";
  const u = session.user;
  const when = u?.last_sign_in_at || new Date().toISOString();
  return {
    id: String(sid),
    session_id: String(sid),
    user_agent: ua,
    browser: browserFromUA(ua),
    device: deviceNameFromUA(ua),
    updated_at: when,
    isCurrent: true,
  };
}

/**
 * Supabase 공개 SDK에 listSessions가 없을 수 있어 Auth REST를 시도하고, 실패 시 현재 기기 1행만 반환.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 */
export async function fetchAuthSessionsForUser(supabase) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return { sessions: [], source: "none" };

  const { url, anonKey } = getSupabaseAuthConfig();
  if (!url || !anonKey) {
    return { sessions: [buildLocalSessionRow(session)], source: "local" };
  }

  const tryPaths = [`${url.replace(/\/$/, "")}/auth/v1/user/sessions`, `${url.replace(/\/$/, "")}/auth/v1/sessions`];
  const claims = decodeJwtPayload(session.access_token);
  const currentSid = claims?.session_id ? String(claims.session_id) : null;

  for (const path of tryPaths) {
    try {
      const res = await fetch(path, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: anonKey,
        },
      });
      if (res.ok) {
        const body = await res.json();
        const arr = Array.isArray(body) ? body : body?.sessions ?? body?.data;
        if (Array.isArray(arr) && arr.length > 0) {
          const mapped = arr.map((row) => {
            const id = String(row.id ?? row.session_id ?? "");
            const ua = row.user_agent || row.tag || "";
            return {
              id,
              session_id: id,
              user_agent: ua,
              browser: browserFromUA(ua),
              device: deviceNameFromUA(ua),
              updated_at: row.updated_at || row.created_at || row.last_seen_at || new Date().toISOString(),
              isCurrent: Boolean(currentSid && id === currentSid),
            };
          });
          if (!mapped.some((m) => m.isCurrent) && currentSid) {
            mapped.unshift({ ...buildLocalSessionRow(session), isCurrent: true });
          }
          return { sessions: mapped, source: "api" };
        }
      }
    } catch {
      /* try next */
    }
  }

  return { sessions: [buildLocalSessionRow(session)], source: "local" };
}

/**
 * 단일 세션 해제 시도 (백엔드 미지원 시 false).
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} sessionId
 */
export async function tryRevokeSessionById(supabase, sessionId) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token || !sessionId) return false;
  const { url, anonKey } = getSupabaseAuthConfig();
  if (!url || !anonKey) return false;
  try {
    const base = url.replace(/\/$/, "");
    const res = await fetch(`${base}/auth/v1/sessions/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: anonKey,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}
