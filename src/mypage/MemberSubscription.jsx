import { Link, useNavigate } from "react-router-dom";
import { CheckIcon } from "@heroicons/react/24/outline";

import Bt from "../common/Bt";
import { usePlatformSubscription } from "../contexts/PlatformSubscriptionContext";
import { PLANS } from "../lib/platformPlans";

export default function MemberSubscription() {
  const navigate = useNavigate();
  const { planId, plan, billing, isPaid, setPlanMock } = usePlatformSubscription();
  const p = plan || PLANS.free;
  const billLabel = billing === "annual" ? "연간 결제 (Mock)" : "월간 결제 (Mock)";

  const cancelSubMock = () => {
    if (!isPaid) return;
    if (!window.confirm("Mock 구독을 취소하고 Free로 되돌릴까요?")) return;
    setPlanMock("free", "monthly");
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <p style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 8 }}>SUBSCRIPTION</p>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, fontFamily: "var(--fn-title)", color: "var(--tx)" }}>플랫폼 구독</h2>
      <p style={{ color: "var(--tx2)", fontSize: 13, marginBottom: 20, lineHeight: 1.65 }}>
        멤버 요금제는 <strong style={{ color: "var(--tx)" }}>Free / Basic / Pro / Ultimate</strong>입니다. 실제 결제·월 토큰 자동 지급은 Phase 3에서{" "}
        <code style={{ fontSize: 11 }}>platform_subscriptions</code>와 토스페이먼츠로 연동 예정이며, 지금은 Mock(localStorage)만 동작합니다. 레거시{" "}
        <code style={{ fontSize: 11 }}>clone_subscriptions</code> 기반 클론별 월구독은 사용하지 않습니다.
      </p>

      <div
        style={{
          border: "1px solid var(--br)",
          borderRadius: "var(--r-lg)",
          padding: 20,
          background: "var(--sf2)",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 12, color: "var(--tx3)", marginBottom: 6, fontFamily: "var(--mo)" }}>현재 플랜</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--tx)", fontFamily: "var(--fn)" }}>{p.name}</div>
        {isPaid && <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 6, fontFamily: "var(--mo)" }}>{billLabel}</div>}
        <ul style={{ margin: "14px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
          {p.perks.map((line) => (
            <li key={line} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--tx2)", lineHeight: 1.55 }}>
              <CheckIcon style={{ width: 18, height: 18, flexShrink: 0, color: "var(--go)", marginTop: 2 }} aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <Bt v="pr" on={() => navigate("/pricing")}>
          요금제 비교 · 변경
        </Bt>
        <Bt v="gh" on={() => navigate("/my/subscription")}>
          토큰 충전하기
        </Bt>
        {isPaid && (
          <Bt v="gh" on={cancelSubMock}>
            구독 취소 (Mock)
          </Bt>
        )}
      </div>
      <p style={{ marginTop: 16, fontSize: "var(--fs-xs)", color: "var(--tx3)", lineHeight: 1.55 }}>
        공개 요금표는 <Link to="/pricing" style={{ color: "var(--cy)", fontWeight: 600 }}>/pricing</Link> 에서 확인할 수 있습니다.
      </p>
    </div>
  );
}
