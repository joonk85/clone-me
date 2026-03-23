import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BeakerIcon,
  BellIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

import Av from "../../common/Av";
import Bt from "../../common/Bt";
import Cd from "../../common/Cd";
import TokenRingGauge from "../../common/TokenRingGauge";
import { EmptyState } from "../../common/UiStates";
import { useAuth } from "../../contexts/AuthContext";
import { useAppState } from "../../contexts/AppStateContext";
import { usePlatformSubscription } from "../../contexts/PlatformSubscriptionContext";
import { useWindowSize } from "../../hooks/useWindowSize";
import { getSupabaseBrowserClient } from "../../lib/supabase";
import {
  fetchClonesForMaster,
  fetchMasterClonesListAnalytics,
  fetchMasterForUser,
  fetchMyUserRow,
  fetchTokenSummary,
  mapDbCloneToMyCloneShape,
} from "../../lib/supabaseQueries";

const PAGE_SIZE = 6;
const IDLE_DAYS = 7;
const MS_DAY = 86400000;

function isImageAv(v) {
  return typeof v === "string" && /^https?:\/\//i.test(v.trim());
}

/** @param {{ is_active: boolean, updated_at: string }} row @param {number} lastActivityMs */
function cloneStatus(row, lastActivityMs) {
  if (!row.is_active) return { key: "inactive", label: "Inactive", labelKo: "비활성" };
  const updated = new Date(row.updated_at).getTime();
  const last = Math.max(lastActivityMs || 0, updated);
  if (!last || Date.now() - last > IDLE_DAYS * MS_DAY) return { key: "idle", label: "Idle", labelKo: "대기" };
  return { key: "operating", label: "Operating", labelKo: "활성" };
}

function statusBadgeStyle(key) {
  if (key === "operating") {
    return { border: "1px solid var(--cy)", color: "var(--cy)", background: "var(--cyd)" };
  }
  if (key === "idle") {
    return { border: "1px solid var(--am)", color: "var(--am)", background: "var(--am-surface)" };
  }
  return { border: "1px solid var(--br2)", color: "var(--tx3)", background: "var(--sf3)" };
}

function fmtWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function tokenGaugeFromBalance(total, planMonthly) {
  const denom = planMonthly > 0 ? planMonthly : Math.max(50, total || 50);
  const percent = Math.min(100, Math.round((total / denom) * 100));
  let tone = "cyan";
  if (total <= 0) tone = "red";
  else if (total < 15) tone = "amber";
  return { percent, tone };
}

const iconBtn = {
  width: 40,
  height: 40,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--r-md)",
  border: "1px solid var(--br2)",
  background: "var(--sf2)",
  color: "var(--tx2)",
  cursor: "pointer",
};

export default function MasterClonesList() {
  const { user, supabaseConfigured } = useAuth();
  const { isMobile } = useWindowSize();
  const navigate = useNavigate();
  const { setMyClones, setActiveMyClone } = useAppState();
  const { plan } = usePlatformSubscription();

  const [rows, setRows] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [monthTotal, setMonthTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [masterId, setMasterId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [userRow, setUserRow] = useState(null);
  const [tokenTotal, setTokenTotal] = useState(0);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { row: m } = await fetchMasterForUser(supabase);
    if (!m) {
      setMasterId(null);
      setRows([]);
      setAnalytics({});
      setMonthTotal(0);
      setLoading(false);
      return;
    }
    setMasterId(m.id);
    const { rows: list, error } = await fetchClonesForMaster(supabase, m.id);
    if (error) {
      setRows([]);
      setAnalytics({});
      setMonthTotal(0);
      setLoading(false);
      return;
    }
    const ids = (list || []).map((r) => r.id);
    const { byClone, monthMessageTotal } = await fetchMasterClonesListAnalytics(supabase, ids);
    setRows(list || []);
    setAnalytics(byClone || {});
    setMonthTotal(monthMessageTotal || 0);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) return;
    (async () => {
      const { row } = await fetchMyUserRow(supabase);
      setUserRow(row);
      const tok = await fetchTokenSummary(supabase, user.id);
      setTokenTotal(tok.total ?? 0);
    })();
  }, [user?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const idm = String(r.id).toLowerCase();
      return (r.name || "").toLowerCase().includes(q) || idm.includes(q);
    });
  }, [rows, search]);

  useEffect(() => {
    setPage(0);
  }, [search, rows.length]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const slice = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const showingFrom = filtered.length ? safePage * PAGE_SIZE + 1 : 0;
  const showingTo = filtered.length ? Math.min(filtered.length, (safePage + 1) * PAGE_SIZE) : 0;

  const activeCount = useMemo(() => rows.filter((r) => r.is_active).length, [rows]);

  const avgQuality = useMemo(() => {
    const qs = rows.map((r) => Number(r.quality_score) || 0).filter((n) => n > 0);
    if (!qs.length) return null;
    return Math.round((qs.reduce((a, b) => a + b, 0) / qs.length) * 10) / 10;
  }, [rows]);

  const monthGoal = useMemo(() => Math.max(200, monthTotal, Math.ceil(rows.length * 40)), [monthTotal, rows.length]);
  const monthBarPct = Math.min(100, Math.round((monthTotal / monthGoal) * 100));

  const { percent: tokPct, tone: tokTone } = tokenGaugeFromBalance(tokenTotal, plan?.monthlyTokens ?? 0);

  const openDashboard = (row) => {
    const shaped = mapDbCloneToMyCloneShape(row, analytics);
    setMyClones((prev) => {
      const ix = prev.findIndex((x) => x.id === shaped.id);
      if (ix >= 0) {
        const next = [...prev];
        next[ix] = { ...next[ix], ...shaped };
        return next;
      }
      return [...prev, shaped];
    });
    setActiveMyClone(shaped);
    navigate(`/dashboard/${row.id}`);
  };

  const displayName = userRow?.nickname || user?.email?.split("@")[0] || "마스터";
  const userAv = userRow?.avatar_url;

  if (!supabaseConfigured) {
    return <p style={{ color: "var(--tx2)", fontFamily: "var(--fn)" }}>Supabase 설정 후 이용할 수 있습니다.</p>;
  }
  if (loading) {
    return <p style={{ color: "var(--tx3)", fontFamily: "var(--mo)" }}>불러오는 중…</p>;
  }
  if (!masterId) {
    return (
      <div>
        <p style={{ color: "var(--tx2)", marginBottom: 16, fontFamily: "var(--fn)" }}>마스터 프로필이 필요합니다.</p>
        <Bt v="pr" on={() => navigate("/my/master/profile")}>
          프로필 등록
        </Bt>
      </div>
    );
  }

  const capMo = {
    fontSize: 10,
    fontFamily: "var(--mo)",
    letterSpacing: "0.12em",
    color: "var(--tx3)",
    fontWeight: 700,
  };

  return (
    <div style={{ width: "100%" }}>
      {/* 상단: 검색 + 토큰/알림/계정 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          padding: "12px 14px",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--br)",
          background: "var(--sf2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 200, maxWidth: 420 }}>
          <MagnifyingGlassIcon style={{ width: 20, height: 20, color: "var(--tx3)", flexShrink: 0 }} aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="클론 이름 또는 ID 검색"
            aria-label="클론 검색"
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              background: "transparent",
              color: "var(--tx)",
              fontSize: isMobile ? "var(--fs-input-mobile)" : "var(--fs-body)",
              fontFamily: "var(--fn)",
              outline: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
          <button
            type="button"
            onClick={() => navigate("/my/subscription")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--br2)",
              background: "var(--sf)",
              cursor: "pointer",
            }}
            aria-label="토큰 잔액"
          >
            <TokenRingGauge percent={tokPct} tone={tokTone} size="md" />
            <span style={{ fontSize: 11, fontFamily: "var(--mo)", fontWeight: 700, color: "var(--tx)" }}>{tokenTotal}T</span>
          </button>
          <Link
            to="/my/notifications"
            style={{
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--br2)",
              color: "var(--tx2)",
            }}
            aria-label="알림"
          >
            <BellIcon style={{ width: 22, height: 22 }} />
          </Link>
          <Link
            to="/my/general"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--br2)",
              textDecoration: "none",
              color: "var(--tx)",
            }}
          >
            {typeof userAv === "string" && /^https?:\/\//i.test(userAv) ? (
              <img src={userAv.trim()} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <UserCircleIcon style={{ width: 32, height: 32, color: "var(--tx2)" }} />
            )}
            {!isMobile && <span style={{ fontSize: "var(--fs-caption)", fontWeight: 600, fontFamily: "var(--fn)", maxWidth: 120 }}>{displayName}</span>}
          </Link>
        </div>
      </div>

      {/* 타이틀 + 통계 카드 */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
        <div>
          <p style={{ ...capMo, marginBottom: 8 }}>CLONES</p>
          <h1 style={{ fontSize: "var(--fs-h2)", fontWeight: 800, margin: "0 0 8px", fontFamily: "var(--fn-title)", color: "var(--tx)" }}>내 클론</h1>
          <p style={{ color: "var(--tx2)", fontSize: "var(--fs-caption)", margin: 0, fontFamily: "var(--fn)", lineHeight: 1.6 }}>클론의 성과와 상태를 관리하세요</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Cd style={{ padding: "14px 18px", borderColor: "var(--br2)", minWidth: 160, background: "var(--sf)" }}>
            <div style={{ ...capMo, marginBottom: 6 }}>TOTAL ACTIVE</div>
            <div style={{ fontSize: "var(--fs-h3)", fontWeight: 800, fontFamily: "var(--mo)", color: "var(--cy)" }}>{activeCount}</div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--fn)", marginTop: 4 }}>활성 클론 수</div>
          </Cd>
          <Cd style={{ padding: "14px 18px", borderColor: "var(--br2)", minWidth: 160, background: "var(--sf)" }}>
            <div style={{ ...capMo, marginBottom: 6 }}>이번 달 대화</div>
            <div style={{ fontSize: "var(--fs-h3)", fontWeight: 800, fontFamily: "var(--mo)", color: "var(--tx)" }}>{monthTotal.toLocaleString()}</div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--fn)", marginTop: 4 }}>메시지 수(추정)</div>
          </Cd>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="아직 클론이 없습니다" hint="첫 클론을 만들고 마켓에 연결해 보세요.">
          <Bt v="pr" on={() => navigate("/dashboard/create")} style={{ marginTop: 8, minHeight: "var(--touch-min)" }}>
            + 첫 클론 만들기
          </Bt>
        </EmptyState>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {slice.map((r) => {
            const a = analytics[r.id] || { monthMessages: 0, uniqueUsers: 0, lastActivity: 0 };
            const st = cloneStatus(r, a.lastActivity);
            const lastIso = a.lastActivity ? new Date(a.lastActivity).toISOString() : r.updated_at;
            return (
              <Cd key={r.id} style={{ padding: 16, borderColor: "var(--br2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "var(--sf3)" }}>
                    {isImageAv(r.av) ? (
                      <img src={r.av.trim()} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Av char={(r.name || "?").charAt(0)} color={r.color || "#63d9ff"} size={44} />
                      </div>
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, fontFamily: "var(--fn)", color: "var(--tx)" }}>{r.name}</div>
                    <div style={{ fontSize: 10, fontFamily: "var(--mo)", color: "var(--tx3)", marginTop: 4, wordBreak: "break-all" }}>{r.id}</div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "var(--mo)",
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      padding: "4px 8px",
                      borderRadius: 6,
                      ...statusBadgeStyle(st.key),
                    }}
                  >
                    {st.label}
                  </span>
                </div>
                <div style={{ fontSize: "var(--fs-caption)", color: "var(--tx2)", fontFamily: "var(--fn)", display: "grid", gap: 6 }}>
                  <div>이번 달 대화: {a.monthMessages}</div>
                  <div>총 유저: {a.uniqueUsers}</div>
                  <div>업데이트: {fmtWhen(lastIso)}</div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <Bt v="gh" type="button" on={() => openDashboard(r)} style={{ flex: 1, minHeight: 44, justifyContent: "center" }}>
                    <Squares2X2Icon style={{ width: 18, height: 18 }} />
                  </Bt>
                  <Bt v="gh" type="button" on={() => openDashboard(r)} style={{ flex: 1, minHeight: 44, justifyContent: "center" }}>
                    <Cog6ToothIcon style={{ width: 18, height: 18 }} />
                  </Bt>
                  <Bt v="gh" type="button" on={() => openDashboard(r)} style={{ flex: 1, minHeight: 44, justifyContent: "center" }}>
                    <BeakerIcon style={{ width: 18, height: 18 }} />
                  </Bt>
                </div>
              </Cd>
            );
          })}
        </div>
      ) : (
        <Cd style={{ padding: 0, borderColor: "var(--br)", overflow: "hidden", marginBottom: 20 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--fn)", fontSize: "var(--fs-caption)" }}>
              <thead>
                <tr style={{ background: "var(--sf2)", borderBottom: "1px solid var(--br)" }}>
                  {["CLONE NAME", "STATUS", "이번 달 대화", "총 유저 수", "마지막 업데이트", "ACTIONS"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: h === "ACTIONS" ? "right" : "left",
                        padding: "12px 14px",
                        ...capMo,
                        fontWeight: 800,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.map((r) => {
                  const a = analytics[r.id] || { monthMessages: 0, uniqueUsers: 0, lastActivity: 0 };
                  const st = cloneStatus(r, a.lastActivity);
                  const lastIso = a.lastActivity ? new Date(a.lastActivity).toISOString() : r.updated_at;
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--br)" }}>
                      <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "var(--sf3)" }}>
                            {isImageAv(r.av) ? (
                              <img src={r.av.trim()} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Av char={(r.name || "?").charAt(0)} color={r.color || "#63d9ff"} size={40} />
                              </div>
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: "var(--tx)" }}>{r.name}</div>
                            <div style={{ fontSize: 10, fontFamily: "var(--mo)", color: "var(--tx3)", marginTop: 4, wordBreak: "break-all" }}>{r.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: 10,
                            fontFamily: "var(--mo)",
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            padding: "4px 10px",
                            borderRadius: 6,
                            ...statusBadgeStyle(st.key),
                          }}
                        >
                          {st.label}
                        </span>
                        <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 4 }}>{st.labelKo}</div>
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "var(--mo)", color: "var(--tx)", verticalAlign: "middle" }}>{a.monthMessages}</td>
                      <td style={{ padding: "12px 14px", fontFamily: "var(--mo)", color: "var(--tx)", verticalAlign: "middle" }}>{a.uniqueUsers}</td>
                      <td style={{ padding: "12px 14px", color: "var(--tx2)", fontFamily: "var(--mo)", fontSize: "var(--fs-xs)", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        {fmtWhen(lastIso)}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right", verticalAlign: "middle" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button
                            type="button"
                            aria-label="대시보드"
                            onClick={() => openDashboard(r)}
                            style={iconBtn}
                          >
                            <Squares2X2Icon style={{ width: 20, height: 20 }} />
                          </button>
                          <button type="button" aria-label="설정" onClick={() => openDashboard(r)} style={iconBtn}>
                            <Cog6ToothIcon style={{ width: 20, height: 20 }} />
                          </button>
                          <button type="button" aria-label="테스트" onClick={() => openDashboard(r)} style={iconBtn}>
                            <BeakerIcon style={{ width: 20, height: 20 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Cd>
      )}

      {rows.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 28 }}>
          <p style={{ margin: 0, fontSize: "var(--fs-xs)", fontFamily: "var(--mo)", color: "var(--tx3)", letterSpacing: "0.06em" }}>
            SHOWING {showingFrom}–{showingTo} OF {filtered.length} CLONES
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <Bt v="gh" type="button" dis={safePage <= 0} on={() => setPage((p) => Math.max(0, p - 1))} style={{ minHeight: "var(--touch-min)" }}>
              PREV
            </Bt>
            <Bt v="gh" type="button" dis={safePage >= pageCount - 1} on={() => setPage((p) => Math.min(pageCount - 1, p + 1))} style={{ minHeight: "var(--touch-min)" }}>
              NEXT
            </Bt>
          </div>
        </div>
      )}

      {/* 하단 통계 3카드 */}
      {rows.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
          <Cd style={{ padding: "18px 20px", borderColor: "var(--br2)" }}>
            <div style={{ ...capMo, marginBottom: 10 }}>이번 달 총 대화</div>
            <div style={{ fontSize: "var(--fs-h3)", fontWeight: 800, fontFamily: "var(--mo)", color: "var(--tx)", marginBottom: 12 }}>{monthTotal.toLocaleString()}</div>
            <div style={{ height: 8, borderRadius: 999, background: "var(--sf3)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${monthBarPct}%`, borderRadius: 999, background: "var(--market-gauge-cyan)", transition: "width 0.35s ease" }} />
            </div>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", marginTop: 10, fontFamily: "var(--fn)", lineHeight: 1.5 }}>목표 대비 시각화(Mock). 목표 {monthGoal.toLocaleString()} 메시지 기준.</p>
          </Cd>
          <Cd style={{ padding: "18px 20px", borderColor: "var(--br2)" }}>
            <div style={{ ...capMo, marginBottom: 10 }}>품질 점수 평균</div>
            <div style={{ fontSize: "var(--fs-h3)", fontWeight: 800, fontFamily: "var(--mo)", color: avgQuality != null ? "var(--go)" : "var(--tx3)" }}>
              {avgQuality != null ? avgQuality : "—"}
            </div>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", marginTop: 10, fontFamily: "var(--fn)", lineHeight: 1.5 }}>clones.quality_score 평균(0인 값 제외).</p>
          </Cd>
          <button
            type="button"
            onClick={() => navigate("/dashboard/create")}
            style={{
              padding: "22px 20px",
              borderRadius: "var(--r-xl)",
              border: "2px dashed var(--cy)",
              background: "linear-gradient(180deg, var(--cyg) 0%, var(--sf2) 100%)",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "var(--fn)",
            }}
          >
            <div style={{ fontSize: "var(--fs-h3)", fontWeight: 800, color: "var(--cy)", marginBottom: 8 }}>+ 새 클론 만들기</div>
            <p style={{ fontSize: "var(--fs-caption)", color: "var(--tx2)", margin: 0, lineHeight: 1.55 }}>추가 클론을 등록하고 토큰·자료를 설정합니다.</p>
          </button>
        </div>
      )}
    </div>
  );
}
