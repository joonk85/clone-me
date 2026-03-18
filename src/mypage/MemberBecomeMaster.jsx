import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Bt from "../common/Bt";
import { useAuth } from "../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMasterForUser, fetchMyUserRow } from "../lib/supabaseQueries";

export default function MemberBecomeMaster() {
  const { user, supabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("member");
  const [hasMaster, setHasMaster] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) {
      setLoading(false);
      return;
    }
    const [{ row: u }, { row: m }] = await Promise.all([fetchMyUserRow(supabase), fetchMasterForUser(supabase)]);
    setRole(u?.role === "master" ? "master" : "member");
    setHasMaster(!!m);
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

  if (role === "master" && hasMaster) {
    return (
      <div>
        <p style={{ fontSize: 10, color: "var(--pu)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 8 }}>MASTER</p>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>마스터 스튜디오</h2>
        <p style={{ color: "var(--tx2)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          이미 마스터 프로필이 있습니다. 프로필·클론·수익은 마스터 탭에서 관리하세요.
        </p>
        <Bt v="pr" on={() => navigate("/my/master/profile")}>
          마스터 스튜디오 열기
        </Bt>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 10, color: "var(--am)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 8 }}>CREATOR</p>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>마스터로 참여하기</h2>
      <p style={{ color: "var(--tx2)", fontSize: 14, marginBottom: 20, lineHeight: 1.7 }}>
        전문 지식을 클론으로 판매하고 토큰 수익을 받으세요. 마스터 등록 후 클론을 만들고 자료를 올리면 마켓에 노출됩니다.
      </p>
      <ul style={{ color: "var(--tx2)", fontSize: 13, lineHeight: 1.8, marginBottom: 24, paddingLeft: 18 }}>
        <li>마스터 프로필·slug 설정</li>
        <li>클론 생성 및 학습 자료 업로드</li>
        <li>토큰 단가·정산 계좌 관리</li>
      </ul>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Bt v="pr" on={() => navigate("/master-register")}>
          마스터 등록 시작
        </Bt>
        <Link to="/my/master/profile" style={{ alignSelf: "center", fontSize: 13, color: "var(--cy)" }}>
          또는 바로 프로필만 작성 →
        </Link>
      </div>
    </div>
  );
}
