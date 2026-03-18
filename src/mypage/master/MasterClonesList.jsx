import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Av from "../../common/Av";
import Bt from "../../common/Bt";
import { useAuth } from "../../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../../lib/supabase";
import { fetchClonesForMaster, fetchMasterForUser } from "../../lib/supabaseQueries";

export default function MasterClonesList() {
  const { user, supabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [masterId, setMasterId] = useState(null);

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
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

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
      <p style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 8 }}>CLONES</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>내 클론</h2>
        <Bt v="pr" on={() => navigate("/dashboard/create")}>
          + 새 클론
        </Bt>
      </div>
      {rows.length === 0 ? (
        <p style={{ color: "var(--tx2)", marginBottom: 16 }}>아직 클론이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => navigate(`/dashboard/${c.id}`)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid var(--br)",
                  background: "var(--sf2)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "var(--fn)",
                }}
              >
                {c.av ? (
                  <img src={c.av} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover" }} />
                ) : (
                  <Av char={c.name?.charAt(0) || "?"} color={c.color || "#63d9ff"} size={48} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: "var(--tx)" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--tx2)" }}>
                    {c.is_active ? "● 마켓 노출" : "○ 비활성"} · 토큰 {c.token_price}T/턴
                  </div>
                </div>
                <span style={{ color: "var(--cy)" }}>관리 →</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ marginTop: 20 }}>
        <Bt v="gh" on={() => navigate("/dashboard")}>
          대시보드 전체
        </Bt>
      </div>
    </div>
  );
}
