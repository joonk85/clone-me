import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Bt from "../common/Bt";
import { CLONES_MARKET, SESSIONS } from "../lib/mockData";
import { useAppState } from "../contexts/AppStateContext";

// 구매자 허브 — 좌측 대화 기록·구독 목록, 우측 세션 미리보기 또는 빈 상태. 마켓/채팅으로 연결.

export default function Buyer() {
  const navigate = useNavigate();
  const { subscribed, setActiveClone, freeUsed } = useAppState();
  const [tab, setTab] = useState("history");
  const [activeSession, setActiveSession] = useState(null);

  const mine = CLONES_MARKET.filter((c) => subscribed.includes(c.id));
  const sessions = SESSIONS.filter((s) => subscribed.includes(s.cid) || (freeUsed[s.cid] || 0) > 0);
  const sessionClone = activeSession ? CLONES_MARKET.find((c) => c.id === activeSession.cid) : null;
  const accent = sessionClone?.color ?? "var(--cy)";

  const handlePickSession = (s) => {
    setActiveSession(s);
    const c = CLONES_MARKET.find((x) => x.id === s.cid);
    if (c) setActiveClone(c);
  };

  const handleOpenChat = (c) => {
    setActiveClone(c);
    navigate(`/chat/${c.id}`);
  };

  const goMarket = () => navigate("/market");

  return (
    <div style={{ display: "flex", height: 660, background: "var(--bg)" }}>
      <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid var(--br)", background: "var(--sf)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 10px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 2, background: "var(--sf2)", borderRadius: 9, padding: 3, marginBottom: 9 }}>
            <button
              type="button"
              onClick={() => setTab("history")}
              style={{
                flex: 1,
                padding: "7px",
                borderRadius: 7,
                border: "none",
                background: tab === "history" ? "var(--sf)" : "transparent",
                color: tab === "history" ? "var(--tx)" : "var(--tx2)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "var(--fn)",
                fontWeight: tab === "history" ? 700 : 400,
                boxShadow: tab === "history" ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                transition: "all 0.15s",
              }}
            >
              대화 기록
            </button>
            <button
              type="button"
              onClick={() => setTab("subs")}
              style={{
                flex: 1,
                padding: "7px",
                borderRadius: 7,
                border: "none",
                background: tab === "subs" ? "var(--sf)" : "transparent",
                color: tab === "subs" ? "var(--tx)" : "var(--tx2)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "var(--fn)",
                fontWeight: tab === "subs" ? 700 : 400,
                boxShadow: tab === "subs" ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                transition: "all 0.15s",
              }}
            >
              구독 ({mine.length})
            </button>
          </div>
          <button
            type="button"
            onClick={goMarket}
            style={{
              width: "100%",
              padding: "9px",
              borderRadius: 9,
              border: "none",
              background: "var(--cy)",
              color: "#000",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--fn)",
              marginBottom: 6,
            }}
          >
            + 새 대화
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 8px" }}>
          {tab === "history" &&
            (sessions.length === 0 ? (
              <div style={{ padding: "24px 12px", textAlign: "center", fontSize: 12, color: "var(--tx3)", lineHeight: 1.8 }}>아직 대화 기록이 없습니다</div>
            ) : (
              sessions.map((s) => {
                const isActive = activeSession?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => handlePickSession(s)}
                    style={{
                      padding: "9px 10px",
                      borderRadius: 9,
                      cursor: "pointer",
                      marginBottom: 2,
                      background: isActive ? "var(--cyd)" : "transparent",
                      border: `1px solid ${isActive ? "var(--br2)" : "transparent"}`,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "var(--sf2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 4 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${s.cc}22`, border: `1px solid ${s.cc}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: s.cc, flexShrink: 0 }}>
                        {s.ca}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? "var(--cy)" : s.cc, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.cn}</span>
                      <span style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mo)", flexShrink: 0, whiteSpace: "nowrap" }}>{s.time}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--tx2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingLeft: 27, lineHeight: 1.4 }}>{s.last}</div>
                    <div style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mo)", paddingLeft: 27, marginTop: 2 }}>{s.n}개 메시지</div>
                  </div>
                );
              })
            ))}

          {tab === "subs" &&
            (mine.length === 0 ? (
              <div style={{ padding: "24px 12px", textAlign: "center", fontSize: 12, color: "var(--tx3)", lineHeight: 1.8 }}>구독한 클론이 없습니다</div>
            ) : (
              mine.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleOpenChat(c)}
                  style={{ padding: "9px 10px", borderRadius: 9, cursor: "pointer", marginBottom: 2, border: "1px solid transparent", transition: "all 0.15s" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--sf2)";
                    e.currentTarget.style.borderColor = `${c.color}33`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                >
                  <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${c.color}22`, border: `1.5px solid ${c.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: c.color, flexShrink: 0 }}>
                      {c.av}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 1 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--tx2)" }}>{c.title}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: c.color }}>₩{c.price.toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mo)" }}>/월</div>
                    </div>
                  </div>
                </div>
              ))
            ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        {activeSession ? (
          <div style={{ textAlign: "center", padding: 24, animation: "fu 0.3s ease" }}>
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: typeof accent === "string" && accent.startsWith("var(") ? "var(--cyd)" : `${accent}22`,
                  border: typeof accent === "string" && accent.startsWith("var(") ? "2px solid var(--br2)" : `2px solid ${accent}55`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 700,
                  color: accent,
                  margin: "0 auto",
                }}
              >
                {activeSession.ca}
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{activeSession.cn}</div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 4, fontFamily: "var(--mo)" }}>
              {activeSession.n}개 메시지 · {activeSession.time}
            </div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 20, maxWidth: 280, lineHeight: 1.6 }}>{activeSession.last}</div>
            <Bt v="pr" on={() => activeSession && navigate(`/chat/${activeSession.cid}`)} style={{ background: sessionClone?.color || "var(--cy)" }}>
              대화 이어하기 →
            </Bt>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "0 24px", animation: "fu 0.4s ease" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.25 }}>🎵</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>대화를 시작해보세요</div>
            <p style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.8, marginBottom: 24, maxWidth: 300 }}>
              마켓에서 전문가 클론을 구독하면
              <br />
              언제든 대화할 수 있습니다.
            </p>
            <Bt v="pr" on={() => navigate("/market")}>
              마켓플레이스 →
            </Bt>
            {mine.length > 0 && (
              <div style={{ marginTop: 24, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                {mine.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleOpenChat(c)}
                    style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${c.color}44`, background: `${c.color}0f`, cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = c.color + "88")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = c.color + "44")}
                  >
                    <div style={{ fontSize: 16, fontWeight: 700, color: c.color, marginBottom: 2 }}>{c.av}</div>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{c.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

