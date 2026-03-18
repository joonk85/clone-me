import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Av from "../common/Av";
import Bt from "../common/Bt";
import Cd from "../common/Cd";
import MasterBadges from "../common/MasterBadges";
import Tg from "../common/Tg";
import { FREE_BASE, FREE_BONUS } from "../lib/tokens";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMarketClones } from "../lib/supabaseQueries";
import { useAppState } from "../contexts/AppStateContext";

export default function Market() {
  const navigate = useNavigate();
  const { subscribed, setSubscribed, setActiveClone, freeUsed, surveyDone } = useAppState();
  const [filter, setFilter] = useState("전체");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      setFetchErr("Supabase 미설정");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { list: rows, error } = await fetchMarketClones(supabase);
      if (!cancelled) {
        setLoading(false);
        if (error) setFetchErr(error.message);
        else {
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

  return (
    <div style={{ minHeight: 600, padding: "16px 16px 40px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Cd style={{ padding: "16px 20px", marginBottom: 16, borderColor: "var(--br2)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -20, top: -20, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,217,255,0.07) 0%,transparent 70%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 4 }}>MARKET</div>
              <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 2 }}>활성 클론 마켓</div>
              <div style={{ fontSize: 12, color: "var(--tx2)" }}>
                {loading ? "불러오는 중…" : `${list.length}개 클론`}
              </div>
            </div>
            <Bt v="pr">패스 구독</Bt>
          </div>
        </Cd>

        {fetchErr ? (
          <p style={{ color: "#f66", fontSize: 13, marginBottom: 16 }}>
            {fetchErr} — <Link to="/login">로그인</Link>은 선택입니다. 마켓은 비로그인 조회 가능합니다.
          </p>
        ) : null}

        {!loading && list.length === 0 && !fetchErr ? (
          <Cd style={{ padding: 24, marginBottom: 16, textAlign: "center" }}>
            <p style={{ color: "var(--tx2)", lineHeight: 1.7, marginBottom: 12 }}>
              아직 마켓에 올라온 활성 클론이 없습니다.
              <br />
              마스터로 로그인 후 프로필을 등록하고, 클론을 만들어 <strong>활성화</strong>하면 여기에 표시됩니다.
            </p>
            <Link to="/my/master/profile" style={{ color: "var(--cy)", fontWeight: 700 }}>
              마스터 프로필 →
            </Link>
          </Cd>
        ) : null}

        {featured.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "var(--go)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 9 }}>✓ 검증된 강사</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
              {featured.map((c) => (
                <div
                  key={c.id}
                  onClick={() => openProfile(c)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && openProfile(c)}
                  style={{ background: "var(--sf)", border: `1px solid ${c.color}33`, borderRadius: 13, padding: "16px 16px", cursor: "pointer", transition: "all 0.15s", overflow: "hidden" }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                    <Av char={c.av} color={c.color} size={36} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 1 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)" }}>{c.title}</div>
                    </div>
                    <MasterBadges verified={c.isVerified} affiliate={c.isAffiliate} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: c.color, marginBottom: 8, lineHeight: 1.5, fontStyle: "italic" }}>&quot;{c.signature || c.bio}&quot;</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 9 }}>{(c.tags || []).slice(0, 3).map((t) => <Tg key={t} label={t} />)}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--br)", paddingTop: 9 }}>
                    <div style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)" }}>★ {c.rating}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: c.color }}>{c.priceLabel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {["전체", "영업", "마케팅", "교육"].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              style={{
                padding: "4px 10px",
                borderRadius: 7,
                border: filter === c ? "1px solid var(--cy)" : "1px solid var(--br)",
                background: filter === c ? "var(--cyd)" : "transparent",
                color: filter === c ? "var(--cy)" : "var(--tx2)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "var(--fn)",
                fontWeight: filter === c ? 700 : 400,
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {loading && (
            <Cd style={{ padding: 32, textAlign: "center", color: "var(--tx3)" }}>마켓 불러오는 중…</Cd>
          )}
          {!loading &&
            filtered.map((c, i) => {
              const isSub = subscribed.includes(c.id);
              const used = freeUsed[c.id] || 0;
              const svd = surveyDone.includes(c.id);
              const cap = svd ? FREE_BASE + FREE_BONUS : FREE_BASE;
              const hasFree = used < cap;
              return (
                <Cd
                  key={c.id}
                  style={{ padding: "16px 18px", animation: `fu ${0.2 + i * 0.07}s ease`, transition: "border-color 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = c.color + "44")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--br)")}
                >
                  <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                    <Av char={c.av} color={c.color} size={44} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: 800 }}>{c.name}</span>
                        <MasterBadges verified={c.isVerified} affiliate={c.isAffiliate} />
                      </div>
                      <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 6 }}>{c.title}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: c.color, marginBottom: 8, lineHeight: 1.5, fontStyle: "italic" }}>&quot;{c.signature || c.bio}&quot;</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 7 }}>{(c.tags || []).map((t) => <Tg key={t} label={t} />)}</div>
                      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)" }}>
                        <span style={{ color: "var(--go)" }}>★ {c.rating}</span>
                        <span>{c.docs ? `${c.docs}개 문서` : "문서 —"}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7, flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: c.color }}>{c.priceLabel}</div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openProfile(c);
                        }}
                        style={{ fontSize: 11, color: "var(--cy)", background: "var(--cyd)", border: "1px solid var(--br2)", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontFamily: "var(--fn)", fontWeight: 600 }}
                      >
                        프로필 보기
                      </button>
                      {isSub ? (
                        <Bt v="pr" sz="sm" on={() => startChat(c)} style={{ background: c.color }}>
                          대화하기 →
                        </Bt>
                      ) : hasFree ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                          <Bt v="sf" sz="sm" on={() => startChat(c)}>
                            🎁 무료 체험 {cap - used}회
                          </Bt>
                          <Bt
                            v="gh"
                            sz="sm"
                            on={() => {
                              setSubscribed((p) => [...p, c.id]);
                              startChat(c);
                            }}
                          >
                            구독하기
                          </Bt>
                        </div>
                      ) : (
                        <Bt
                          v="gh"
                          sz="sm"
                          on={() => {
                            setSubscribed((p) => [...p, c.id]);
                            startChat(c);
                          }}
                        >
                          구독 시작
                        </Bt>
                      )}
                    </div>
                  </div>
                </Cd>
              );
            })}
        </div>
      </div>
    </div>
  );
}
