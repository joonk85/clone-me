import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Bt from "../common/Bt";
import { useAuth } from "../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMyUserRow, updateMyUserRow } from "../lib/supabaseQueries";

const field = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid var(--br)",
  borderRadius: 8,
  background: "var(--sf2)",
  color: "var(--tx)",
  fontSize: 14,
  outline: "none",
  fontFamily: "var(--fn)",
};

export default function Settings() {
  const { user, signOut, supabaseConfigured } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [nickname, setNickname] = useState("");
  const [interestsStr, setInterestsStr] = useState("");
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
      setNickname(row.nickname || "");
      setInterestsStr(Array.isArray(row.interests) ? row.interests.join(", ") : "");
      setNotifyMarketing(!!row.notify_marketing);
      setNotifyEmail(row.notify_email !== false);
      setNotifyChat(row.notify_chat !== false);
      setNotifyFeedback(row.notify_feedback !== false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) return;
    const interests = interestsStr
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
    setSaving(true);
    const { error } = await updateMyUserRow(supabase, user.id, {
      nickname: nickname.trim() || null,
      interests: interests.length ? interests : null,
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
      <div style={{ minHeight: 520, padding: 24, maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>내 정보</h1>
        <p style={{ color: "var(--tx2)" }}>Supabase(.env) 설정 후 이용할 수 있습니다.</p>
        <Link to="/login" style={{ color: "var(--cy)" }}>
          로그인
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 520, padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 10 }}>MY</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>내 정보</h1>
      <p style={{ color: "var(--tx2)", lineHeight: 1.7, marginBottom: 22, fontSize: 13 }}>
        계정 이메일: <strong>{user?.email || "—"}</strong> (Auth에서 관리)
      </p>

      {err ? <p style={{ color: "#f66", fontSize: 13, marginBottom: 12 }}>{err}</p> : null}
      {msg ? <p style={{ color: "var(--cy)", fontSize: 13, marginBottom: 12 }}>{msg}</p> : null}

      {loading ? (
        <p style={{ color: "var(--tx3)", fontSize: 13 }}>불러오는 중…</p>
      ) : (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>닉네임</label>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="표시 이름" style={field} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>관심사 (쉼표로 구분)</label>
            <input value={interestsStr} onChange={(e) => setInterestsStr(e.target.value)} placeholder="영업, 마케팅" style={field} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8 }}>알림</div>
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
            {saving ? "저장 중…" : "저장"}
          </Bt>
        </form>
      )}

      <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--br)" }}>
        <Bt v="gh" on={() => signOut()}>
          로그아웃
        </Bt>
      </div>
    </div>
  );
}
