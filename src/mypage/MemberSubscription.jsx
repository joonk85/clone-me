import { useNavigate } from "react-router-dom";

import Bt from "../common/Bt";

export default function MemberSubscription() {
  const navigate = useNavigate();
  return (
    <div>
      <p style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 8 }}>SUBSCRIPTION</p>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>구독 관리</h2>
      <p style={{ color: "var(--tx2)", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        유료 멤버십·패스 구독은 Phase 3에서 결제 연동 예정입니다. 현재는 토큰 충전으로 이용하세요.
      </p>
      <div
        style={{
          border: "1px solid var(--br)",
          borderRadius: 12,
          padding: 20,
          background: "var(--sf2)",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 12, color: "var(--tx3)", marginBottom: 6 }}>현재 플랜</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--tx)" }}>Free</div>
        <p style={{ fontSize: 12, color: "var(--tx2)", marginTop: 8 }}>토큰 구매로 클론과 대화할 수 있습니다.</p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Bt v="gh" on={() => {}} dis>
          Plus 업그레이드 (준비 중)
        </Bt>
        <Bt v="pr" on={() => navigate("/my/tokens")}>
          토큰 충전하기
        </Bt>
      </div>
    </div>
  );
}
