import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StarIcon } from "@heroicons/react/24/solid";

import Av from "../common/Av";
import Bt from "../common/Bt";
import Cd from "../common/Cd";
import LoadingSpinner from "../common/LoadingSpinner";
import MasterBadges from "../common/MasterBadges";
import Tg from "../common/Tg";
import { FREE_BASE, FREE_BONUS } from "../lib/tokens";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMarketClones } from "../lib/supabaseQueries";
import { useAppState } from "../contexts/AppStateContext";
import { useWindowSize } from "../hooks/useWindowSize";

const FILTERS = ["전체", "영업", "마케팅", "교육"];

function isImageAv(v) {
  return typeof v === "string" && /^https?:\/\//i.test(v.trim());
}

function MarketAvatar({ c, size = 52 }) {
  if (isImageAv(c.av)) {
    return (
      <img
        src={c.av.trim()}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: `2px solid var(--br2)`,
          boxShadow: `0 0 0 1px var(--cyg)`,
        }}
      />
    );
  }
  const ch = String(c.av || c.name || "?")
    .trim()
    .charAt(0);
  return <Av char={ch} color={c.color} size={size} />;
}

function MarketEmpty({ kind }) {
  const navigate = useNavigate();
  if (kind === "supabase") {
    return (
      <Cd
        style={{
          padding: "clamp(28px, 6vw, 40px)",
          textAlign: "center",
          borderStyle: "dashed",
          borderColor: "var(--br2)",
          background: "var(--cyg)",
        }}
      >
        <p style={{ fontSize: "var(--fs-h3)", marginBottom: 10, opacity: 0.5 }} aria-hidden>
          ⚙️
        </p>
        <p style={{ color: "var(--tx)", fontSize: "var(--fs-body)", fontWeight: 700, fontFamily: "var(--fn)", marginBottom: 8 }}>Supabase 연결이 필요합니다</p>
        <p style={{ color: "var(--tx2)", fontSize: "var(--fs-lead)", lineHeight: 1.65, fontFamily: "var(--fn)", marginBottom: 20 }}>
          `.env`에 VITE 설정을 넣고 다시 시도해 주세요.
        </p>
        <Bt v="gh" on={() => navigate("/")}>
          홈으로
        </Bt>
      </Cd>
    );
  }
  return (
    <Cd
      style={{
        padding: "clamp(28px, 6vw, 44px)",
        textAlign: "center",
        borderStyle: "dashed",
        borderColor: "var(--br2)",
        background: "linear-gradient(180deg, var(--cyg) 0%, var(--sf2) 100%)",
      }}
    >
      <p style={{ fontSize: "clamp(2rem, 8vw, 2.5rem)", lineHeight: 1, marginBottom: 14, opacity: 0.35 }} aria-hidden>
        ✦
      </p>
      <p style={{ color: "var(--tx)", fontSize: "var(--fs-h3)", fontWeight: 800, fontFamily: "var(--fn)", letterSpacing: "-0.02em", marginBottom: 10 }}>
        아직 마켓에 클론이 없습니다
      </p>
      <p style={{ color: "var(--tx2)", fontSize: "var(--fs-body)", lineHeight: 1.7, fontFamily: "var(--fn)", maxWidth: 400, margin: "0 auto 24px" }}>
        마스터가 클론을 만들고 <strong style={{ color: "var(--tx)" }}>활성화</strong>하면 여기에 노출됩니다. 첫 마스터가 되어 보세요.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
        <Bt v="pr" on={() => navigate("/signup")}>
          가입하고 알림 받기
        </Bt>
        <Bt v="gh" on={() => navigate("/master-register")}>
          마스터 등록
        </Bt>
      </div>
      <div style={{ marginTop: 16 }}>
        <Link
          to="/"
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--cy)",
            fontFamily: "var(--fn)",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          ← 홈으로
        </Link>
      </div>
    </Cd>
  );
}

function FeaturedStrip({ clones, onOpen }) {
  const { isMobile } = useWindowSize();
  if (!clones.length) return null;
  return (
    <section style={{ marginBottom: isMobile ? 20 : 24 }}>
      <div style={{ marginBottom: 12, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div>
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--go)", fontFamily: "var(--mo)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            Featured
          </p>
          <h2 style={{ fontSize: "var(--fs-h2)", fontWeight: 800, color: "var(--tx)", fontFamily: "var(--fn)", letterSpacing: "-0.03em" }}>추천 클론</h2>
        </div>
      </div>
      {isMobile ? (
        <div className="nav-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
          {clones.map((c) => (
            <FeaturedCard key={c.id} c={c} onOpen={() => onOpen(c)} narrow />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {clones.map((c) => (
            <FeaturedCard key={c.id} c={c} onOpen={() => onOpen(c)} />
          ))}
        </div>
      )}
    </section>
  );
}

function FeaturedCard({ c, onOpen, narrow }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        minWidth: narrow ? 260 : undefined,
        width: narrow ? 260 : "100%",
        flexShrink: narrow ? 0 : undefined,
        scrollSnapAlign: narrow ? "start" : undefined,
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "var(--fn)",
        borderRadius: "var(--r-xl)",
        border: "1px solid var(--br)",
        background: "var(--sf2)",
        padding: 0,
        overflow: "hidden",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: "0 0 0 0 transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--br2)";
        e.currentTarget.style.boxShadow = "0 12px 40px var(--cyg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--br)";
        e.currentTarget.style.boxShadow = "0 0 0 0 transparent";
      }}
    >
      <div
        style={{
          height: 6,
          width: "100%",
          background: c.color && /^#[0-9A-Fa-f]{6}$/.test(c.color) ? c.color : "var(--cy)",
          opacity: 0.85,
        }}
      />
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
          <MarketAvatar c={c} size={44} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--tx)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--tx3)", fontFamily: "var(--mo)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.title || "전문가 클론"}
            </p>
          </div>
          <MasterBadges verified={c.isVerified} affiliate={c.isAffiliate} />
        </div>
        <p
          style={{
            fontSize: "var(--fs-caption)",
            color: "var(--tx2)",
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: 10,
            fontStyle: "italic",
          }}
        >
          &quot;{c.signature || c.bio || "대화를 시작해 보세요"}&quot;
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>{(c.tags || []).slice(0, 3).map((t) => <Tg key={t} label={t} />)}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--br)" }}>
          <span style={{ fontSize: "var(--fs-sm)", color: "var(--go)", fontFamily: "var(--mo)", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <StarIcon style={{ width: 16, height: 16 }} />
            {c.rating}
          </span>
          <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--cy)" }}>{c.priceLabel}</span>
        </div>
      </div>
    </button>
  );
}

function CloneListCard({ c, i, isSub, hasFree, cap, used, onProfile, onChat, onSubscribe }) {
  const { isMobile } = useWindowSize();
  const quote = c.signature || c.bio || "";
  const accent = c.color && /^#[0-9A-Fa-f]{6}$/.test(c.color) ? c.color : "var(--cy)";

  const actions = (
    <>
      <Bt v="gh" sz="sm" on={onProfile} style={isMobile ? { flex: "1 1 100px" } : { width: "100%", minWidth: 108 }}>
        프로필
      </Bt>
      {isSub ? (
        <Bt v="pr" sz="sm" on={onChat} style={isMobile ? { flex: "1 1 120px" } : { width: "100%", minWidth: 108 }}>
          대화하기
        </Bt>
      ) : hasFree ? (
        <>
          <Bt v="pr" sz="sm" on={onChat} style={isMobile ? { flex: "1 1 140px" } : { width: "100%", minWidth: 108 }}>
            무료 {cap - used}회
          </Bt>
          <Bt v="sf" sz="sm" on={onSubscribe} style={isMobile ? { flex: "1 1 88px" } : { width: "100%", minWidth: 108 }}>
            구독
          </Bt>
        </>
      ) : (
        <Bt v="pr" sz="sm" on={onSubscribe} style={isMobile ? { flex: "1 1 140px" } : { width: "100%", minWidth: 108 }}>
          구독 후 대화
        </Bt>
      )}
    </>
  );

  return (
    <Cd
      style={{
        padding: 0,
        overflow: "hidden",
        borderColor: "var(--br)",
        animation: `fu ${0.15 + Math.min(i, 6) * 0.05}s ease`,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--br2)";
        e.currentTarget.style.boxShadow = "0 8px 28px var(--cyg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--br)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {isMobile && (
        <div style={{ height: 3, width: "100%", background: accent, opacity: 0.9 }} aria-hidden />
      )}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "flex-start",
          gap: isMobile ? 0 : 0,
          minHeight: isMobile ? undefined : 1,
        }}
      >
        {!isMobile && (
          <div style={{ width: 5, alignSelf: "stretch", flexShrink: 0, background: accent, opacity: 0.9 }} aria-hidden />
        )}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            flex: 1,
            gap: isMobile ? 14 : 18,
            padding: isMobile ? "16px 16px 18px" : "18px 20px 18px 18px",
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <MarketAvatar c={c} size={isMobile ? 48 : 56} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <h3 style={{ fontSize: "var(--fs-h3)", fontWeight: 800, color: "var(--tx)", fontFamily: "var(--fn)", letterSpacing: "-0.02em" }}>{c.name}</h3>
                <MasterBadges verified={c.isVerified} affiliate={c.isAffiliate} />
              </div>
              <p style={{ fontSize: "var(--fs-caption)", color: "var(--tx2)", marginBottom: 8, fontFamily: "var(--fn)" }}>{c.title || "클론"}</p>
              {quote ? (
                <p
                  style={{
                    fontSize: "var(--fs-lead)",
                    color: "var(--tx2)",
                    lineHeight: 1.55,
                    marginBottom: 10,
                    fontStyle: "italic",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  &quot;{quote}&quot;
                </p>
              ) : null}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>{(c.tags || []).map((t) => <Tg key={t} label={t} />)}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: "var(--fs-sm)", color: "var(--tx3)", fontFamily: "var(--mo)" }}>
                <span style={{ color: "var(--go)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <StarIcon style={{ width: 16, height: 16 }} />
                {c.rating}
              </span>
                <span>{c.docs ? `${c.docs}개 자료` : "자료 준비 중"}</span>
                <span style={{ color: "var(--cy)" }}>{c.priceLabel}</span>
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "row" : "column",
              flexWrap: "wrap",
              gap: 8,
              flexShrink: 0,
              width: isMobile ? "100%" : 118,
              paddingTop: isMobile ? 4 : 0,
              borderTop: isMobile ? "1px solid var(--br)" : "none",
              marginTop: isMobile ? 14 : 0,
              paddingLeft: isMobile ? 0 : 0,
            }}
          >
            {actions}
          </div>
        </div>
      </div>
    </Cd>
  );
}

export default function Market() {
  const navigate = useNavigate();
  const { isMobile } = useWindowSize();
  const { subscribed, setSubscribed, setActiveClone, freeUsed, surveyDone } = useAppState();
  const [filter, setFilter] = useState("전체");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");
  const [noSupabase, setNoSupabase] = useState(false);

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
          setList(rows);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered =
    filter === "전체"
      ? list
      : list.filter((c) => {
          if (c.cat === filter) return true;
          return (c.tags || []).some((t) => t.includes(filter) || filter.includes(t));
        });
  const featured = list.filter((c) => c.featured);

  const startChat = (c) => {
    setActiveClone(c);
    navigate(`/chat/${c.id}`);
  };

  const openProfile = (c) => {
    navigate(`/master/${c.id}`);
  };

  const pad = {
    paddingLeft: "max(var(--page-pad-x), var(--safe-left))",
    paddingRight: "max(var(--page-pad-x), var(--safe-right))",
    paddingTop: isMobile ? 12 : 20,
    paddingBottom: "calc(32px + var(--safe-bottom))",
    background: "var(--bg)",
    minHeight: 480,
  };

  return (
    <div style={pad}>
      <div style={{ maxWidth: 880, marginLeft: "auto", marginRight: "auto", width: "100%" }}>
        <Cd style={{ padding: isMobile ? "16px 18px" : "20px 22px", marginBottom: 20, borderColor: "var(--br2)", position: "relative", overflow: "hidden" }}>
          <div
            aria-hidden
            style={{
              position: "absolute",
              right: "-10%",
              top: "-40%",
              width: "55%",
              height: "140%",
              background: "radial-gradient(circle at center, var(--cyd) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div>
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
                Market
              </p>
              <h1 style={{ fontSize: isMobile ? "var(--fs-h1-mobile)" : "var(--fs-h1)", fontWeight: 800, color: "var(--tx)", fontFamily: "var(--fn)", letterSpacing: "-0.03em", marginBottom: 6 }}>
                클론 마켓
              </h1>
              <p style={{ fontSize: "var(--fs-caption)", color: "var(--tx2)", fontFamily: "var(--fn)" }}>
                {loading ? "불러오는 중…" : noSupabase ? "연결 대기" : `${list.length}개 활성 클론`}
              </p>
            </div>
            <Bt v="gh" sz="sm">
              패스 구독
            </Bt>
          </div>
        </Cd>

        {fetchErr ? (
          <Cd style={{ padding: "14px 18px", marginBottom: 18, borderColor: "var(--err-border)", background: "var(--err-surface)" }}>
            <p style={{ color: "var(--rd)", fontSize: "var(--fs-caption)", fontFamily: "var(--fn)", lineHeight: 1.55, marginBottom: 8 }}>
              {fetchErr}
            </p>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--tx2)", fontFamily: "var(--fn)" }}>
              마켓은 로그인 없이 볼 수 있어야 합니다. RLS·anon 권한을 확인해 주세요.{" "}
              <Link to="/login" style={{ color: "var(--cy)", fontWeight: 600 }}>
                로그인
              </Link>
            </p>
          </Cd>
        ) : null}

        {noSupabase && <MarketEmpty kind="supabase" />}

        {!loading && !noSupabase && !fetchErr && list.length === 0 && <MarketEmpty kind="empty" />}

        {!loading && list.length > 0 && (
          <>
            <FeaturedStrip clones={featured} onOpen={openProfile} />

            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>
                필터
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    style={{
                      minHeight: "var(--touch-min)",
                      padding: "0 14px",
                      borderRadius: "var(--r-md)",
                      border: filter === f ? "1px solid var(--cy)" : "1px solid var(--br)",
                      background: filter === f ? "var(--cyd)" : "var(--sf2)",
                      color: filter === f ? "var(--cy)" : "var(--tx2)",
                      fontSize: "var(--fs-caption)",
                      cursor: "pointer",
                      fontFamily: "var(--fn)",
                      fontWeight: filter === f ? 700 : 500,
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <section aria-label="클론 목록">
              <h2 className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
                전체 클론
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filtered.length === 0 ? (
                  <Cd style={{ padding: 28, textAlign: "center", borderStyle: "dashed" }}>
                    <p style={{ color: "var(--tx2)", fontSize: "var(--fs-body)", fontFamily: "var(--fn)" }}>이 필터에 맞는 클론이 없습니다.</p>
                    <button
                      type="button"
                      onClick={() => setFilter("전체")}
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
                  filtered.map((c, i) => {
                    const isSub = subscribed.includes(c.id);
                    const used = freeUsed[c.id] || 0;
                    const svd = surveyDone.includes(c.id);
                    const cap = svd ? FREE_BASE + FREE_BONUS : FREE_BASE;
                    const hasFree = used < cap;
                    return (
                      <CloneListCard
                        key={c.id}
                        c={c}
                        i={i}
                        isSub={isSub}
                        hasFree={hasFree}
                        cap={cap}
                        used={used}
                        onProfile={() => openProfile(c)}
                        onChat={() => startChat(c)}
                        onSubscribe={() => {
                          setSubscribed((p) => [...p, c.id]);
                          startChat(c);
                        }}
                      />
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}

        {loading && !noSupabase && (
          <Cd style={{ padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <LoadingSpinner size={24} />
            <p style={{ color: "var(--tx3)", fontSize: "var(--fs-caption)", fontFamily: "var(--mo)" }}>마켓 불러오는 중…</p>
          </Cd>
        )}
      </div>
    </div>
  );
}
