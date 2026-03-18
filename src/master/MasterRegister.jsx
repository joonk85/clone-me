import { useState } from "react";

import Bt from "../common/Bt";

// 마스터(강사) 검증·등록 — 실명·분야·포트폴리오 제출. Phase 이후 운영 검수·승인 플로우 연동.

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

export default function MasterRegister() {
  const [displayName, setDisplayName] = useState("");
  const [fieldExpertise, setFieldExpertise] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Phase: Supabase에 신청 행 INSERT · 알림
  };

  return (
    <div style={{ minHeight: 520, padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <div style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 10 }}>MASTER</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>마스터 등록</h1>
      <p style={{ color: "var(--tx2)", lineHeight: 1.7, marginBottom: 22, fontSize: 13 }}>검증 후 마켓에 클론을 출시할 수 있습니다. 아래는 신청 폼 뼈대입니다.</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label htmlFor="mr-name" style={{ display: "block", fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)", marginBottom: 6 }}>
            활동명 / 실명
          </label>
          <input id="mr-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="공개될 이름" style={field} />
        </div>
        <div>
          <label htmlFor="mr-field" style={{ display: "block", fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)", marginBottom: 6 }}>
            전문 분야 한 줄
          </label>
          <input id="mr-field" value={fieldExpertise} onChange={(e) => setFieldExpertise(e.target.value)} placeholder="예: B2B SaaS 영업" style={field} />
        </div>
        <Bt v="pr" dis>
          신청하기 (준비 중)
        </Bt>
      </form>
    </div>
  );
}
