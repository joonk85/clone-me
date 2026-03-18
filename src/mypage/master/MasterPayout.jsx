import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Bt from "../../common/Bt";
import { ErrorBanner } from "../../common/UiStates";
import { useAuth } from "../../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../../lib/supabase";
import { fetchMasterForUser, updateMaster } from "../../lib/supabaseQueries";

const field = {
  width: "100%",
  maxWidth: 400,
  padding: "10px 12px",
  border: "1px solid var(--br)",
  borderRadius: 8,
  background: "var(--sf2)",
  color: "var(--tx)",
  fontSize: 14,
  outline: "none",
  fontFamily: "var(--fn)",
};

export default function MasterPayout() {
  const { user, supabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [masterId, setMasterId] = useState(null);
  const [bank, setBank] = useState("");
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) {
      setLoading(false);
      return;
    }
    const { row: m } = await fetchMasterForUser(supabase);
    if (!m) {
      setMasterId(null);
      setLoading(false);
      return;
    }
    setMasterId(m.id);
    const b = m.bank_account && typeof m.bank_account === "object" ? m.bank_account : {};
    setBank(b.bank_name || b.bank || "");
    setNumber(b.account_number || b.number || "");
    setHolder(b.account_holder || b.holder || "");
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !masterId) return;
    setErr("");
    setMsg("");
    setSaving(true);
    const bank_account = {
      bank_name: bank.trim(),
      account_number: number.trim(),
      account_holder: holder.trim(),
    };
    const { error } = await updateMaster(supabase, masterId, {
      bank_account,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg("저장했습니다. 실제 정산은 본인 명의 확인 후 진행됩니다.");
  };

  if (!supabaseConfigured) {
    return <p style={{ color: "var(--tx2)" }}>Supabase 설정 후 이용할 수 있습니다.</p>;
  }
  if (loading) {
    return <p style={{ color: "var(--tx3)" }}>불러오는 중…</p>;
  }
  if (!masterId) {
    return (
      <div>
        <p style={{ color: "var(--tx2)", marginBottom: 16 }}>마스터 프로필이 필요합니다.</p>
        <Bt v="pr" on={() => navigate("/my/master/profile")}>
          프로필 등록
        </Bt>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 8 }}>PAYOUT</p>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>정산 계좌</h2>
      <p style={{ color: "var(--tx2)", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
        정산 대금 입금 계좌입니다. 입력 정보는 암호화 저장 권장 (운영 시 정책 반영).
      </p>
      {err ? <ErrorBanner style={{ marginBottom: 12 }}>{err}</ErrorBanner> : null}
      {msg ? <p style={{ color: "var(--cy)", fontSize: 13, marginBottom: 12 }}>{msg}</p> : null}
      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>은행명</label>
          <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="예: 국민은행" style={field} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>계좌번호</label>
          <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="숫자만" style={field} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>예금주</label>
          <input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="실명" style={field} />
        </div>
        <Bt v="pr" type="submit" dis={saving}>
          {saving ? "저장 중…" : "저장"}
        </Bt>
      </form>
    </div>
  );
}
