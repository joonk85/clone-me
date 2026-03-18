import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Av from "../common/Av";
import MasterBadges from "../common/MasterBadges";
import Bt from "../common/Bt";
import Cd from "../common/Cd";
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

const GUEST_STATS = [
  { label: "전문가 클론", value: "340+", sub: "등록" },
  { label: "누적 대화", value: "120만+", sub: "턴" },
  { label: "만족도", value: "4.8", sub: "/ 5.0" },
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

function FeaturedCard({ c, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minWidth: 200,
        maxWidth: 240,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: "var(--r-xl)",
        border: "1px solid var(--br)",
        background: "var(--sf2)",
        textAlign: "left",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
        fontFamily: "var(--fn)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--br2)";
        e.currentTarget.style.background = "var(--sf3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--br)";
        e.currentTarget.style.background = "var(--sf2)";
      }}
    >
      <div style={{ position: "relative", height: 112, width: "100%", overflow: "hidden", background: "var(--sf)" }}>
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
    setGuestFeatured(merged.slice(0, 3));
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
    paddingLeft: "max(var(--page-pad-x-mobile), var(--safe-left))",
    paddingRight: "max(var(--page-pad-x-mobile), var(--safe-right))",
    paddingTop: isMobile ? 20 : 36,
    paddingBottom: isMobile ? 28 : 44,
  };
  const maxW = { maxWidth: 640, marginLeft: "auto", marginRight: "auto", width: "100%" };

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "45vh",
          ...pagePad,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ fontSize: "var(--fs-caption)", color: "var(--tx3)", fontFamily: "var(--fn)" }}>불러오는 중…</p>
      </div>
    );
  }

  /* ========== 비로그인 ========== */
  if (mode === "guest") {
    return (
      <div style={{ minHeight: "100%", ...pagePad }}>
        <div style={maxW}>
          <section style={{ textAlign: "center" }}>
            <h1
              style={{
                fontSize: isMobile ? "clamp(26px, 7vw, 36px)" : "clamp(32px, 5vw, 48px)",
                fontWeight: 800,
                letterSpacing: "-0.035em",
                color: "var(--tx)",
                fontFamily: "var(--fn)",
                lineHeight: 1.08,
              }}
            >
              나만의 전문가 클론과 대화하세요
            </h1>
            <p
              style={{
                margin: "14px auto 0",
                maxWidth: 420,
                fontSize: "var(--fs-lead)",
                color: "var(--tx2)",
                lineHeight: 1.7,
                fontFamily: "var(--fn)",
              }}
            >
              법률·세무·코칭 등 분야별 마스터의 지식을 클론으로. 토큰으로 대화하고, 마스터는 수익을 만듭니다.
            </p>
            <div
              style={{
                marginTop: 28,
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                justifyContent: "center",
              }}
            >
              <Bt v="pr" on={() => navigate("/signup")}>
                무료로 시작하기
              </Bt>
              <Bt v="gh" on={() => navigate("/market")}>
                마켓 둘러보기
              </Bt>
            </div>
          </section>

          <section
            style={{
              marginTop: isMobile ? 36 : 48,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: isMobile ? 10 : 16,
            }}
          >
            {GUEST_STATS.map((s) => (
              <Cd
                key={s.label}
                style={{
                  padding: isMobile ? "14px 10px" : "18px 14px",
                  textAlign: "center",
                  background: "var(--sf2)",
                }}
              >
                <p style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "var(--pu)", fontFamily: "var(--mo)" }}>
                  {s.value}
                </p>
                <p style={{ marginTop: 6, fontSize: "var(--fs-xs)", color: "var(--tx2)", fontFamily: "var(--fn)" }}>{s.label}</p>
                {s.sub && (
                  <p style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--mo)", marginTop: 2 }}>{s.sub}</p>
                )}
              </Cd>
            ))}
          </section>

          <section style={{ marginTop: isMobile ? 36 : 48 }}>
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
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
              <Link to="/market" style={linkStyle()}>
                전체 보기
              </Link>
            </div>
            {!supabaseConfigured ? (
              <Cd style={{ padding: 28, textAlign: "center" }}>
                <p style={{ color: "var(--tx2)", fontSize: "var(--fs-lead)", fontFamily: "var(--fn)" }}>
                  Supabase 연결 후 마켓 클론이 표시됩니다.
                </p>
              </Cd>
            ) : guestFeatured.length === 0 ? (
              <EmptyPanel emoji="✨" title="아직 등록된 클론이 없어요" hint="마스터로 참여해 첫 클론을 만들어 보세요." />
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  overflowX: "auto",
                  paddingBottom: 8,
                  scrollbarWidth: "thin",
                  scrollbarColor: "var(--br2) transparent",
                }}
              >
                {guestFeatured.map((c) => (
                  <FeaturedCard key={c.id} c={c} onClick={() => navigate(`/clone/${c.id}`)} />
                ))}
              </div>
            )}
          </section>

          <section
            style={{
              marginTop: 40,
              borderRadius: "var(--r-xl)",
              border: "1px solid var(--br2)",
              background: "linear-gradient(135deg, var(--cyd) 0%, var(--cyg) 100%)",
              padding: isMobile ? 24 : 32,
              textAlign: "center",
            }}
          >
            <p style={{ fontWeight: 600, color: "var(--tx)", fontSize: "var(--fs-body)", fontFamily: "var(--fn)" }}>
              지금 가입하고 보너스 토큰을 받으세요
            </p>
            <div style={{ marginTop: 16 }}>
              <Bt v="pr" on={() => navigate("/signup")}>
                회원가입
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
        <div style={maxW}>
          {/* 보유 토큰 카드 */}
          <div
            style={{
              borderRadius: "var(--r-xl)",
              padding: isMobile ? 20 : 24,
              marginBottom: isMobile ? 28 : 36,
              background: "linear-gradient(145deg, var(--cyd) 0%, var(--sf2) 42%, var(--sf3) 100%)",
              border: "1px solid var(--br2)",
              boxShadow: "0 0 0 1px var(--cyg), 0 12px 40px var(--cyg)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "var(--mo)",
                    fontSize: "var(--fs-xs)",
                    letterSpacing: "0.08em",
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
                    fontSize: isMobile ? 30 : 36,
                    fontWeight: 800,
                    color: "var(--tx)",
                    marginTop: 6,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {tokens.total.toLocaleString()}
                  <span style={{ fontSize: "0.45em", fontWeight: 600, color: "var(--tx2)", marginLeft: 6 }}>T</span>
                </p>
                {tokens.bonus > 0 && (
                  <p style={{ fontSize: "var(--fs-sm)", color: "var(--am)", marginTop: 8, fontFamily: "var(--fn)" }}>
                    보너스 {tokens.bonus.toLocaleString()} 토큰 포함
                  </p>
                )}
                {tokens.purchased > 0 && (
                  <p style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", marginTop: 4, fontFamily: "var(--mo)" }}>
                    구매 {tokens.purchased.toLocaleString()} · 합계 기준
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
          </div>

          <section style={{ marginBottom: isMobile ? 32 : 40 }}>
            <div style={{ marginBottom: 14, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
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
                        <span style={{ color: "var(--cy)", fontSize: 18, flexShrink: 0 }} aria-hidden>
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
            <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
              {recommend.length > 0 && (
                <Link to="/market" style={linkStyle()}>
                  더보기
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
                    onClick={() => navigate(`/clone/${c.id}`)}
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
      <div style={maxW}>
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
                          <p style={{ marginTop: 8, fontSize: "var(--fs-sm)", color: "var(--am)", fontFamily: "var(--mo)" }}>★ {f.rating}</p>
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
