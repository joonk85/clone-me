import Bt from "../common/Bt";

// 토큰 사용·충전 내역 — Phase 3에서 Supabase ledger 조회·페이지네이션 연동.

const MOCK_ROWS = [
  { id: "1", when: "2025.01.15 14:02", kind: "사용", amount: "-12", note: "김민준 클론 대화" },
  { id: "2", when: "2025.01.14 09:30", kind: "충전", amount: "+200", note: "월 패키지" },
];

export default function TokenHistory() {
  return (
    <div style={{ minHeight: 520, padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 10 }}>TOKENS</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>토큰 내역</h1>
      <p style={{ color: "var(--tx2)", lineHeight: 1.7, marginBottom: 22, fontSize: 13 }}>실제 결제·차감 기록은 DB 연동 후 표시됩니다. 아래는 UI 샘플입니다.</p>

      <div style={{ border: "1px solid var(--br)", borderRadius: 12, overflow: "hidden", background: "var(--sf)", marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 72px 80px 1fr", gap: 0, padding: "10px 14px", fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mo)", borderBottom: "1px solid var(--br)" }}>
          <span>일시</span>
          <span>유형</span>
          <span style={{ textAlign: "right" }}>토큰</span>
          <span>비고</span>
        </div>
        {MOCK_ROWS.map((r) => (
          <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 72px 80px 1fr", gap: 0, padding: "12px 14px", fontSize: 12, borderBottom: "1px solid var(--br)", alignItems: "center" }}>
            <span style={{ color: "var(--tx2)", fontFamily: "var(--mo)", fontSize: 11 }}>{r.when}</span>
            <span>{r.kind}</span>
            <span style={{ textAlign: "right", fontFamily: "var(--mo)", color: r.amount.startsWith("-") ? "var(--am)" : "var(--gn)" }}>{r.amount}</span>
            <span style={{ color: "var(--tx2)", fontSize: 11 }}>{r.note}</span>
          </div>
        ))}
      </div>
      <Bt v="gh" dis>
        더 불러오기 (준비 중)
      </Bt>
    </div>
  );
}
