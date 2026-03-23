import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Bt from "../../common/Bt";
import { useAuth } from "../../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../../lib/supabase";
import { fetchClonesForMaster, fetchMasterForUser } from "../../lib/supabaseQueries";
import { formatApproxWonPerTurn } from "../../lib/tokenPricing";

export default function MasterPricing() {
  const { user, supabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState({});
  const [masterId, setMasterId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) {
      setLoading(false);
      return;
    }
    const { row: m } = await fetchMasterForUser(supabase);
    if (!m) {
      setMasterId(null);
      setRows([]);
      setLoading(false);
      return;
    }
    setMasterId(m.id);
    const { rows: list } = await fetchClonesForMaster(supabase, m.id);
    setRows(list);
    const d = {};
    list.forEach((c) => {
      d[c.id] = String(c.token_price ?? 1);
    });
    setDraft(d);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const saveOne = async (cloneId) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const n = Math.max(1, parseInt(draft[cloneId], 10) || 1);
    setSaving(cloneId);
    setMsg("");
    const { error } = await supabase.from("clones").update({ token_price: n, updated_at: new Date().toISOString() }).eq("id", cloneId);
    setSaving(null);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg("저장했습니다.");
    load();
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
      <p style={{ fontSize: 10, color: "var(--pu)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 8 }}>PRICING</p>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>단가 설정</h2>
      <p style={{ color: "var(--tx2)", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
        클론별 토큰 소모량 (턴당)을 설정합니다. 멤버 채팅 UI에는 <strong style={{ color: "var(--tx)" }}>1토큰≈₩100</strong> 기준 원화 참고(
        {formatApproxWonPerTurn(3)} 등)가 함께 표시됩니다.
      </p>
      {msg ? <p style={{ color: "var(--cy)", fontSize: 13, marginBottom: 12 }}>{msg}</p> : null}
      {rows.length === 0 ? (
        <p style={{ color: "var(--tx2)" }}>클론이 없습니다. 먼저 클론을 만드세요.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: 12,
                border: "1px solid var(--br)",
                background: "var(--sf2)",
              }}
            >
              <span style={{ fontWeight: 700, flex: "1 1 120px", minWidth: 0 }}>{c.name}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  토큰/턴
                  <input
                    type="number"
                    min={1}
                    value={draft[c.id] ?? "1"}
                    onChange={(e) => setDraft((d) => ({ ...d, [c.id]: e.target.value }))}
                    style={{
                      width: 72,
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--br)",
                      background: "var(--bg)",
                      color: "var(--tx)",
                      fontFamily: "var(--fn)",
                    }}
                  />
                </label>
                <span style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)" }}>
                  {formatApproxWonPerTurn(Math.max(1, parseInt(draft[c.id], 10) || 1))} 참고
                </span>
              </div>
              <Bt v="pr" sz="sm" dis={saving === c.id} on={() => saveOne(c.id)}>
                {saving === c.id ? "…" : "적용"}
              </Bt>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
