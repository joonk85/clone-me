import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

import Av from "../common/Av";
import Bt from "../common/Bt";
import Cd from "../common/Cd";
import LoadingSpinner from "../common/LoadingSpinner";
import MasterBadges from "../common/MasterBadges";
import Tg from "../common/Tg";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMarketClones } from "../lib/supabaseQueries";
import { useWindowSize } from "../hooks/useWindowSize";

const CATEGORY_TABS = ["전체", "비즈니스", "마케팅", "개발", "디자인", "교육", "라이프스타일", "기타"];

function isImageAv(v) {
  return typeof v === "string" && /^https?:\/\//i.test(v.trim());
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
      });
    }
    const row = byMaster.get(mid);
    row.clones_count += 1;
  }
  return Array.from(byMaster.values());
}

function MasterCardAvatar({ m, size = 52 }) {
  if (isImageAv(m.first_av)) {
    return (
      <img
        src={m.first_av.trim()}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: "2px solid var(--br2)",
        }}
      />
    );
  }
  const ch = String(m.first_av || m.name || "?").trim().charAt(0);
  return <Av char={ch} color={m.first_color || "#63d9ff"} size={size} />;
}

function MasterCard({ m, onExplore }) {
  const { isMobile } = useWindowSize();
  const intro = (m.signature || m.bio || m.title || "전문가 클론과 대화해 보세요.").replace(/\s+/g, " ").trim();
  const oneLine = intro.length > 60 ? intro.slice(0, 60) + "…" : intro;

  return (
    <Cd
      style={{
        padding: isMobile ? 16 : 20,
        borderColor: "var(--br)",
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
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 12 }}>
        <MasterCardAvatar m={m} size={isMobile ? 48 : 56} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontSize: "var(--fs-h3)", fontWeight: 800, color: "var(--tx)", fontFamily: "var(--fn)", letterSpacing: "-0.02em" }}>
              {m.name}
            </h3>
            <MasterBadges verified={m.isVerified} affiliate={m.isAffiliate} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {(m.tags || []).slice(0, 3).map((t) => (
              <Tg key={t} label={t} />
            ))}
          </div>
          <p
            style={{
              fontSize: "var(--fs-caption)",
              color: "var(--tx2)",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              fontFamily: "var(--fn)",
            }}
          >
            {oneLine}
          </p>
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", marginTop: 8, fontFamily: "var(--mo)" }}>
            보유 클론 {m.clones_count}개
          </p>
        </div>
      </div>
      <Bt v="pr" sz="sm" on={() => onExplore(m)} style={{ width: "100%", minHeight: "var(--touch-min)" }}>
        클론 탐색
      </Bt>
    </Cd>
  );
}

function MarketEmpty({ kind }) {
  const navigate = useNavigate();
  if (kind === "supabase") {
    return (
      <Cd style={{ padding: "clamp(28px, 6vw, 40px)", textAlign: "center", borderStyle: "dashed", borderColor: "var(--br2)", background: "var(--cyg)" }}>
        <p style={{ color: "var(--tx)", fontSize: "var(--fs-body)", fontWeight: 700, fontFamily: "var(--fn)", marginBottom: 8 }}>Supabase 연결이 필요합니다</p>
        <p style={{ color: "var(--tx2)", fontSize: "var(--fs-lead)", lineHeight: 1.65, fontFamily: "var(--fn)", marginBottom: 20 }}>.env에 VITE 설정을 넣고 다시 시도해 주세요.</p>
        <Bt v="gh" on={() => navigate("/")}>홈으로</Bt>
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
        <Bt v="pr" on={() => navigate("/master-register")}>마스터 등록하기</Bt>
        <Bt v="gh" on={() => navigate("/")}>홈으로</Bt>
      </div>
    </Cd>
  );
}

export default function Market() {
  const navigate = useNavigate();
  const { isMobile } = useWindowSize();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("전체");
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
          setList(rows || []);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const masters = useMemo(() => groupClonesByMaster(list), [list]);

  const filtered = useMemo(() => {
    let out = masters;
    if (category !== "전체") {
      out = out.filter((m) => (m.tags || []).some((t) => String(t).includes(category) || category.includes(String(t))));
    }
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
          <div style={{ position: "relative" }}>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
              탐색
            </p>
            <h1 style={{ fontSize: isMobile ? "var(--fs-h1-mobile)" : "var(--fs-h1)", fontWeight: 800, color: "var(--tx)", fontFamily: "var(--fn)", letterSpacing: "-0.03em", marginBottom: 8 }}>
              마스터 탐색
            </h1>
            <p style={{ fontSize: "var(--fs-caption)", color: "var(--tx2)", fontFamily: "var(--fn)" }}>
              {loading ? "불러오는 중…" : noSupabase ? "연결 대기" : `${masters.length}명 마스터`}
            </p>
          </div>
        </Cd>

        {fetchErr ? (
          <Cd style={{ padding: "14px 18px", marginBottom: 18, borderColor: "var(--err-border)", background: "var(--err-surface)" }}>
            <p style={{ color: "var(--rd)", fontSize: "var(--fs-caption)", fontFamily: "var(--fn)", lineHeight: 1.55, marginBottom: 8 }}>{fetchErr}</p>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--tx2)", fontFamily: "var(--fn)" }}>
              로그인 없이 볼 수 있어야 합니다. RLS·anon 권한을 확인해 주세요. <Link to="/login" style={{ color: "var(--cy)", fontWeight: 600 }}>로그인</Link>
            </p>
          </Cd>
        ) : null}

        {noSupabase && <MarketEmpty kind="supabase" />}
        {!loading && !noSupabase && !fetchErr && masters.length === 0 && <MarketEmpty kind="empty" />}

        {!loading && masters.length > 0 && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: "var(--r-lg)",
                  border: "1px solid var(--br)",
                  background: "var(--sf2)",
                }}
              >
                <MagnifyingGlassIcon style={{ width: 20, height: 20, color: "var(--tx3)", flexShrink: 0 }} aria-hidden />
                <input
                  type="search"
                  placeholder="마스터 이름 / 분야 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: "none",
                    background: "transparent",
                    color: "var(--tx)",
                    fontSize: "var(--fs-body)",
                    fontFamily: "var(--fn)",
                    outline: "none",
                  }}
                  aria-label="마스터 이름 또는 분야로 검색"
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>
                분야
              </p>
              <div className="nav-scroll" style={{ display: "flex", gap: 8, flexWrap: "wrap", overflowX: "auto", paddingBottom: 4 }}>
                {CATEGORY_TABS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setCategory(f)}
                    style={{
                      minHeight: "var(--touch-min)",
                      padding: "0 14px",
                      borderRadius: "var(--r-md)",
                      border: category === f ? "1px solid var(--cy)" : "1px solid var(--br)",
                      background: category === f ? "var(--cyd)" : "var(--sf2)",
                      color: category === f ? "var(--cy)" : "var(--tx2)",
                      fontSize: "var(--fs-caption)",
                      cursor: "pointer",
                      fontFamily: "var(--fn)",
                      fontWeight: category === f ? 700 : 500,
                      flexShrink: 0,
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
                    onClick={() => { setCategory("전체"); setSearchQuery(""); }}
                    style={{ marginTop: 14, fontSize: "var(--fs-caption)", color: "var(--cy)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--fn)", fontWeight: 600, textDecoration: "underline" }}
                  >
                    전체 보기
                  </button>
                </Cd>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                  {filtered.map((m) => (
                    <MasterCard key={m.master_id} m={m} onExplore={openMaster} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {loading && !noSupabase && (
          <Cd style={{ padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <LoadingSpinner size={24} />
            <p style={{ color: "var(--tx3)", fontSize: "var(--fs-caption)", fontFamily: "var(--mo)" }}>불러오는 중…</p>
          </Cd>
        )}
      </div>
    </div>
  );
}