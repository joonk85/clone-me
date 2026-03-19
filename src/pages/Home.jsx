import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StarIcon } from "@heroicons/react/24/solid";

import Av from "../common/Av";
import MasterBadges from "../common/MasterBadges";
import Bt from "../common/Bt";
import Cd from "../common/Cd";
import LoadingSpinner from "../common/LoadingSpinner";
import { useWindowSize } from "../hooks/useWindowSize";
import { useAuth } from "../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import {
  fetchMarketClones,
  fetchMasterHomeSummary,
  fetchRecentConversations,
  fetchTokenSummary,
  rowToMarketCard,
} from "../lib/supabaseQueries";

const HERO_STATS = [
  { value: "100+", label: "분야별 전문가", sub: "" },
  { value: "24시간", label: "언제든 질문", sub: "" },
  { value: "월 200회", label: "기본 대화 제공", sub: "" },
];

function relTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function linkStyle() {
  return {
    fontSize: "var(--fs-caption)",
    color: "var(--cy)",
    textDecoration: "none",
    fontWeight: 600,
    fontFamily: "var(--fn)",
  };
}

function isImageUrl(v) {
  return typeof v === "string" && /^https?:\/\//i.test(v.trim());
}

function isHexColor(c) {
  return typeof c === "string" && /^#[0-9A-Fa-f]{6}$/.test(c.trim());
}

function initialBox(ch, size, round = false) {
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: round ? "50%" : "var(--r-md)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--cyg)",
        border: "1px solid var(--br2)",
        color: "var(--cy)",
        fontSize: Math.max(12, size * 0.38),
        fontWeight: 800,
        fontFamily: "var(--fn)",
      }}
    >
      {ch}
    </div>
  );
}

function CloneCover({ av, color, name }) {
  if (isImageUrl(av)) {
    return <img src={av} alt="" style={{ height: "100%", width: "100%", objectFit: "cover" }} />;
  }
  const ch = String(av || name || "?")
    .trim()
    .charAt(0);
  if (isHexColor(color)) {
    return (
      <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--sf3)" }}>
        <Av char={ch} color={color} size={56} />
      </div>
    );
  }
  return <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>{initialBox(ch, 64)}</div>;
}

function CloneAvatarRow({ av, color, name, wh }) {
  if (isImageUrl(av)) {
    return (
      <img
        src={av}
        alt=""
        style={{
          width: wh,
          height: wh,
          flexShrink: 0,
          borderRadius: "var(--r-md)",
          objectFit: "cover",
        }}
      />
    );
  }
  const ch = String(av || name || "?")
    .trim()
    .charAt(0);
  if (isHexColor(color)) return <Av char={ch} color={color} size={wh} />;
  return initialBox(ch, wh);
}

function EmptyPanel({ emoji, title, hint, children }) {
  return (
    <div
      style={{
        borderRadius: "var(--r-xl)",
        border: "1px dashed var(--br2)",
        background: "var(--cyg)",
        padding: "clamp(24px, 6vw, 40px)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 36, lineHeight: 1.2, marginBottom: 12, opacity: 0.45 }}>{emoji}</div>
      <p style={{ color: "var(--tx)", fontSize: "var(--fs-body)", fontWeight: 600, fontFamily: "var(--fn)" }}>{title}</p>
      {hint && (
        <p style={{ color: "var(--tx2)", fontSize: "var(--fs-lead)", marginTop: 8, lineHeight: 1.65, fontFamily: "var(--fn)" }}>
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

function FeaturedCard({ c, onClick, layout = "scroll" }) {
  const isGrid = layout === "grid";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...(isGrid
          ? { width: "100%", minWidth: 0, maxWidth: "none" }
          : { minWidth: 220, maxWidth: 260, flexShrink: 0, scrollSnapAlign: "start" }),
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: "var(--r-xl)",
        border: "1px solid var(--br)",
        background: "var(--sf2)",
        textAlign: "left",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
        fontFamily: "var(--fn)",
        boxShadow: "0 0 0 0 transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--br2)";
        e.currentTarget.style.background = "var(--sf3)";
        e.currentTarget.style.boxShadow = "0 8px 32px var(--cyg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--br)";
        e.currentTarget.style.background = "var(--sf2)";
        e.currentTarget.style.boxShadow = "0 0 0 0 transparent";
      }}
    >
      <div style={{ position: "relative", height: isGrid ? 120 : 118, width: "100%", overflow: "hidden", background: "var(--sf)" }}>
        <div style={{ height: "100%", opacity: 0.95 }}>
          <CloneCover av={c.av} color={c.color} name={c.name} />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, var(--sf) 0%, transparent 70%)",
          }}
        />
        {c.featured && (
          <span
            style={{
              position: "absolute",
              right: 8,
              top: 8,
              borderRadius: 999,
              background: "var(--go)",
              color: "var(--on-cy)",
              padding: "3px 8px",
              fontSize: "var(--fs-xs)",
              fontWeight: 800,
              fontFamily: "var(--mo)",
              letterSpacing: "0.06em",
            }}
          >
            Featured
          </span>
        )}
      </div>
      <div style={{ padding: 12 }}>
        <p style={{ fontWeight: 700, color: "var(--tx)", fontSize: "var(--fs-lead)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {c.name}
        </p>
        <div style={{ marginTop: 6 }}>
          <MasterBadges verified={c.isVerified} affiliate={c.isAffiliate} />
        </div>
        <p
          style={{
            marginTop: 4,
            fontSize: "var(--fs-sm)",
            color: "var(--tx2)",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {c.tagline || c.bio || "대화해보세요"}
        </p>
      </div>
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user, supabaseConfigured } = useAuth();
  const { isMobile } = useWindowSize();

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState("guest");
  const [guestFeatured, setGuestFeatured] = useState([]);
  const [memberChats, setMemberChats] = useState([]);
  const [recommend, setRecommend] = useState([]);
  const [tokens, setTokens] = useState({ total: 0, purchased: 0, bonus: 0 });
  const [masterSum, setMasterSum] = useState(null);

  const loadGuestFeatured = useCallback(async (supabase) => {
    const { rows } = await fetchMarketClones(supabase, 16);
    const cards = rows.map(rowToMarketCard);
    const feat = cards.filter((c) => c.featured);
    const rest = cards.filter((c) => !c.featured);
    const merged = [...feat, ...rest].slice(0, 6);
    setGuestFeatured(merged);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const supabase = getSupabaseBrowserClient();
      if (!user?.id) {
        setMode("guest");
        if (supabase) await loadGuestFeatured(supabase);
        if (!cancelled) setReady(true);
        return;
      }
      if (!supabase) {
        setMode("guest");
        setReady(true);
        return;
      }
      const { data: u } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
      if (cancelled) return;
      const isMaster = u?.role === "master";
      if (isMaster) {
        setMode("master");
        const sum = await fetchMasterHomeSummary(supabase, user.id);
        if (!cancelled) setMasterSum(sum);
      } else {
        setMode("member");
        const [conv, tok, market] = await Promise.all([
          fetchRecentConversations(supabase, user.id, 5),
          fetchTokenSummary(supabase, user.id),
          fetchMarketClones(supabase, 8),
        ]);
        if (cancelled) return;
        setMemberChats(conv.list || []);
        setTokens({
          total: tok.total ?? 0,
          purchased: tok.purchased ?? 0,
          bonus: tok.bonus ?? 0,
        });
        setRecommend((market.rows || []).map(rowToMarketCard).slice(0, 6));
      }
      setReady(true);
    }
    setReady(false);
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, loadGuestFeatured]);

  const pagePad = {
    paddingLeft: "max(var(--page-pad-x), var(--safe-left))",
    paddingRight: "max(var(--page-pad-x), var(--safe-right))",
    paddingTop: isMobile ? 16 : 28,
    paddingBottom: isMobile ? "calc(28px + var(--safe-bottom))" : "calc(40px + var(--safe-bottom))",
    background: "var(--bg)",
  };
  const maxWGuest = { maxWidth: 1040, marginLeft: "auto", marginRight: "auto", width: "100%" };
  const maxWMember = { maxWidth: 720, marginLeft: "auto", marginRight: "auto", width: "100%" };

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "50vh",
          ...pagePad,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <LoadingSpinner size={22} />
        <p style={{ fontSize: "var(--fs-caption)", color: "var(--tx3)", fontFamily: "var(--mo)", letterSpacing: "0.04em" }}>불러오는 중…</p>
      </div>
    );
  }

  /* ========== 비로그인 ========== */
  if (mode === "guest") {
    return (
      <div style={{ minHeight: "100%", ...pagePad }}>
        <div style={maxWGuest}>
          {/* 히어로 — BETA 뱃지 · 그라디언트 타이틀 · cyan 글로우 (비로그인 전용) */}
          <section
            className="home-hero"
            aria-label="메인 소개"
            style={{
              position: "relative",
              textAlign: "center",
              paddingTop: isMobile ? 12 : 20,
              paddingBottom: isMobile ? 8 : 12,
              marginBottom: isMobile ? 4 : 8,
              overflow: "hidden",
              borderRadius: "var(--r-xl)",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: "-8% -12% auto",
                height: "92%",
                background:
                  "radial-gradient(ellipse 72% 48% at 50% -8%, var(--cyd) 0%, transparent 58%), radial-gradient(ellipse 42% 32% at 92% 18%, var(--cyg) 0%, transparent 70%), radial-gradient(ellipse 38% 28% at 8% 22%, var(--cyg) 0%, transparent 68%)",
                pointerEvents: "none",
              }}
            />
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                bottom: "-20%",
                transform: "translateX(-50%)",
                width: "min(100%, 520px)",
                height: "45%",
                background: "radial-gradient(ellipse 80% 70% at 50% 100%, var(--cyd) 0%, transparent 65%)",
                opacity: 0.5,
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "inline-flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginBottom: isMobile ? 18 : 22,
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: "1px solid var(--br2)",
                  background: "linear-gradient(135deg, var(--cyd) 0%, var(--sf2) 100%)",
                  boxShadow: "0 0 32px var(--cyg)",
                }}
              >
                {["지식 클론 플랫폼", "한국 최초", "BETA"].map((t, i) => (
                  <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    {i > 0 && (
                      <span style={{ color: "var(--tx3)", fontFamily: "var(--mo)", fontSize: "var(--fs-xs)" }} aria-hidden>
                        ·
                      </span>
                    )}
                    <span
                      style={{
                        fontFamily: "var(--mo)",
                        fontSize: "var(--fs-xs)",
                        letterSpacing: i === 2 ? "0.14em" : "0.06em",
                        textTransform: i === 2 ? "uppercase" : "none",
                        color: i === 2 ? "var(--go)" : "var(--cy)",
                        fontWeight: 700,
                      }}
                    >
                      {t}
                    </span>
                  </span>
                ))}
              </div>
              <h1 className="home-hero-gradient-title" style={{ maxWidth: 720, margin: "0 auto", padding: "0 4px" }}>
                내 지식의 클론을 만드세요
              </h1>
              <p
                style={{
                  margin: "18px auto 0",
                  maxWidth: 460,
                  fontSize: isMobile ? "var(--fs-body)" : "var(--fs-body)",
                  color: "var(--tx2)",
                  lineHeight: 1.72,
                  fontFamily: "var(--fn)",
                  fontWeight: 500,
                }}
              >
                분야 최고 전문가에게 언제든 1:1로 물어보세요.
              </p>
              <p
                style={{
                  margin: "10px auto 0",
                  maxWidth: 460,
                  fontSize: "var(--fs-caption)",
                  color: "var(--tx3)",
                  lineHeight: 1.65,
                  fontFamily: "var(--fn)",
                }}
              >
                전문가 클론이 24시간 답해드립니다.
              </p>
              <div
                style={{
                  marginTop: isMobile ? 26 : 30,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Bt v="pr" on={() => navigate("/market")} style={{ minHeight: "var(--touch-min)", paddingLeft: 20, paddingRight: 20 }}>
                  전문가 클론 탐색 →
                </Bt>
                <Bt v="gh" on={() => navigate("/master-register")} style={{ minHeight: "var(--touch-min)", paddingLeft: 18, paddingRight: 18 }}>
                  강사로 등록하기
                </Bt>
              </div>
            </div>
          </section>

          {/* 통계 바 */}
          <section style={{ marginTop: isMobile ? 28 : 40 }}>
            <Cd style={{ padding: 0, overflow: "hidden", borderColor: "var(--br2)", background: "var(--sf2)", boxShadow: "0 0 0 1px var(--cyg)" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: "stretch",
                }}
              >
                {HERO_STATS.map((s, i) => (
                  <div
                    key={s.label}
                    style={{
                      flex: 1,
                      padding: isMobile ? "18px 16px" : "24px 18px",
                      textAlign: "center",
                      borderLeft: !isMobile && i > 0 ? "1px solid var(--br)" : undefined,
                      borderTop: isMobile && i > 0 ? "1px solid var(--br)" : undefined,
                    }}
                  >
                    <p
                      style={{
                        fontSize: isMobile ? "var(--fs-h2)" : "clamp(1.2rem, 2vw, 1.45rem)",
                        fontWeight: 800,
                        color: "var(--cy)",
                        fontFamily: "var(--mo)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {s.value}
                    </p>
                    <p style={{ marginTop: 8, fontSize: "var(--fs-caption)", color: "var(--tx)", fontFamily: "var(--fn)", fontWeight: 600, lineHeight: 1.45 }}>{s.label}</p>
                    {s.sub ? (
                      <p style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--mo)", marginTop: 4 }}>{s.sub}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </Cd>
          </section>

          {/* Featured */}
          <section style={{ marginTop: isMobile ? 36 : 48 }}>
            <div style={{ marginBottom: 16, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h2
                  style={{
                    fontSize: isMobile ? "var(--fs-h3)" : "var(--fs-h2)",
                    fontWeight: 800,
                    color: "var(--tx)",
                    letterSpacing: "-0.03em",
                    fontFamily: "var(--fn)",
                  }}
                >
                  Featured 클론
                </h2>
                <p style={{ marginTop: 4, fontSize: "var(--fs-sm)", color: "var(--tx3)", fontFamily: "var(--fn)" }}>검증된 마스터 클론을 만나보세요</p>
              </div>
              <Link to="/market" style={linkStyle()}>
                전체 보기 →
              </Link>
            </div>
            {!supabaseConfigured ? (
              <Cd style={{ padding: "clamp(24px,5vw,36px)", textAlign: "center", borderStyle: "dashed" }}>
                <p style={{ color: "var(--tx2)", fontSize: "var(--fs-body)", fontFamily: "var(--fn)", lineHeight: 1.65 }}>
                  Supabase 연결 후 마켓 클론이 표시됩니다.
                </p>
              </Cd>
            ) : guestFeatured.length === 0 ? (
              <EmptyPanel emoji="✨" title="아직 등록된 클론이 없어요" hint="마스터로 참여해 첫 클론을 만들어 보세요.">
                <div style={{ marginTop: 18 }}>
                  <Bt v="gh" on={() => navigate("/master-register")}>
                    마스터 등록 알아보기
                  </Bt>
                </div>
              </EmptyPanel>
            ) : isMobile ? (
              <div
                className="nav-scroll"
                style={{
                  display: "flex",
                  gap: 12,
                  overflowX: "auto",
                  padding: "4px 0 14px",
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {guestFeatured.map((c) => (
                  <FeaturedCard key={c.id} c={c} layout="scroll" onClick={() => navigate(`/chat/${c.id}`)} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 16,
                }}
              >
                {guestFeatured.map((c) => (
                  <FeaturedCard key={c.id} c={c} layout="grid" onClick={() => navigate(`/chat/${c.id}`)} />
                ))}
              </div>
            )}
          </section>

          {/* CTA */}
          <section
            style={{
              marginTop: isMobile ? 36 : 44,
              borderRadius: "var(--r-xl)",
              border: "1px solid var(--br2)",
              background: "linear-gradient(160deg, var(--cyd) 0%, var(--sf2) 48%, var(--sf3) 100%)",
              padding: isMobile ? 26 : 34,
              textAlign: "center",
              boxShadow: "0 0 0 1px var(--cyg), inset 0 1px 0 var(--br2)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--mo)",
                fontSize: "var(--fs-xs)",
                letterSpacing: "0.12em",
                color: "var(--cy)",
                textTransform: "uppercase",
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              Welcome bonus
            </p>
            <p style={{ fontWeight: 700, color: "var(--tx)", fontSize: isMobile ? "var(--fs-body)" : "var(--fs-h3)", fontFamily: "var(--fn)", lineHeight: 1.45 }}>
              지금 가입하고 보너스 토큰을 받으세요
            </p>
            <p style={{ marginTop: 8, fontSize: "var(--fs-sm)", color: "var(--tx2)", fontFamily: "var(--fn)" }}>무료로 시작해 첫 대화를 해 보세요.</p>
            <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              <Bt v="pr" on={() => navigate("/signup")}>
                회원가입
              </Bt>
              <Bt v="gh" on={() => navigate("/login")}>
                로그인
              </Bt>
            </div>
          </section>
        </div>
      </div>
    );
  }

  /* ========== 멤버 ========== */
  if (mode === "member") {
    return (
      <div style={{ minHeight: "100%", ...pagePad }}>
        <div style={maxWMember}>
          <Cd
            style={{
              padding: isMobile ? 20 : 26,
              marginBottom: isMobile ? 26 : 34,
              borderColor: "var(--br2)",
              background: "linear-gradient(155deg, var(--cyd) 0%, var(--sf2) 45%, var(--sf3) 100%)",
              boxShadow: "0 0 0 1px var(--cyg), 0 20px 48px var(--cyg)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 18,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "var(--mo)",
                    fontSize: "var(--fs-xs)",
                    letterSpacing: "0.1em",
                    color: "var(--cy)",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  보유 토큰
                </p>
                <p
                  style={{
                    fontFamily: "var(--mo)",
                    fontSize: isMobile ? "clamp(1.75rem, 8vw, 2rem)" : "clamp(2rem, 4vw, 2.25rem)",
                    fontWeight: 800,
                    color: "var(--tx)",
                    marginTop: 8,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {tokens.total.toLocaleString()}
                  <span style={{ fontSize: "0.42em", fontWeight: 600, color: "var(--tx2)", marginLeft: 8 }}>T</span>
                </p>
                {tokens.bonus > 0 && (
                  <p style={{ fontSize: "var(--fs-sm)", color: "var(--gn)", marginTop: 10, fontFamily: "var(--fn)" }}>
                    보너스 {tokens.bonus.toLocaleString()} 토큰 포함
                  </p>
                )}
                {tokens.purchased > 0 && (
                  <p style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", marginTop: 6, fontFamily: "var(--mo)" }}>
                    구매 {tokens.purchased.toLocaleString()} · 표시는 합계 기준
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Bt v="gh" sz="sm" on={() => navigate("/my/tokens")}>
                  충전
                </Bt>
                <Bt v="pr" sz="sm" on={() => navigate("/market")}>
                  마켓 가기
                </Bt>
              </div>
            </div>
          </Cd>

          <section style={{ marginBottom: isMobile ? 30 : 38 }}>
            <div style={{ marginBottom: 14, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h2
                  style={{
                    fontSize: isMobile ? "var(--fs-h3)" : "var(--fs-h2)",
                    fontWeight: 800,
                    color: "var(--tx)",
                    letterSpacing: "-0.03em",
                    fontFamily: "var(--fn)",
                  }}
                >
                  최근 대화
                </h2>
                <p style={{ marginTop: 4, fontSize: "var(--fs-sm)", color: "var(--tx3)", fontFamily: "var(--fn)" }}>이어서 대화하기</p>
              </div>
              {memberChats.length > 0 && (
                <Link to="/my/conversations" style={{ ...linkStyle(), fontSize: "var(--fs-sm)" }}>
                  전체
                </Link>
              )}
            </div>
            {memberChats.length === 0 ? (
              <EmptyPanel
                emoji="💬"
                title="아직 대화 기록이 없습니다"
                hint="마켓에서 관심 있는 클론을 골라 대화를 시작해 보세요."
              >
                <div style={{ marginTop: 20 }}>
                  <Bt v="pr" on={() => navigate("/market")}>
                    마켓에서 클론 선택
                  </Bt>
                </div>
              </EmptyPanel>
            ) : (
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {memberChats.map((row) => {
                  const clone = row.clones;
                  const name = clone?.name || "클론";
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/chat/${row.clone_id}`)}
                        style={{
                          display: "flex",
                          width: "100%",
                          alignItems: "center",
                          gap: 14,
                          borderRadius: "var(--r-lg)",
                          border: "1px solid var(--br)",
                          background: "var(--sf2)",
                          padding: 14,
                          textAlign: "left",
                          cursor: "pointer",
                          fontFamily: "var(--fn)",
                          transition: "border-color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--br2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--br)";
                        }}
                      >
                        <CloneAvatarRow av={clone?.av} color={clone?.color} name={clone?.name} wh={48} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontWeight: 600, color: "var(--tx)", fontSize: "var(--fs-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {name}
                          </p>
                          <p style={{ fontSize: "var(--fs-sm)", color: "var(--tx3)", marginTop: 4, fontFamily: "var(--mo)" }}>{relTime(row.updated_at)}</p>
                        </div>
                        <span style={{ color: "var(--cy)", fontSize: "var(--fs-h3)", fontFamily: "var(--mo)", flexShrink: 0, opacity: 0.85 }} aria-hidden>
                          →
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <div style={{ marginBottom: 14, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h2
                  style={{
                    fontSize: isMobile ? "var(--fs-h3)" : "var(--fs-h2)",
                    fontWeight: 800,
                    color: "var(--tx)",
                    letterSpacing: "-0.03em",
                    fontFamily: "var(--fn)",
                  }}
                >
                  추천 클론
                </h2>
                <p style={{ marginTop: 4, fontSize: "var(--fs-sm)", color: "var(--tx3)", fontFamily: "var(--fn)" }}>마켓에서 골라보세요</p>
              </div>
              {recommend.length > 0 && (
                <Link to="/market" style={linkStyle()}>
                  더보기 →
                </Link>
              )}
            </div>
            {recommend.length === 0 ? (
              <EmptyPanel
                emoji="🛒"
                title="마켓 준비 중입니다"
                hint="곧 다양한 전문가 클론을 만나실 수 있어요. 조금만 기다려 주세요."
              >
                <div style={{ marginTop: 16 }}>
                  <Bt v="gh" on={() => navigate("/market")}>
                    마켓 페이지 열기
                  </Bt>
                </div>
              </EmptyPanel>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                  gap: isMobile ? 10 : 14,
                }}
              >
                {recommend.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate(`/chat/${c.id}`)}
                    style={{
                      overflow: "hidden",
                      borderRadius: "var(--r-lg)",
                      border: "1px solid var(--br)",
                      background: "var(--sf2)",
                      textAlign: "left",
                      cursor: "pointer",
                      fontFamily: "var(--fn)",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--br2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--br)";
                    }}
                  >
                    <div style={{ position: "relative", height: 88, overflow: "hidden", background: "var(--sf)" }}>
                      <CloneCover av={c.av} color={c.color} name={c.name} />
                    </div>
                    <div style={{ padding: 10 }}>
                      <p style={{ fontWeight: 600, color: "var(--tx)", fontSize: "var(--fs-caption)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.name}
                      </p>
                      <div style={{ marginTop: 6, transform: "scale(0.92)", transformOrigin: "left center" }}>
                        <MasterBadges verified={c.isVerified} affiliate={c.isAffiliate} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  /* ========== 마스터 ========== */
  const sum = masterSum || { master: null, clonesTotal: 0, clonesActive: 0, pendingFeedback: [] };
  const hasMasterProfile = !!sum.master;

  return (
    <div style={{ minHeight: "100%", ...pagePad }}>
      <div style={maxWMember}>
        {!hasMasterProfile ? (
          <Cd style={{ padding: 28, textAlign: "center" }}>
            <p style={{ color: "var(--tx2)", fontSize: "var(--fs-body)", fontFamily: "var(--fn)", lineHeight: 1.65 }}>
              마스터 프로필을 등록하면 클론을 만들 수 있습니다.
            </p>
            <div style={{ marginTop: 20 }}>
              <Bt v="pr" on={() => navigate("/master-register")}>
                마스터 등록
              </Bt>
            </div>
          </Cd>
        ) : (
          <>
            <section
              style={{
                marginBottom: 28,
                display: "grid",
                gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              <Cd style={{ padding: 18 }}>
                <p style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--mo)", letterSpacing: "0.06em" }}>내 클론</p>
                <p style={{ marginTop: 8, fontSize: 26, fontWeight: 800, color: "var(--tx)", fontFamily: "var(--mo)" }}>{sum.clonesTotal}</p>
                <p style={{ fontSize: "var(--fs-sm)", color: "var(--tx2)", marginTop: 4, fontFamily: "var(--fn)" }}>활성 {sum.clonesActive}개</p>
              </Cd>
              <Cd style={{ padding: 18, borderColor: "var(--am-line)", background: "var(--am-muted)" }}>
                <p style={{ fontSize: "var(--fs-xs)", color: "var(--am)", fontFamily: "var(--mo)", letterSpacing: "0.06em" }}>미답변 피드백</p>
                <p style={{ marginTop: 8, fontSize: 26, fontWeight: 800, color: "var(--am)", fontFamily: "var(--mo)" }}>{sum.pendingFeedback.length}</p>
                <p style={{ fontSize: "var(--fs-sm)", color: "var(--tx2)", marginTop: 4, fontFamily: "var(--fn)" }}>최근 5건</p>
              </Cd>
              <div style={{ gridColumn: isMobile ? "span 2" : "span 1", display: "flex", alignItems: "stretch" }}>
                <Cd
                  style={{
                    flex: 1,
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderColor: "var(--br2)",
                    background: "var(--cyd)",
                  }}
                >
                  <Bt v="pr" on={() => navigate("/dashboard")} style={{ width: isMobile ? "100%" : "auto" }}>
                    대시보드
                  </Bt>
                </Cd>
              </div>
            </section>

            <section>
              <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2
                  style={{
                    fontSize: isMobile ? "var(--fs-h3)" : "var(--fs-h2)",
                    fontWeight: 800,
                    color: "var(--tx)",
                    fontFamily: "var(--fn)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  미답변 피드백
                </h2>
                {sum.pendingFeedback.length > 0 && (
                  <Link to="/dashboard" style={linkStyle()}>
                    전체 관리
                  </Link>
                )}
              </div>
              {sum.pendingFeedback.length === 0 ? (
                <Cd style={{ padding: 28, textAlign: "center" }}>
                  <p style={{ color: "var(--tx3)", fontSize: "var(--fs-lead)", fontFamily: "var(--fn)" }}>답변 대기 중인 피드백이 없습니다.</p>
                </Cd>
              ) : (
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {sum.pendingFeedback.map((f) => (
                    <li key={f.id}>
                      <Cd
                        style={{
                          padding: 14,
                          borderColor: "var(--am-line)",
                          background: "var(--am-surface)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--mo)" }}>
                          <span>{f.clones?.name || "클론"}</span>
                          <span>{relTime(f.created_at)}</span>
                        </div>
                        <p style={{ marginTop: 8, fontSize: "var(--fs-lead)", color: "var(--tx)", lineHeight: 1.55, fontFamily: "var(--fn)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {f.message || "(내용 없음)"}
                        </p>
                        {f.rating != null && (
                          <p style={{ marginTop: 8, fontSize: "var(--fs-sm)", color: "var(--am)", fontFamily: "var(--mo)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <StarIcon style={{ width: 16, height: 16 }} />
                          {f.rating}
                        </p>
                        )}
                      </Cd>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
