import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownTrayIcon,
  CheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import Bt from "../common/Bt";
import Cd from "../common/Cd";
import TokenRingGauge from "../common/TokenRingGauge";
import { useAuth } from "../contexts/AuthContext";
import { usePlatformSubscription } from "../contexts/PlatformSubscriptionContext";
import { useWindowSize } from "../hooks/useWindowSize";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchTokenSummary, fetchTokenTransactions, getLocalTokenMock } from "../lib/supabaseQueries";
import { PLATFORM_PLAN_ORDER, PLANS } from "../lib/platformPlans";

/** 데모·빈 DB 시 표시용 Mock 이용 행 */
const MOCK_USAGE_ROWS = [
  {
    id: "demo-1",
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    masterName: "김테크 AI",
    convType: "텍스트 대화",
    tokens: 3,
  },
  {
    id: "demo-2",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    masterName: "마케팅 클론",
    convType: "긴 맥락 대화",
    tokens: 5,
  },
  {
    id: "demo-3",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    masterName: "영어 코치",
    convType: "텍스트 대화",
    tokens: 2,
  },
];

const UPGRADE_CARD_COPY = {
  free: {
    priceLabel: "무료",
    bullets: ["5토큰", "무료 체험 5회"],
  },
  basic: {
    priceLabel: "₩9,900/월",
    bullets: ["매월 50토큰", "대화 기록 저장"],
  },
  pro: {
    priceLabel: "₩29,000/월",
    recommended: true,
    bullets: ["매월 150토큰", "대화 기록 저장", "클론 즐겨찾기", "신규 마스터 알림"],
  },
  ultimate: {
    priceLabel: "₩59,000/월",
    bullets: ["매월 400토큰", "위 전부 포함", "대화 PDF보내기", "베타 기능 우선 접근"],
  },
};

function nextBillingMock(isPaid) {
  if (!isPaid) return "— (Free)";
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function estResetMock() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

function fmtTableWhen(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function consumptionModel(planMonthly, balance) {
  const allocated = planMonthly > 0 ? planMonthly : 5;
  const cappedBal = Math.min(Math.max(0, balance), allocated);
  const used = Math.max(0, allocated - cappedBal);
  const percentUsed = allocated > 0 ? Math.min(100, Math.round((used / allocated) * 100)) : 0;
  let tone = "cyan";
  if (balance <= 0) tone = "red";
  else if (balance < allocated * 0.2) tone = "amber";
  return { allocated, used, percentUsed, tone };
}

/** @param {Array<{ id: unknown, amount?: number, type?: string, description?: string, created_at: string }>} dbRows */
function mapUsageRowsFromTxs(dbRows) {
  return (dbRows || [])
    .filter((r) => r.type === "usage")
    .map((r) => {
      const amt = Math.abs(Number(r.amount) || 0);
      const desc = (r.description || "").trim();
      const masterName = desc ? desc.split(/[·|]/)[0].trim().slice(0, 40) || "클론 대화" : "클론 대화";
      return {
        id: String(r.id),
        created_at: r.created_at,
        masterName,
        convType: "텍스트 대화",
        tokens: amt,
        source: "db",
      };
    });
}

export default function MyAccountSubscription() {
  const { isMobile } = useWindowSize();
  const { user, supabaseConfigured } = useAuth();
  const { plan, planId, isPaid, setPlanMock } = usePlatformSubscription();

  const [tab, setTab] = useState("current");
  const [tokenTotal, setTokenTotal] = useState(0);
  const [usageRows, setUsageRows] = useState([]);
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageExpanded, setUsageExpanded] = useState(false);

  const loadTok = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) {
      setTokenTotal(0);
      return;
    }
    const tok = await fetchTokenSummary(supabase, user.id);
    setTokenTotal(tok.total ?? 0);
  }, [user?.id]);

  const loadUsage = useCallback(async () => {
    if (!user?.id) {
      setUsageRows([]);
      setUsageLoading(false);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    const local = getLocalTokenMock(user.id);
    const localUsage = (local.txs || [])
      .filter((t) => t.type === "usage")
      .map((t) => ({
        id: `local-${t.id}`,
        created_at: t.created_at,
        masterName: (t.description || "Mock 사용").split(/[·|]/)[0].slice(0, 40),
        convType: "텍스트 대화",
        tokens: Math.abs(Number(t.amount) || 0),
        source: "local",
      }));

    if (!supabase || !supabaseConfigured) {
      const merged = [...mapUsageRowsFromTxs([]), ...localUsage].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setUsageRows(merged.length ? merged : MOCK_USAGE_ROWS);
      setUsageLoading(false);
      return;
    }

    setUsageLoading(true);
    const { rows: dbRows } = await fetchTokenTransactions(supabase, user.id, 80);
    const fromDb = mapUsageRowsFromTxs(dbRows || []);
    const merged = [...fromDb, ...localUsage].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setUsageRows(merged.length ? merged : MOCK_USAGE_ROWS);
    setUsageLoading(false);
  }, [user?.id, supabaseConfigured]);

  useEffect(() => {
    loadTok();
  }, [loadTok]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const monthly = plan?.monthlyTokens ?? 0;
  const { allocated, used, percentUsed, tone } = useMemo(
    () => consumptionModel(monthly, tokenTotal),
    [monthly, tokenTotal]
  );

  const previewLimit = 5;
  const visibleUsage = usageExpanded ? usageRows : usageRows.slice(0, previewLimit);

  const onExportCsvMock = () => {
    const header = "datetime,master,conversation_type,tokens\n";
    const body = usageRows
      .map((r) => `"${r.created_at}","${String(r.masterName).replace(/"/g, '""')}","${r.convType}",${r.tokens}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usage-history-mock-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabBtn = (id, label) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      style={{
        padding: "10px 20px",
        borderRadius: "var(--r-md)",
        border: tab === id ? "1px solid var(--cy)" : "1px solid var(--br)",
        background: tab === id ? "var(--cyd)" : "transparent",
        color: tab === id ? "var(--cy)" : "var(--tx2)",
        fontFamily: "var(--mo)",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.1em",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  const sectionLabel = {
    fontSize: 10,
    fontFamily: "var(--mo)",
    letterSpacing: "0.14em",
    color: "var(--tx3)",
    fontWeight: 700,
    marginBottom: 10,
  };

  const cardGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: isMobile ? 16 : 20,
    marginBottom: 28,
  };

  if (!supabaseConfigured) {
    return (
      <Cd style={{ padding: "clamp(24px,5vw,36px)", borderStyle: "dashed" }}>
        <p style={{ color: "var(--tx2)", fontFamily: "var(--fn)" }}>Supabase 설정 후 이용할 수 있습니다.</p>
      </Cd>
    );
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 22, alignItems: "center" }}>
        {tabBtn("current", "Current")}
        {tabBtn("upgrade", "Upgrade")}
      </div>

      {tab === "current" ? (
        <>
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 8 }}>SUBSCRIPTION</p>
          <h1 style={{ fontSize: "var(--fs-h2)", fontWeight: 800, margin: "0 0 8px", fontFamily: "var(--fn-title)", color: "var(--tx)" }}>Subscription &amp; Usage</h1>
          <p style={{ color: "var(--tx2)", fontSize: "var(--fs-caption)", marginBottom: 24, lineHeight: 1.65, fontFamily: "var(--fn)" }}>
            플랜 현황과 토큰 사용량을 확인하세요.
          </p>

          <div style={cardGrid}>
            <Cd style={{ padding: "clamp(18px,3vw,24px)", borderColor: "var(--br2)", display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={sectionLabel}>ACCOUNT STATUS</div>
              <div style={{ fontSize: "var(--fs-h3)", fontWeight: 800, color: "var(--tx)", fontFamily: "var(--fn-title)", marginBottom: 6 }}>{plan?.name || "Free"}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--mo)", marginBottom: 16 }}>
                다음 결제일 (Mock) · {nextBillingMock(isPaid)}
              </div>
              <ul style={{ margin: "0 0 20px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {(plan?.perks || []).map((line) => (
                  <li key={line} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "var(--fs-caption)", color: "var(--tx2)", lineHeight: 1.5, fontFamily: "var(--fn)" }}>
                    <CheckIcon style={{ width: 18, height: 18, flexShrink: 0, color: "var(--cy)", marginTop: 2 }} aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <Bt
                v="gh"
                style={{ width: "100%", justifyContent: "center", minHeight: "var(--touch-min)", borderColor: "var(--br2)" }}
                on={() => alert("Manage Billing은 Phase 3 결제 연동 후 제공됩니다. (Mock)")}
              >
                Manage Billing
              </Bt>
            </Cd>

            <Cd style={{ padding: "clamp(18px,3vw,24px)", borderColor: "var(--br2)" }}>
              <div style={sectionLabel}>TOKEN CONSUMPTION</div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", marginBottom: 18 }}>
                <TokenRingGauge percent={percentUsed} tone={tone} size="lg" />
                <div>
                  <div style={{ fontSize: "var(--fs-h3)", fontWeight: 800, fontFamily: "var(--mo)", color: "var(--tx)" }}>
                    {used.toLocaleString()} / {allocated.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, fontFamily: "var(--mo)", color: "var(--tx3)", letterSpacing: "0.08em", marginTop: 4 }}>USED / ALLOCATED (이번 주기)</div>
                  <div style={{ fontSize: "var(--fs-caption)", color: "var(--tx2)", fontFamily: "var(--fn)", marginTop: 10 }}>
                    잔여 잔액: <strong style={{ color: "var(--tx)" }}>{tokenTotal.toLocaleString()} T</strong>
                  </div>
                </div>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: "var(--sf3)", overflow: "hidden", marginBottom: 14 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${percentUsed}%`,
                    borderRadius: 999,
                    background: tone === "red" ? "var(--market-gauge-red)" : tone === "amber" ? "var(--market-gauge-amber)" : "var(--market-gauge-cyan)",
                    transition: "width 0.35s ease",
                  }}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  fontSize: 10,
                  fontFamily: "var(--mo)",
                  color: "var(--tx3)",
                  letterSpacing: "0.06em",
                }}
              >
                <div>
                  <div style={{ color: "var(--tx2)", marginBottom: 4 }}>USED</div>
                  <div style={{ color: "var(--tx)", fontWeight: 800 }}>{used}</div>
                </div>
                <div>
                  <div style={{ color: "var(--tx2)", marginBottom: 4 }}>ALLOCATED</div>
                  <div style={{ color: "var(--tx)", fontWeight: 800 }}>{allocated}</div>
                </div>
                <div>
                  <div style={{ color: "var(--tx2)", marginBottom: 4 }}>EST. RESET</div>
                  <div style={{ color: "var(--tx)", fontWeight: 800 }}>{estResetMock()}</div>
                </div>
              </div>
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", marginTop: 16, fontFamily: "var(--fn)", lineHeight: 1.55 }}>
                표시는 Mock·추정치입니다. 실제 월간 리셋·결제는 Phase 3 <code style={{ fontSize: 10, fontFamily: "var(--mo)" }}>platform_subscriptions</code> 연동 예정입니다.
              </p>
              <p style={{ fontSize: "var(--fs-xs)", marginTop: 10, fontFamily: "var(--fn)" }}>
                <Link to="/pricing" style={{ color: "var(--cy)", fontWeight: 700 }}>
                  공개 요금제 페이지
                </Link>
                에서 충전·플랜 비교(Mock)를 볼 수 있습니다.
              </p>
            </Cd>
          </div>

          <section>
            <h2 style={{ fontSize: "var(--fs-body)", fontWeight: 800, marginBottom: 12, fontFamily: "var(--fn)", color: "var(--tx)" }}>Usage History</h2>
            <Cd style={{ padding: 0, borderColor: "var(--br)", overflow: "hidden" }}>
              {usageLoading ? (
                <p style={{ padding: 20, color: "var(--tx3)", fontFamily: "var(--mo)" }}>불러오는 중…</p>
              ) : visibleUsage.length === 0 ? (
                <p style={{ padding: 24, color: "var(--tx2)", fontFamily: "var(--fn)" }}>이용 내역이 없습니다.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--fn)", fontSize: "var(--fs-caption)" }}>
                    <thead>
                      <tr style={{ background: "var(--sf2)", borderBottom: "1px solid var(--br)" }}>
                        {["날짜 & 시간", "마스터명", "대화 유형", "토큰 소비"].map((h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: h === "토큰 소비" ? "right" : "left",
                              padding: "12px 14px",
                              color: "var(--tx3)",
                              fontFamily: "var(--mo)",
                              fontSize: 10,
                              letterSpacing: "0.08em",
                              fontWeight: 800,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleUsage.map((r) => (
                        <tr key={r.id} style={{ borderBottom: "1px solid var(--br)" }}>
                          <td style={{ padding: "12px 14px", color: "var(--tx2)", fontFamily: "var(--mo)", whiteSpace: "nowrap" }}>{fmtTableWhen(r.created_at)}</td>
                          <td style={{ padding: "12px 14px", color: "var(--tx)", maxWidth: 200 }}>{r.masterName}</td>
                          <td style={{ padding: "12px 14px", color: "var(--tx2)" }}>{r.convType}</td>
                          <td style={{ padding: "12px 14px", textAlign: "right", fontFamily: "var(--mo)", fontWeight: 700, color: "var(--am)" }}>{r.tokens} T</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: 16, borderTop: "1px solid var(--br)", background: "var(--sf2)" }}>
                {usageRows.length > previewLimit ? (
                  <Bt v="gh" on={() => setUsageExpanded((v) => !v)} style={{ minHeight: "var(--touch-min)" }}>
                    {usageExpanded ? "접기" : "VIEW MORE"}
                  </Bt>
                ) : null}
                <Bt
                  v="sf"
                  on={onExportCsvMock}
                  style={{ minHeight: "var(--touch-min)", display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                  <ArrowDownTrayIcon style={{ width: 18, height: 18 }} aria-hidden />
                  Export CSV (Mock)
                </Bt>
              </div>
            </Cd>
          </section>
        </>
      ) : (
        <>
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 8 }}>UPGRADE</p>
          <h1 style={{ fontSize: "var(--fs-h2)", fontWeight: 800, margin: "0 0 24px", fontFamily: "var(--fn-title)", color: "var(--tx)" }}>요금제 업그레이드</h1>
          <p style={{ color: "var(--tx2)", fontSize: "var(--fs-caption)", marginBottom: 24, fontFamily: "var(--fn)" }}>
            결제·청구는 Phase 3 예정입니다. 아래는 플랜 미리보기(Mock)입니다.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
              gap: 16,
            }}
          >
            {PLATFORM_PLAN_ORDER.map((pid) => {
              const p = PLANS[pid];
              const copy = UPGRADE_CARD_COPY[pid];
              const current = planId === pid;
              return (
                <Cd
                  key={pid}
                  style={{
                    padding: "clamp(20px,3vw,26px)",
                    borderColor: copy.recommended ? "var(--cy)" : "var(--br2)",
                    borderWidth: copy.recommended ? 2 : 1,
                    position: "relative",
                    background: copy.recommended ? "linear-gradient(180deg, var(--cyg) 0%, var(--sf) 55%)" : "var(--sf)",
                  }}
                >
                  {copy.recommended ? (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 10,
                        fontFamily: "var(--mo)",
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        color: "var(--cy)",
                      }}
                    >
                      <SparklesIcon style={{ width: 14, height: 14 }} aria-hidden />
                      RECOMMENDED
                    </div>
                  ) : null}
                  <div style={{ fontSize: "var(--fs-h3)", fontWeight: 800, fontFamily: "var(--fn-title)", color: "var(--tx)", marginBottom: 6 }}>{p.name}</div>
                  <div style={{ fontSize: "var(--fs-body)", fontWeight: 700, fontFamily: "var(--mo)", color: "var(--cy)", marginBottom: 16 }}>{copy.priceLabel}</div>
                  <ul style={{ margin: "0 0 22px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                    {copy.bullets.map((line) => (
                      <li key={line} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "var(--fs-caption)", color: "var(--tx2)", fontFamily: "var(--fn)", lineHeight: 1.5 }}>
                        <CheckIcon style={{ width: 18, height: 18, flexShrink: 0, color: "var(--go)", marginTop: 2 }} aria-hidden />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  {current ? (
                    <Bt v="gh" dis={true} style={{ width: "100%", justifyContent: "center", minHeight: "var(--touch-min)" }}>
                      현재 플랜
                    </Bt>
                  ) : (
                    <Bt
                      v="pr"
                      style={{ width: "100%", justifyContent: "center", minHeight: "var(--touch-min)" }}
                      on={() => {
                        setPlanMock(pid, "monthly");
                        alert(`플랜을 ${p.name}(Mock)으로 저장했습니다. 실제 결제는 Phase 3입니다.`);
                        setTab("current");
                        loadTok();
                      }}
                    >
                      업그레이드
                    </Bt>
                  )}
                </Cd>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
