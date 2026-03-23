import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckIcon } from "@heroicons/react/24/outline";

import Bt from "../common/Bt";
import { useAuth } from "../contexts/AuthContext";
import { usePlatformSubscription } from "../contexts/PlatformSubscriptionContext";
import {
  ANNUAL_DISCOUNT,
  PLANS,
  PLATFORM_PLAN_ORDER,
  annualEffectiveMonthlyWon,
  annualTotalWon,
  getPlanById,
} from "../lib/platformPlans";
import { TOKEN_KRW_REF, formatApproxWonPerTurn } from "../lib/tokenPricing";

export default function PlatformPricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { planId: currentPlanId, setPlanMock, billing } = usePlatformSubscription();
  const [period, setPeriod] = useState("monthly");
  const [toast, setToast] = useState("");

  useEffect(() => {
    setPeriod(billing === "annual" ? "annual" : "monthly");
  }, [billing]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  };

  const handleCta = (planKey) => {
    if (planKey === "free") {
      if (user) {
        setPlanMock("free", period === "annual" ? "annual" : "monthly");
        showToast("Free 플랜으로 설정했습니다 (Mock).");
      } else {
        navigate("/signup");
      }
      return;
    }
    if (!user) {
      navigate("/login?from=/pricing");
      return;
    }
    setPlanMock(planKey, period === "annual" ? "annual" : "monthly");
    showToast(`${getPlanById(planKey)?.name} 플랜으로 저장했습니다 (Mock 결제, Phase 3에서 실결제·platform_subscriptions 연동).`);
  };

  const exampleTurnTokens = 3;

  return (
    <div
      style={{
        minHeight: "100%",
        paddingLeft: "max(var(--page-pad-x), var(--safe-left))",
        paddingRight: "max(var(--page-pad-x), var(--safe-right))",
        paddingTop: 24,
        paddingBottom: "calc(40px + var(--safe-bottom))",
        background: "var(--bg)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p
          style={{
            fontSize: "var(--fs-xs)",
            color: "var(--cy)",
            fontFamily: "var(--mo)",
            letterSpacing: "0.1em",
            marginBottom: 8,
          }}
        >
          PRICING
        </p>
        <h1 style={{ fontSize: "var(--fs-h1)", fontWeight: 800, fontFamily: "var(--fn-title)", marginBottom: 10 }}>
          플랫폼 요금제
        </h1>
        <p style={{ color: "var(--tx2)", fontSize: "var(--fs-body)", maxWidth: 620, lineHeight: 1.65, marginBottom: 12 }}>
          clone.me는 <strong style={{ color: "var(--tx)" }}>플랫폼 구독</strong>(Free / Basic / Pro / Ultimate)으로 이용합니다. 보유 토큰으로 모든 마스터 클론과 대화할 수 있으며,{" "}
          <strong style={{ color: "var(--cy)" }}>클론마다 1턴당 토큰</strong>은 마스터가 설정합니다.
        </p>
        <p style={{ color: "var(--tx3)", fontSize: "var(--fs-caption)", maxWidth: 620, lineHeight: 1.6, marginBottom: 28, fontFamily: "var(--fn)" }}>
          참고: <strong style={{ color: "var(--cy)" }}>1토큰 = ₩{TOKEN_KRW_REF.toLocaleString("ko-KR")}</strong> 기준 · 예: {exampleTurnTokens}토큰/턴 ≈{" "}
          {formatApproxWonPerTurn(exampleTurnTokens)} (UI 안내용, 실결제와 무관)
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 32,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "var(--fs-caption)", color: "var(--tx3)" }}>결제 주기</span>
          <div
            role="group"
            aria-label="월간 또는 연간"
            style={{
              display: "inline-flex",
              padding: 3,
              borderRadius: 999,
              border: "1px solid var(--br2)",
              background: "var(--sf2)",
            }}
          >
            <button
              type="button"
              onClick={() => setPeriod("monthly")}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                border: "none",
                background: period === "monthly" ? "var(--cyd)" : "transparent",
                color: period === "monthly" ? "var(--cy)" : "var(--tx2)",
                fontSize: "var(--fs-caption)",
                fontWeight: 700,
                fontFamily: "var(--fn)",
                cursor: "pointer",
              }}
            >
              월간
            </button>
            <button
              type="button"
              onClick={() => setPeriod("annual")}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                border: "none",
                background: period === "annual" ? "var(--cyd)" : "transparent",
                color: period === "annual" ? "var(--cy)" : "var(--tx2)",
                fontSize: "var(--fs-caption)",
                fontWeight: 700,
                fontFamily: "var(--fn)",
                cursor: "pointer",
              }}
            >
              연간 <span style={{ color: "var(--go)", marginLeft: 4 }}>−{ANNUAL_DISCOUNT * 100}%</span>
            </button>
          </div>
        </div>

        {toast ? (
          <div
            role="status"
            style={{
              marginBottom: 20,
              padding: "12px 16px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--br2)",
              background: "var(--cyd)",
              color: "var(--cy)",
              fontSize: "var(--fs-caption)",
              fontFamily: "var(--fn)",
            }}
          >
            {toast}
          </div>
        ) : null}

        <p style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", marginBottom: 16, lineHeight: 1.5 }}>
          실제 결제·자동 갱신·<code style={{ fontSize: 11 }}>platform_subscriptions</code> DB 연동은 Phase 3(토스페이먼츠) 예정입니다. 지금은 UI·Mock(localStorage)만 동작합니다.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            alignItems: "stretch",
          }}
        >
          {PLATFORM_PLAN_ORDER.map((key) => {
            const p = PLANS[key];
            const isCurrent = user && currentPlanId === key;
            const monthly = p.monthlyPriceWon;
            const effMonthly = period === "annual" && monthly > 0 ? annualEffectiveMonthlyWon(monthly) : monthly;
            const annualTotal = period === "annual" && monthly > 0 ? annualTotalWon(monthly) : null;

            return (
              <div
                key={key}
                style={{
                  position: "relative",
                  borderRadius: "var(--r-xl)",
                  border: p.highlight ? "2px solid var(--cy)" : "1px solid var(--br2)",
                  background: p.highlight ? "linear-gradient(180deg, var(--cyg) 0%, var(--sf2) 100%)" : "var(--sf2)",
                  padding: "22px 20px",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 420,
                  boxShadow: p.highlight ? "0 12px 40px var(--cyg)" : "none",
                }}
              >
                {p.highlight ? (
                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      fontFamily: "var(--mo)",
                      color: "var(--cy)",
                      background: "var(--cyd)",
                      padding: "4px 8px",
                      borderRadius: 6,
                    }}
                  >
                    RECOMMENDED
                  </span>
                ) : null}
                <div style={{ fontSize: "var(--fs-h3)", fontWeight: 800, fontFamily: "var(--fn-title)", color: "var(--tx)", marginBottom: 6 }}>{p.name}</div>
                <div style={{ fontFamily: "var(--mo)", fontWeight: 800, color: "var(--cy)", marginBottom: 16, minHeight: 52 }}>
                  {monthly === 0 ? (
                    "₩0"
                  ) : period === "annual" ? (
                    <>
                      <span style={{ fontSize: "var(--fs-h3)", color: "var(--tx)" }}>₩{effMonthly.toLocaleString("ko-KR")}</span>
                      <span style={{ fontSize: "var(--fs-caption)", color: "var(--tx2)", fontWeight: 600 }}> /월·연간</span>
                      <div style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontWeight: 600, marginTop: 4 }}>
                        연 ₩{annualTotal?.toLocaleString("ko-KR")} (20% 할인)
                      </div>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: "var(--fs-h3)", color: "var(--tx)" }}>₩{monthly.toLocaleString("ko-KR")}</span>
                      <span style={{ fontSize: "var(--fs-caption)", color: "var(--tx2)", fontWeight: 600 }}> /월</span>
                    </>
                  )}
                </div>
                {p.monthlyTokens > 0 ? (
                  <div style={{ fontSize: "var(--fs-caption)", color: "var(--tx2)", marginBottom: 14, fontFamily: "var(--fn)" }}>
                    매월 <strong style={{ color: "var(--tx)" }}>{p.monthlyTokens}토큰</strong> 자동 지급 (Phase 3)
                  </div>
                ) : (
                  <div style={{ fontSize: "var(--fs-caption)", color: "var(--tx2)", marginBottom: 14, fontFamily: "var(--fn)" }}>
                    토큰 충전으로 전 클론 이용
                  </div>
                )}
                <ul style={{ listStyle: "none", margin: 0, padding: 0, flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                  {p.perks.map((line) => (
                    <li key={line} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "var(--fs-caption)", color: "var(--tx2)", lineHeight: 1.5 }}>
                      <CheckIcon style={{ width: 18, height: 18, flexShrink: 0, color: "var(--go)", marginTop: 2 }} aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: 20 }}>
                  {isCurrent ? (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "var(--r-md)",
                        border: "1px solid var(--br2)",
                        background: "var(--sf3)",
                        color: "var(--tx2)",
                        fontSize: "var(--fs-caption)",
                        fontWeight: 700,
                        fontFamily: "var(--fn)",
                        textAlign: "center",
                      }}
                    >
                      현재 플랜
                    </div>
                  ) : key === "free" ? (
                    <Bt v="gh" on={() => handleCta(key)} style={{ width: "100%", justifyContent: "center" }}>
                      시작하기
                    </Bt>
                  ) : (
                    <Bt v="pr" on={() => handleCta(key)} style={{ width: "100%", justifyContent: "center" }}>
                      구독하기 (Mock)
                    </Bt>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
