import { useNavigate } from "react-router-dom";

import Bt from "../../common/Bt";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase";
import { fetchMasterForUser } from "../../lib/supabaseQueries";

export default function MasterRevenue() {
  const { user, supabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [hasMaster, setHasMaster] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !user?.id) {
        setLoading(false);
        return;
      }
      const { row } = await fetchMasterForUser(supabase);
      setHasMaster(!!row);
      setLoading(false);
    })();
  }, [user?.id]);

  if (!supabaseConfigured || loading) {
    return <p style={{ color: "var(--tx3)" }}>{!supabaseConfigured ? "Supabase 필요" : "불러오는 중…"}</p>;
  }
  if (!hasMaster) {
    return (
      <div>
        <p style={{ color: "var(--tx2)", marginBottom: 16 }}>마스터 프로필을 먼저 등록하세요.</p>
        <Bt v="pr" on={() => navigate("/my/master/profile")}>
          프로필 등록
        </Bt>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 10, color: "var(--go)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 8 }}>REVENUE</p>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>수익</h2>
      <p style={{ color: "var(--tx2)", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        정산·수익 리포트는 결제·정산 API 연동 후 표시됩니다. (현재 Mock)
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { k: "이번 달", v: "₩0" },
          { k: "누적", v: "₩0" },
          { k: "정산 예정", v: "—" },
        ].map((x) => (
          <div key={x.k} style={{ padding: 16, borderRadius: 12, border: "1px solid var(--br)", background: "var(--sf2)" }}>
            <div style={{ fontSize: 11, color: "var(--tx3)" }}>{x.k}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--tx)", marginTop: 6 }}>{x.v}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: "var(--tx3)" }}>토큰 사용 내역 기반 정산은 Phase 3에서 제공 예정입니다.</p>
    </div>
  );
}
