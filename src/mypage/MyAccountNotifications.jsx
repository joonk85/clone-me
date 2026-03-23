import { useCallback, useEffect, useState } from "react";

import Bt from "../common/Bt";
import Cd from "../common/Cd";
import { ErrorBanner } from "../common/UiStates";
import { useAuth } from "../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMyUserRow, updateMyUserRow } from "../lib/supabaseQueries";

export default function MyAccountNotifications() {
  const { user, supabaseConfigured } = useAuth();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [notifyMarketing, setNotifyMarketing] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyNewMaster, setNotifyNewMaster] = useState(true);
  const [busy, setBusy] = useState(false);

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
      setNotifyNewMaster(row.notify_new_master !== false);
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
    setBusy(true);
    const patch = {
      notify_marketing: notifyMarketing,
      notify_email: notifyEmail,
      notify_new_master: notifyNewMaster,
      updated_at: new Date().toISOString(),
    };
    let { error } = await updateMyUserRow(supabase, user.id, patch);
    if (error && (error.code === "42703" || (error.message && /notify_new_master|column/i.test(error.message)))) {
      const { notify_new_master: _d, ...rest } = patch;
      ({ error } = await updateMyUserRow(supabase, user.id, rest));
      if (!error) {
        setMsg("저장했습니다. 신규 마스터 알림은 `docs/supabase/users_notify_new_master.sql` 적용 후 사용하세요.");
      }
    } else if (!error) {
      setMsg("알림 설정을 저장했습니다.");
    }
    setBusy(false);
    if (error) setErr(error.message);
  };

  if (!supabaseConfigured) {
    return (
      <Cd style={{ padding: "clamp(24px,5vw,36px)", borderStyle: "dashed" }}>
        <p style={{ color: "var(--tx2)", fontFamily: "var(--fn)" }}>Supabase 설정 후 이용할 수 있습니다.</p>
      </Cd>
    );
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <p style={{ fontSize: "var(--fs-xs)", color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 8 }}>NOTIFICATIONS</p>
      <h1 style={{ fontSize: "var(--fs-h2)", fontWeight: 800, margin: "0 0 8px", fontFamily: "var(--fn-title)", color: "var(--tx)" }}>Notifications</h1>
      <p style={{ color: "var(--tx2)", fontSize: "var(--fs-caption)", marginBottom: 22, lineHeight: 1.65, fontFamily: "var(--fn)" }}>
        알림 수신 여부를 설정합니다.
      </p>
      {err ? <ErrorBanner style={{ marginBottom: 12 }}>{err}</ErrorBanner> : null}
      {msg ? <p style={{ color: "var(--cy)", fontSize: "var(--fs-caption)", marginBottom: 12, fontFamily: "var(--fn)" }}>{msg}</p> : null}
      {loading ? (
        <p style={{ color: "var(--tx3)", fontFamily: "var(--fn)" }}>불러오는 중…</p>
      ) : (
        <Cd style={{ padding: "clamp(20px,4vw,28px)", borderColor: "var(--br2)" }}>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "var(--fs-caption)", fontFamily: "var(--fn)", color: "var(--tx)" }}>
              <input type="checkbox" checked={notifyMarketing} onChange={(e) => setNotifyMarketing(e.target.checked)} />
              마케팅 알림 (기본 OFF)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "var(--fs-caption)", fontFamily: "var(--fn)", color: "var(--tx)" }}>
              <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
              이메일 알림 (기본 ON)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "var(--fs-caption)", fontFamily: "var(--fn)", color: "var(--tx)" }}>
              <input type="checkbox" checked={notifyNewMaster} onChange={(e) => setNotifyNewMaster(e.target.checked)} />
              신규 마스터 알림
            </label>
            <Bt v="pr" type="submit" dis={busy}>
              {busy ? "저장 중…" : "저장"}
            </Bt>
          </form>
        </Cd>
      )}
    </div>
  );
}
