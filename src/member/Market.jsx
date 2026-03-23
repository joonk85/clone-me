import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bars3Icon,
  BellIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  RectangleStackIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

import Av from "../common/Av";
import Bt from "../common/Bt";
import Cd from "../common/Cd";
import TokenRingGauge from "../common/TokenRingGauge";
import { useAuth } from "../contexts/AuthContext";
import { usePlatformSubscription } from "../contexts/PlatformSubscriptionContext";
import { useWindowSize } from "../hooks/useWindowSize";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMarketClones, fetchMyUserRow, fetchTokenSummary } from "../lib/supabaseQueries";

const CATEGORY_TABS = ["전체", "비즈니스", "마케팅", "개발", "디자인", "교육", "투자", "라이프스타일", "기타"];

const CAT_KEYWORDS = {
  비즈니스: ["비즈니스", "영업", "사업", "경영", "b2b", "스타트업"],
  마케팅: ["마케팅", "브랜딩", "광고", "퍼포먼스", "콘텐츠"],
  개발: ["개발", "코딩", "프로그래밍", "엔지니어", "소프트웨어", "it"],
  디자인: ["디자인", "ux", "ui", "브랜드"],
  교육: ["교육", "강의", "코칭", "학습", "e러닝"],
  투자: ["투자", "재테크", "주식", "펀드", "자산"],
  라이프스타일: ["라이프", "웰니스", "습관", "루틴", "일상"],
  기타: [],
};

function isImageAv(v) {
  return typeof v === "string" && /^https?:\/\//i.test(v.trim());
}

function masterMatchesCategory(m, cat) {
  if (cat === "전체") return true;
  if (cat === "기타") {
    const others = CATEGORY_TABS.filter((c) => c !== "전체" && c !== "기타");
    return !others.some((c) => masterMatchesCategory(m, c));
  }
  const kws = CAT_KEYWORDS[cat] || [cat];
  const hay = `${m.name || ""} ${m.title || ""} ${(m.tags || []).join(" ")}`.toLowerCase();
  return kws.some((k) => hay.includes(k.toLowerCase()));
}

/** 클론 목록을 마스터 단위로 그룹핑 */
function groupClonesByMaster(cloneCards) {
  const byMaster = new Map();
  for (const c of cloneCards) {
    const mid = c.master_id;
    if (!mid) continue;
    if (!byMaster.has(mid)) {
      byMaster.set(mid, {
        master_id: mid,
        name: c.name,
        title: c.title,
        bio: c.bio || "",
        signature: c.signature || "",
        tags: c.tags || [],
        isVerified: c.isVerified,
        isAffiliate: c.isAffiliate,
        first_clone_id: c.id,
        first_av: c.av,
        first_color: c.color,
        clones_count: 0,
        min_token_price: c.token_price ?? 1,
        rating_sum: c.rating ?? 4.8,
        rating_n: 1,
      });
    } else {
      const row = byMaster.get(mid);
      row.clones_count += 1;
      row.min_token_price = Math.min(row.min_token_price, c.token_price ?? 1);
      row.rating_sum += c.rating ?? 4.8;
      row.rating_n += 1;
    }
  }
  return Array.from(byMaster.values()).map((m) => ({
    ...m,
    rating: m.rating_n ? Math.round((m.rating_sum / m.rating_n) * 10) / 10 : 4.8,
  }));
}

function planSlotFilled(planId, index) {
  const order = { free: 1, basic: 2, pro: 3, ultimate: 4 };
  const n = order[planId] ?? 1;
  return index < n;
}

function tokenGaugeFromBalance(total, planMonthly) {
  const denom = planMonthly > 0 ? planMonthly : Math.max(50, total || 50);
  const percent = Math.min(100, Math.round((total / denom) * 100));
  let tone = "cyan";
  if (total <= 0) tone = "red";
  else if (total < 15) tone = "amber";
  return { percent, tone };
}

function MarketSkeleton({ cols }) {
  const n = cols * 2 + cols;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 16 }}>
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          className="market-sk"
          style={{
            borderRadius: "var(--r-lg)",
            overflow: "hidden",
            border: "1px solid var(--br)",
            background: "var(--sf)",
          }}
        >
          <div style={{ aspectRatio: "2 / 3", background: "var(--sf3)" }} />
          <div style={{ padding: 16, background: "var(--market-card-footer)" }}>
            <div style={{ height: 18, width: "70%", background: "var(--sf3)", borderRadius: 4, marginBottom: 10 }} />
            <div style={{ height: 12, width: "45%", background: "var(--sf3)", borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MasterExploreCard({ m, onOpen }) {
  const img = isImageAv(m.first_av) ? m.first_av.trim() : null;
  const initial = String(m.first_av || m.name || "?")
    .trim()
    .charAt(0)
    .toUpperCase();
  const badge = `${m.rating} / MSG ${m.min_token_price}T`;

  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onOpen(m)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        padding: 0,
        border: `1px solid ${hover ? "var(--br2)" : "var(--br)"}`,
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        background: "var(--sf)",
        cursor: "pointer",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hover ? "0 16px 48px var(--cyg), 0 0 0 1px var(--br2)" : "none",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        fontFamily: "var(--fn)",
      }}
    >
      <div style={{ position: "relative", flex: "2 1 0", minHeight: 200, background: "var(--sf3)" }}>
        {img ? (
          <img
            src={img}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: hover ? "grayscale(0.15) contrast(1.02)" : "grayscale(1) contrast(1.05)",
              transition: "filter 0.25s ease",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(145deg, var(--sf3) 0%, var(--sf2) 100%)",
              filter: hover ? "grayscale(0.2)" : "grayscale(1)",
              transition: "filter 0.25s ease",
            }}
          >
            <Av char={initial} color={m.first_color || "var(--cy)"} size={72} />
          </div>
        )}
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            padding: "6px 10px",
            borderRadius: "var(--r-sm)",
            background: "rgba(5,5,8,0.75)",
            border: "1px solid var(--br2)",
            color: "var(--cy)",
            fontSize: "var(--fs-xs)",
            fontFamily: "var(--mo)",
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          {badge}
        </div>
      </div>
      <div
        style={{
          flex: "1 1 0",
          padding: "16px 14px 14px",
          background: "var(--market-card-footer)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          minHeight: 120,
        }}
      >
        <div>
          <div style={{ fontSize: "var(--fs-h3)", fontWeight: 800, color: "var(--tx)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{m.name}</div>
          <div
            style={{
              fontSize: "var(--fs-caption)",
              color: "var(--tx2)",
              marginTop: 6,
              lineHeight: 1.45,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {m.title || m.signature || m.bio || "전문가 클론과 대화해 보세요."}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--mo)", fontWeight: 600 }}>
              클론 {m.clones_count}
            </span>
            <div style={{ display: "flex", marginLeft: 4 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    border: "2px solid var(--market-card-footer)",
                    marginLeft: i === 0 ? 0 : -10,
                    background: i % 2 === 0 ? "var(--sf2)" : "var(--sf3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 800,
                    color: "var(--tx3)",
                    fontFamily: "var(--mo)",
                  }}
                >
                  {String.fromCharCode(65 + ((m.master_id?.charCodeAt?.(i) || i) % 26))}
                </div>
              ))}
            </div>
          </div>
          <span
            style={{
              width: "var(--touch-min)",
              minWidth: "var(--touch-min)",
              height: "var(--touch-min)",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--br2)",
              background: "var(--cyd)",
              color: "var(--cy)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            aria-hidden
          >
            <ChevronRightIcon style={{ width: 20, height: 20 }} />
          </span>
        </div>
      </div>
    </button>
  );
}

function MarketEmpty({ kind }) {
  const navigate = useNavigate();
  if (kind === "supabase") {
    return (
      <Cd style={{ padding: "clamp(28px, 6vw, 40px)", textAlign: "center", borderStyle: "dashed", borderColor: "var(--br2)", background: "var(--cyg)" }}>
        <p style={{ color: "var(--tx)", fontSize: "var(--fs-body)", fontWeight: 700, fontFamily: "var(--fn)", marginBottom: 8 }}>Supabase 연결이 필요합니다</p>
        <p style={{ color: "var(--tx2)", fontSize: "var(--fs-lead)", lineHeight: 1.65, fontFamily: "var(--fn)", marginBottom: 20 }}>.env에 VITE 설정을 넣고 다시 시도해 주세요.</p>
        <Bt v="gh" on={() => navigate("/")}>
          홈으로
        </Bt>
      </Cd>
    );
  }
  return (
    <Cd style={{ padding: "clamp(28px, 6vw, 44px)", textAlign: "center", borderStyle: "dashed", borderColor: "var(--br2)", background: "linear-gradient(180deg, var(--cyg) 0%, var(--sf2) 100%)" }}>
      <p style={{ color: "var(--tx)", fontSize: "var(--fs-h3)", fontWeight: 800, fontFamily: "var(--fn)", letterSpacing: "-0.02em", marginBottom: 10 }}>
        아직 등록된 마스터가 없습니다
      </p>
      <p style={{ color: "var(--tx2)", fontSize: "var(--fs-body)", lineHeight: 1.7, fontFamily: "var(--fn)", maxWidth: 400, margin: "0 auto 24px" }}>
        첫 번째 마스터가 되어보세요.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
        <Bt v="pr" on={() => navigate("/master-register")}>
          마스터 등록하기
        </Bt>
        <Bt v="gh" on={() => navigate("/")}>
          홈으로
        </Bt>
      </div>
    </Cd>
  );
}

export default function Market() {
  const navigate = useNavigate();
  const { width, isMobile } = useWindowSize();
  const { user } = useAuth();
  const { planId, plan } = usePlatformSubscription();

  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");
  const [noSupabase, setNoSupabase] = useState(false);
  const [tokenTotal, setTokenTotal] = useState(0);
  const [userAvatarUrl, setUserAvatarUrl] = useState(null);

  const gridCols = width >= 1024 ? 3 : width >= 768 ? 2 : 1;

  const loadTokens = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) {
      setTokenTotal(0);
      setUserAvatarUrl(null);
      return;
    }
    const [tok, urow] = await Promise.all([fetchTokenSummary(supabase, user.id), fetchMyUserRow(supabase)]);
    setTokenTotal(tok.total ?? 0);
    setUserAvatarUrl(urow.row?.avatar_url || null);
  }, [user?.id]);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      setNoSupabase(true);
      setFetchErr("");
      return;
    }
    setNoSupabase(false);
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { list: rows, error } = await fetchMarketClones(supabase);
      if (!cancelled) {
        setLoading(false);
        if (error) {
          setFetchErr(error.message || "목록을 불러오지 못했습니다");
        } else {
          setFetchErr("");
          setList(rows || []);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const masters = useMemo(() => groupClonesByMaster(list), [list]);

  const filtered = useMemo(() => {
    let out = masters.filter((m) => masterMatchesCategory(m, category));
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (m) =>
          (m.name || "").toLowerCase().includes(q) ||
          (m.title || "").toLowerCase().includes(q) ||
          (m.tags || []).some((t) => String(t).toLowerCase().includes(q))
      );
    }
    return out;
  }, [masters, category, searchQuery]);

  const openMaster = (m) => navigate(`/master/${m.first_clone_id}`);

  const monthly = plan?.monthlyTokens ?? 0;
  const { percent: gaugePct, tone: gaugeTone } = tokenGaugeFromBalance(tokenTotal, monthly);

  const priorityTitle = planId === "free" ? "Free" : plan?.name || "Free";
  const prioritySub =
    planId === "free"
      ? "업그레이드하면 더 많은 마스터와 대화하세요"
      : planId === "basic"
        ? "플랜에 맞는 토큰으로 마스터와 계속 대화하세요"
        : "프리미엄 마스터 우선 접근 가능";

  const displayName = user?.email?.split("@")[0] || "";
  const userChar = (displayName || "?").trim().charAt(0).toUpperCase();

  const padX = "max(var(--page-pad-x), var(--safe-left))";
  const padR = "max(var(--page-pad-x), var(--safe-right))";

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--market-page-bg)",
        color: "var(--tx)",
        paddingBottom: "calc(24px + var(--safe-bottom))",
      }}
    >
      {/* 상단 바: 검색 중앙 + 우측 게이지·알림·계정 */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          paddingLeft: padX,
          paddingRight: padR,
          paddingBottom: 8,
          paddingTop: "calc(var(--safe-top) + 6px)",
          background: "linear-gradient(180deg, var(--market-page-bg) 88%, transparent 100%)",
          borderBottom: "1px solid var(--br)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 1200, margin: "0 auto" }}>
          {isMobile ? (
            <button
              type="button"
              aria-label="메뉴 열기"
              onClick={() => window.dispatchEvent(new CustomEvent("clone-me-open-rail"))}
              style={{
                width: "var(--touch-min)",
                height: "var(--touch-min)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--br)",
                borderRadius: "var(--r-md)",
                background: "var(--sf2)",
                color: "var(--tx)",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Bars3Icon style={{ width: 22, height: 22 }} />
            </button>
          ) : (
            <div style={{ width: 44, flexShrink: 0 }} aria-hidden />
          )}

          <div style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
            <div
              style={{
                width: "100%",
                maxWidth: 480,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid var(--br2)",
                background: "var(--sf2)",
              }}
            >
              <MagnifyingGlassIcon style={{ width: 20, height: 20, color: "var(--tx3)", flexShrink: 0 }} aria-hidden />
              <input
                type="search"
                placeholder="Search AI Masters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                aria-label="Search AI Masters"
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8, flexShrink: 0 }}>
            <TokenRingGauge percent={gaugePct} tone={gaugeTone} size="md" />
            <button
              type="button"
              aria-label="알림 설정"
              onClick={() => navigate(user ? "/my/notifications" : "/login")}
              style={{
                width: isMobile ? "var(--touch-min)" : 40,
                height: isMobile ? "var(--touch-min)" : 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--br)",
                borderRadius: "var(--r-md)",
                background: "var(--sf2)",
                color: "var(--tx2)",
                cursor: "pointer",
              }}
            >
              <BellIcon style={{ width: 22, height: 22 }} />
            </button>
            <button
              type="button"
              aria-label={user ? "마이페이지" : "로그인"}
              onClick={() => navigate(user ? "/my" : "/login")}
              style={{
                width: isMobile ? "var(--touch-min)" : 40,
                height: isMobile ? "var(--touch-min)" : 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--br)",
                borderRadius: "var(--r-md)",
                background: "var(--sf2)",
                color: "var(--tx2)",
                cursor: "pointer",
                overflow: "hidden",
              }}
            >
              {user ? (
                isImageAv(userAvatarUrl) ? (
                  <img src={userAvatarUrl.trim()} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Av char={userChar} color="var(--cy)" size={32} />
                )
              ) : (
                <UserCircleIcon style={{ width: 24, height: 24 }} />
              )}
            </button>
          </div>
        </div>
      </header>

      <div style={{ paddingLeft: padX, paddingRight: padR, paddingTop: 20, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        {fetchErr ? (
          <Cd style={{ padding: "14px 18px", marginBottom: 18, borderColor: "var(--err-border)", background: "var(--err-surface)" }}>
            <p style={{ color: "var(--rd)", fontSize: "var(--fs-caption)", fontFamily: "var(--fn)", lineHeight: 1.55, marginBottom: 8 }}>{fetchErr}</p>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--tx2)", fontFamily: "var(--fn)" }}>
              로그인 없이 볼 수 있어야 합니다. RLS·anon 권한을 확인해 주세요.{" "}
              <Link to="/login" style={{ color: "var(--cy)", fontWeight: 600 }}>
                로그인
              </Link>
            </p>
          </Cd>
        ) : null}

        {noSupabase && <MarketEmpty kind="supabase" />}

        {loading && !noSupabase && !fetchErr && (
          <div style={{ marginTop: 8 }}>
            <div className="market-sk" style={{ height: 120, borderRadius: "var(--r-lg)", background: "var(--sf2)", border: "1px solid var(--br)", marginBottom: 20 }} />
            <MarketSkeleton cols={gridCols} />
          </div>
        )}

        {!loading && !noSupabase && !fetchErr && masters.length === 0 && <MarketEmpty kind="empty" />}

        {!loading && !noSupabase && !fetchErr && masters.length > 0 && (
          <>
            {/* Priority Access 배너 */}
            <Cd
              style={{
                padding: "clamp(18px, 3vw, 26px)",
                marginBottom: 22,
                borderColor: "var(--br2)",
                background: "var(--market-banner-surface)",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
              }}
            >
              <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px solid var(--br2)",
                    background: "var(--cyd)",
                    marginBottom: 10,
                  }}
                >
                  <RectangleStackIcon style={{ width: 16, height: 16, color: "var(--cy)" }} aria-hidden />
                  <span style={{ fontSize: 10, fontFamily: "var(--mo)", fontWeight: 800, letterSpacing: "0.14em", color: "var(--cy)" }}>PRIORITY ACCESS</span>
                </div>
                <div style={{ fontSize: isMobile ? "var(--fs-h3)" : "var(--fs-h2)", fontWeight: 800, fontFamily: "var(--fn-title)", color: "var(--tx)", marginBottom: 8 }}>
                  {priorityTitle}
                </div>
                <p style={{ fontSize: "var(--fs-caption)", color: "var(--tx2)", lineHeight: 1.6, fontFamily: "var(--fn)", margin: 0 }}>{prioritySub}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mo)", letterSpacing: "0.06em" }}>남은 토큰</div>
                  <div style={{ fontSize: "var(--fs-h3)", fontWeight: 800, fontFamily: "var(--mo)", color: "var(--cy)" }}>{user ? tokenTotal.toLocaleString() : "—"}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }} aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "var(--r-md)",
                        border: `1px solid ${planSlotFilled(planId, i) ? "var(--br2)" : "var(--br)"}`,
                        background: planSlotFilled(planId, i) ? "var(--cyd)" : "var(--sf3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: planSlotFilled(planId, i) ? "var(--cy)" : "var(--tx3)",
                      }}
                    >
                      <RectangleStackIcon style={{ width: 18, height: 18 }} />
                    </div>
                  ))}
                </div>
              </div>
            </Cd>

            {/* Available Masters + 카테고리 */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: "var(--fs-h3)", fontWeight: 800, fontFamily: "var(--fn-title)", color: "var(--tx)", margin: 0 }}>Available Masters</h2>
                <p style={{ fontSize: "var(--fs-caption)", color: "var(--tx3)", fontFamily: "var(--mo)", marginTop: 4 }}>{`${filtered.length} / ${masters.length}`}</p>
              </div>
              <div className="nav-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", maxWidth: "100%", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
                {CATEGORY_TABS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setCategory(f)}
                    style={{
                      minHeight: "var(--touch-min)",
                      padding: "0 14px",
                      borderRadius: 999,
                      border: category === f ? "1px solid var(--cy)" : "1px solid var(--br)",
                      background: category === f ? "var(--cyd)" : "var(--sf2)",
                      color: category === f ? "var(--cy)" : "var(--tx2)",
                      fontSize: "var(--fs-caption)",
                      cursor: "pointer",
                      fontFamily: "var(--fn)",
                      fontWeight: category === f ? 700 : 500,
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <section aria-label="마스터 목록">
              <h2 className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
                마스터 목록
              </h2>
              {filtered.length === 0 ? (
                <Cd style={{ padding: 28, textAlign: "center", borderStyle: "dashed" }}>
                  <p style={{ color: "var(--tx2)", fontSize: "var(--fs-body)", fontFamily: "var(--fn)" }}>이 검색·분야에 맞는 마스터가 없습니다.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory("전체");
                      setSearchQuery("");
                    }}
                    style={{
                      marginTop: 14,
                      fontSize: "var(--fs-caption)",
                      color: "var(--cy)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--fn)",
                      fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    전체 보기
                  </button>
                </Cd>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`, gap: 16 }}>
                  {filtered.map((m) => (
                    <MasterExploreCard key={m.master_id} m={m} onOpen={openMaster} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

      </div>
    </div>
  );
}
