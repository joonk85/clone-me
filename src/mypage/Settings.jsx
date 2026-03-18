import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Bt from "../common/Bt";
import { useAuth } from "../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMyUserRow, updateMyUserRow } from "../lib/supabaseQueries";

export default function Settings() {
  const { user, signOut, supabaseConfigured } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [notifyMarketing, setNotifyMarketing] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyChat, setNotifyChat] = useState(true);
  const [notifyFeedback, setNotifyFeedback] = useState(true);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let { row, error } = await fetchMyUserRow(supabase);
    if (!row && !error && user?.email) {
      await supabase.from("users").insert({ id: user.id, email: user.email });
      const again = await fetchMyUserRow(supabase);
      row = again.row;
      error = again.error;
    }
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    if (row) {
      setNotifyMarketing(!!row.notify_marketing);
      setNotifyEmail(row.notify_email !== false);
      setNotifyChat(row.notify_chat !== false);
      setNotifyFeedback(row.notify_feedback !== false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) return;
    setSaving(true);
    const { error } = await updateMyUserRow(supabase, user.id, {
      notify_marketing: notifyMarketing,
      notify_email: notifyEmail,
      notify_chat: notifyChat,
      notify_feedback: notifyFeedback,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg("저장했습니다.");
  };

  if (!supabaseConfigured) {
    return (
      <div style={{ minHeight: 320 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>설정</h1>
        <p style={{ color: "var(--tx2)" }}>.env 설정 후 이용하세요.</p>
        <Link to="/login" style={{ color: "var(--cy)" }}>
          로그인
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 520, maxWidth: 560 }}>
      <p style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 8 }}>SETTINGS</p>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>설정</h1>
      <p style={{ color: "var(--tx2)", lineHeight: 1.7, marginBottom: 16, fontSize: 13 }}>
        계정: <strong>{user?.email || "—"}</strong>
        <br />
        <Link to="/my/profile" style={{ color: "var(--cy)", fontSize: 13 }}>
          닉네임·프로필 사진은 프로필 탭
        </Link>
      </p>

      {err ? <p style={{ color: "#f66", fontSize: 13, marginBottom: 12 }}>{err}</p> : null}
      {msg ? <p style={{ color: "var(--cy)", fontSize: 13, marginBottom: 12 }}>{msg}</p> : null}

      {loading ? (
        <p style={{ color: "var(--tx3)", fontSize: 13 }}>불러오는 중…</p>
      ) : (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>알림</div>
          {[
            ["마케팅·이벤트", notifyMarketing, setNotifyMarketing],
            ["이메일 알림", notifyEmail, setNotifyEmail],
            ["채팅 알림", notifyChat, setNotifyChat],
            ["피드백 알림", notifyFeedback, setNotifyFeedback],
          ].map(([label, val, set]) => (
            <label key={label} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13 }}>
              <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} />
              {label}
            </label>
          ))}
          <Bt v="pr" type="submit" dis={saving}>
            {saving ? "저장 중…" : "알림 설정 저장"}
          </Bt>
        </form>
      )}

      <div style={{ marginTop: 36, paddingTop: 24, borderTop: "1px solid var(--br)" }}>
        <Bt v="gh" on={() => signOut()}>
          로그아웃
        </Bt>
      </div>
    </div>
  );
}
