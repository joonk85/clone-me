import { useCallback, useEffect, useRef, useState } from "react";

import Av from "../common/Av";
import MasterBadges from "../common/MasterBadges";
import Bt from "../common/Bt";
import Pb from "../common/Pb";
import { useAuth } from "../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { FREE_BASE, FREE_BONUS, MONTHLY_CAP } from "../lib/tokens";

function pickMarketingLink(userMsg, answer, links, freq) {
  if (!links?.length) return null;
  const u = `${userMsg} ${answer}`.toLowerCase();
  for (const L of links) {
    const topics = (L.topic || "").split(/[,，]/).map((s) => s.trim()).filter(Boolean);
    for (const t of topics) {
      if (t.length >= 2 && u.includes(t.toLowerCase())) {
        return { url: L.url, product: L.product, price: L.price };
      }
    }
    const prod = (L.product || "").trim();
    if (prod.length >= 2 && u.includes(prod.toLowerCase())) {
      return { url: L.url, product: L.product, price: L.price };
    }
  }
  const p = { low: 0.05, medium: 0.14, high: 0.33 }[freq] || 0.14;
  if (Math.random() < p) {
    const withUrl = links.filter((x) => x.url && String(x.url).startsWith("http"));
    const pool = withUrl.length ? withUrl : links;
    const L = pool[Math.floor(Math.random() * pool.length)];
    if (L?.url) return { url: L.url, product: L.product, price: L.price };
  }
  return null;
}

function formatSourceLine(s) {
  const ft = (s.file_type || "").toUpperCase();
  const name = s.file_name || "자료";
  if (ft === "SRT") {
    const ts = s.timestamp_start ? ` · ${s.timestamp_start}${s.timestamp_end ? `–${s.timestamp_end}` : ""}` : "";
    return { icon: "📺", text: `${name}${ts}` };
  }
  const page = s.page_number != null ? ` · ${s.page_number}페이지` : "";
  const sec = s.section_title ? ` · ${s.section_title}` : "";
  return { icon: "📄", text: `${name}${page}${sec}` };
}

export default function Chat({
  clone,
  subscribed,
  freeUsed,
  setFreeUsed,
  surveyDone,
  setSurveyDone,
  isDbClone = false,
}) {
  const { user } = useAuth();
  const themeColor = clone.color || "#63d9ff";

  const isSub = subscribed.includes(clone.id);
  const svd = surveyDone.includes(clone.id);
  const cap = svd ? FREE_BASE + FREE_BONUS : FREE_BASE;

  const [monthly, setMonthly] = useState(isSub ? 47 : 0);
  const [msgs, setMsgs] = useState([
    {
      r: "a",
      t: clone.welcomeMsg || `안녕하세요! ${clone.name}의 AI 클론입니다.`,
      sources: [],
    },
  ]);
  const [inp, setInp] = useState("");
  const [load, setLoad] = useState(false);
  const [fbPopup, setFbPopup] = useState(false);
  const [fbR, setFbR] = useState(0);
  const [fbT, setFbT] = useState("");
  const [fbDone, setFbDone] = useState(false);
  const [surveyStep, setSurveyStep] = useState(svd ? "done" : "intro");
  const [surveyGender, setSurveyGender] = useState("");
  const [surveyAge, setSurveyAge] = useState("");
  const [surveyJob, setSurveyJob] = useState("");
  const qs = clone.surveyQuestions || [];
  const [surveyAns, setSurveyAns] = useState(qs.map(() => ""));
  const [conversationId, setConversationId] = useState(null);
  const [marketingLinks, setMarketingLinks] = useState([]);
  const bot = useRef(null);
  const iRef = useRef(null);

  const used = freeUsed[clone.id] || 0;
  const canSend = isSub ? monthly < MONTHLY_CAP + 50 : used < cap;
  const rem = cap - used;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isDbClone) {
        const prods = clone.products || [];
        const fc = clone.links?.fc || clone.links?.sub || "";
        const list = prods
          .map((p) => ({
            topic: p.topic || "",
            product: p.name || "",
            url: fc || "",
            price: p.price || "",
          }))
          .filter((x) => x.product);
        if (!cancelled) setMarketingLinks(list);
        return;
      }
      const sb = getSupabaseBrowserClient();
      if (!sb) return;
      const { data } = await sb.from("marketing_links").select("topic, product, url, price").eq("clone_id", clone.id);
      if (!cancelled) setMarketingLinks(data || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [clone.id, isDbClone, clone.products, clone.links]);

  useEffect(() => {
    bot.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    const userMsgs = msgs.filter((m) => m.r === "u").length;
    if (userMsgs === 3 && !fbDone && !fbPopup) {
      setFbPopup(true);
    }
  }, [msgs, fbDone, fbPopup]);

  const completeSurvey = () => {
    setSurveyDone((p) => [...p, clone.id]);
    setSurveyStep("done");
    setMsgs((p) => [...p, { r: "a", t: "설문 감사합니다! 🎉 무료 대화 +5회가 추가됐습니다.", sources: [] }]);
  };

  const send = useCallback(async () => {
    if (!inp.trim() || load || !canSend) return;
    const m = inp.trim();
    setInp("");
    if (!isSub) setFreeUsed((p) => ({ ...p, [clone.id]: (p[clone.id] || 0) + 1 }));
    else setMonthly((p) => p + 1);
    setMsgs((p) => [...p, { r: "u", t: m }]);
    setLoad(true);

    try {
      if (!isDbClone) {
        setMsgs((p) => [
          ...p,
          {
            r: "a",
            t: "이 화면은 데모 클론입니다. **마켓**에서 실제 활성 클론을 선택하면 RAG·출처 기반 답변을 받을 수 있어요.",
            sources: [],
          },
        ]);
        setLoad(false);
        return;
      }
      if (!user) {
        setMsgs((p) => [
          ...p,
          {
            r: "a",
            t: "대화 저장과 RAG 답변을 위해 로그인해 주세요. 상단에서 로그인 후 다시 시도해 주세요.",
            sources: [],
          },
        ]);
        setLoad(false);
        return;
      }

      const sb = getSupabaseBrowserClient();
      const { data: sess } = await sb.auth.getSession();
      const token = sess?.session?.access_token;
      if (!token) {
        setMsgs((p) => [...p, { r: "a", t: "세션이 만료되었습니다. 다시 로그인해 주세요.", sources: [] }]);
        setLoad(false);
        return;
      }

      const hist = msgs
        .filter((x) => x.r === "u" || x.r === "a")
        .map((x) => ({ role: x.r === "u" ? "user" : "assistant", content: x.t }));
      const apiMessages = [...hist, { role: "user", content: m }];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cloneId: clone.id,
          conversationId,
          messages: apiMessages,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsgs((p) => [
          ...p,
          {
            r: "a",
            t: d.error || d.detail || "잠시 후 다시 시도해 주세요.",
            sources: [],
          },
        ]);
        setLoad(false);
        return;
      }

      if (d.conversationId) setConversationId(d.conversationId);
      const answer = d.answer || "답변을 가져오지 못했습니다.";
      const sources = Array.isArray(d.sources) ? d.sources : [];
      const marketing = pickMarketingLink(m, answer, marketingLinks, clone.mkt_freq || "medium");

      setMsgs((p) => [...p, { r: "a", t: answer, sources, marketing, fromFixed: d.fromFixedAnswer }]);
    } catch {
      setMsgs((p) => [...p, { r: "a", t: "연결에 문제가 있습니다.", sources: [] }]);
    } finally {
      setLoad(false);
      setTimeout(() => iRef.current?.focus(), 100);
    }
  }, [
    inp,
    load,
    canSend,
    isSub,
    clone,
    msgs,
    setFreeUsed,
    monthly,
    setMonthly,
    isDbClone,
    user,
    conversationId,
    marketingLinks,
  ]);

  const IS = {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid var(--br)",
    borderRadius: 8,
    background: "var(--sf3)",
    color: "var(--tx)",
    fontSize: 12,
    outline: "none",
    fontFamily: "var(--fn)",
  };

  const SurveyCard = () => {
    if (surveyStep === "done") return null;
    return (
      <div style={{ display: "flex", gap: 8, animation: "fu 0.3s ease" }}>
        <Av char={clone.av || "?"} color={themeColor} size={25} />
        <div
          style={{
            flex: 1,
            background: "var(--sf)",
            border: "1px solid var(--br2)",
            borderRadius: 12,
            borderTopLeftRadius: 3,
            padding: "13px 15px",
            maxWidth: "82%",
          }}
        >
          {surveyStep === "intro" && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 5 }}>잠깐, 짧은 질문이 있어요! 🙋</div>
              <p style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.7, marginBottom: 10 }}>
                1~2분이면 충분하고, <span style={{ color: "var(--cy)", fontWeight: 600 }}>완료하면 대화 +5회</span>!
              </p>
              <div style={{ display: "flex", gap: 7 }}>
                <Bt v="pr" sz="sm" on={() => setSurveyStep("basic")}>
                  시작 (+5회)
                </Bt>
                <Bt v="gh" sz="sm" on={completeSurvey}>
                  건너뛰기
                </Bt>
              </div>
            </>
          )}
          {surveyStep === "basic" && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cy)", marginBottom: 9 }}>기본 정보 (익명)</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {["남성", "여성", "비공개"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSurveyGender(g)}
                    style={{
                      flex: 1,
                      padding: "6px",
                      borderRadius: 7,
                      border: `1px solid ${surveyGender === g ? "var(--cy)" : "var(--br)"}`,
                      background: surveyGender === g ? "var(--cyd)" : "var(--sf2)",
                      color: surveyGender === g ? "var(--cy)" : "var(--tx2)",
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "var(--fn)",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {["10대", "20대", "30대", "40대", "50대+"].map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setSurveyAge(a)}
                    style={{
                      padding: "5px 9px",
                      borderRadius: 7,
                      border: `1px solid ${surveyAge === a ? "var(--cy)" : "var(--br)"}`,
                      background: surveyAge === a ? "var(--cyd)" : "var(--sf2)",
                      color: surveyAge === a ? "var(--cy)" : "var(--tx2)",
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "var(--fn)",
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <input value={surveyJob} onChange={(e) => setSurveyJob(e.target.value)} placeholder="직군 (선택)" style={{ ...IS, marginBottom: 9 }} />
              <div style={{ display: "flex", gap: 6 }}>
                <Bt v="pr" sz="sm" dis={!surveyGender || !surveyAge} on={() => (qs.length > 0 ? setSurveyStep("q0") : completeSurvey())}>
                  다음 →
                </Bt>
                <Bt v="gh" sz="sm" on={completeSurvey}>
                  건너뛰기
                </Bt>
              </div>
            </>
          )}
          {surveyStep.startsWith("q") &&
            (() => {
              const qi = parseInt(surveyStep.replace("q", ""), 10);
              return (
                <>
                  <div style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", marginBottom: 7 }}>
                    {qi + 1}/{qs.length}
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 9 }}>{qs[qi]}</p>
                  <textarea
                    value={surveyAns[qi]}
                    onChange={(e) => setSurveyAns((p) => {
                      const n = [...p];
                      n[qi] = e.target.value;
                      return n;
                    })}
                    placeholder="자유롭게..."
                    style={{ ...IS, resize: "none", height: 60, lineHeight: 1.5, marginBottom: 9 }}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <Bt v="pr" sz="sm" dis={!surveyAns[qi]} on={() => (qi < qs.length - 1 ? setSurveyStep(`q${qi + 1}`) : completeSurvey())}>
                      {qi < qs.length - 1 ? "다음" : "완료 ✓"}
                    </Bt>
                    <Bt v="gh" sz="sm" on={() => (qi > 0 ? setSurveyStep(`q${qi - 1}`) : setSurveyStep("basic"))}>
                      ←
                    </Bt>
                  </div>
                </>
              );
            })()}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 660, background: "var(--bg)" }}>
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--br)",
          background: "var(--sf)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <Av char={clone.av || "?"} color={themeColor} size={30} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span>
              {clone.name}{" "}
              <span style={{ fontSize: 9, color: "var(--tx3)", fontFamily: "var(--mo)" }}>AI CLONE</span>
            </span>
            <MasterBadges verified={clone.isVerified ?? clone.featured} affiliate={clone.isAffiliate} />
          </div>
          <div style={{ fontSize: 11, color: "var(--tx2)" }}>{clone.title || clone.subtitle || ""}</div>
        </div>
        {isSub && (
          <div style={{ textAlign: "right", minWidth: 110 }}>
            <div
              style={{
                fontSize: 10,
                color: "var(--tx2)",
                marginBottom: 2,
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--mo)",
              }}
            >
              <span>이번달</span>
              <span>
                {monthly}/{MONTHLY_CAP}
              </span>
            </div>
            <Pb val={monthly} max={MONTHLY_CAP} c={themeColor} />
          </div>
        )}
        {!isSub && (
          <div
            style={{
              padding: "2px 8px",
              borderRadius: 5,
              background: "var(--am-surface)",
              fontSize: 10,
              color: "var(--am)",
              fontFamily: "var(--mo)",
            }}
          >
            체험 {rem}회
          </div>
        )}
      </div>

      {!isSub && rem === 2 && (
        <div
          style={{
            padding: "7px 16px",
            background: "var(--cyg)",
            borderBottom: "1px solid var(--br2)",
            fontSize: 11,
            color: "var(--cy)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span>💡 무료 체험 {rem}회 남았습니다</span>
          <Bt v="pr" sz="sm">
            ₩{(clone.price || 19000).toLocaleString()}/월 구독
          </Bt>
        </div>
      )}
      {!isSub && rem === 1 && (
        <div
          style={{
            padding: "7px 16px",
            background: "var(--am-muted)",
            borderBottom: "1px solid var(--am-line)",
            fontSize: 11,
            color: "var(--am)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span>⚡ 마지막 무료 체험 1회입니다</span>
          <Bt v="pr" sz="sm" style={{ background: "var(--am)" }}>
            지금 구독하기
          </Bt>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                flexDirection: msg.r === "u" ? "row-reverse" : "row",
                animation: "fu 0.2s ease",
              }}
            >
              {msg.r === "a" && <Av char={clone.av || "?"} color={themeColor} size={24} />}
              <div style={{ maxWidth: "74%" }}>
                <div
                  style={{
                    padding: "9px 13px",
                    borderRadius: 12,
                    background: msg.r === "u" ? "var(--cyd)" : "var(--sf)",
                    color: "var(--tx)",
                    border: msg.r === "u" ? "1px solid var(--br2)" : "1px solid var(--br)",
                    fontSize: 13,
                    lineHeight: 1.7,
                    borderTopRightRadius: msg.r === "u" ? 3 : 12,
                    borderTopLeftRadius: msg.r === "a" ? 3 : 12,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.t}
                </div>
                {msg.r === "a" && msg.fromFixed && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--go)",
                      fontFamily: "var(--mo)",
                      marginTop: 6,
                      letterSpacing: "0.04em",
                    }}
                  >
                    ✓ 고정 답변
                  </div>
                )}
                {msg.r === "a" && clone.quality?.citation !== false && msg.sources?.length > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: "var(--cyg)",
                      border: "1px solid var(--br2)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: "var(--cy)",
                        fontFamily: "var(--mo)",
                        letterSpacing: "0.08em",
                        marginBottom: 6,
                      }}
                    >
                      출처
                    </div>
                    {msg.sources.map((s, j) => {
                      const { icon, text } = formatSourceLine(s);
                      return (
                        <div
                          key={s.chunk_id || j}
                          style={{
                            fontSize: 10,
                            color: "var(--tx2)",
                            fontFamily: "var(--mo)",
                            lineHeight: 1.5,
                            marginTop: j ? 4 : 0,
                          }}
                        >
                          <span style={{ marginRight: 4 }}>{icon}</span>
                          {text}
                          {s.similarity != null && (
                            <span style={{ color: "var(--tx3)", marginLeft: 6 }}>
                              ({Math.round(Number(s.similarity) * 100)}%)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {msg.r === "a" && msg.marketing?.url && (
                  <a
                    href={msg.marketing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      marginTop: 8,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "var(--sf2)",
                      border: "1px solid var(--br2)",
                      textDecoration: "none",
                      color: "var(--cy)",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "var(--fn)",
                      transition: "background 0.15s",
                    }}
                  >
                    🔗 {msg.marketing.product || "관련 링크"}
                    {msg.marketing.price ? (
                      <span style={{ fontWeight: 500, color: "var(--tx2)", marginLeft: 8 }}>{msg.marketing.price}</span>
                    ) : null}
                    <span style={{ float: "right", fontSize: 11 }}>열기 →</span>
                  </a>
                )}
              </div>
            </div>
          ))}
          {load && (
            <div style={{ display: "flex", gap: 8 }}>
              <Av char={clone.av || "?"} color={themeColor} size={24} />
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  borderTopLeftRadius: 3,
                  background: "var(--sf)",
                  border: "1px solid var(--br)",
                  display: "flex",
                  gap: 4,
                  alignItems: "center",
                }}
              >
                {[0, 1, 2].map((n) => (
                  <div
                    key={n}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: themeColor,
                      animation: `d3 1.2s ${n * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          {msgs.length >= 1 && <SurveyCard />}

          {!isSub &&
            rem === 0 &&
            msgs.length > 1 &&
            (() => {
              const lastBotMsg = msgs.filter((x) => x.r === "a").slice(-1)[0]?.t || "";
              return (
                <div style={{ animation: "fu 0.4s ease" }}>
                  <div style={{ position: "relative", marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Av char={clone.av || "?"} color={themeColor} size={24} />
                      <div
                        style={{
                          maxWidth: "74%",
                          padding: "9px 13px",
                          borderRadius: 12,
                          borderTopLeftRadius: 3,
                          background: "var(--sf)",
                          border: "1px solid var(--br)",
                          fontSize: 13,
                          lineHeight: 1.7,
                          filter: "blur(4px)",
                          userSelect: "none",
                          color: "var(--tx)",
                          opacity: 0.6,
                        }}
                      >
                        {lastBotMsg.slice(0, 80)}...
                      </div>
                    </div>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div
                        style={{
                          padding: "3px 10px",
                          borderRadius: 7,
                          background: "var(--sf3)",
                          border: "1px solid var(--br)",
                          fontSize: 11,
                          color: "var(--tx2)",
                        }}
                      >
                        🔒 구독 후 전체 답변 확인
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      border: `1px solid ${themeColor}44`,
                      borderRadius: 13,
                      padding: "16px 16px",
                      background: `${themeColor}08`,
                      animation: "fu 0.3s ease",
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                      <Av char={clone.av || "?"} color={themeColor} size={32} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>이 대화를 계속하고 싶으신가요?</div>
                        <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 1 }}>{clone.name} 클론과 무제한 대화하기</div>
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "9px 11px",
                        background: "var(--sf2)",
                        borderRadius: 8,
                        marginBottom: 10,
                        fontSize: 11,
                        color: "var(--tx2)",
                        lineHeight: 1.6,
                        borderLeft: `2px solid ${themeColor}`,
                      }}
                    >
                      💡 구독하면 — 이 주제를 더 깊이 파고들 수 있습니다.
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Bt v="pr" on={() => {}} style={{ flex: 1, justifyContent: "center", background: themeColor }}>
                        ₩{(clone.price || 19000).toLocaleString()}/월 구독하기
                      </Bt>
                    </div>
                  </div>
                </div>
              );
            })()}

          <div ref={bot} />
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--br)", background: "var(--sf)", padding: "10px 14px", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8, maxWidth: 600, margin: "0 auto" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              background: "var(--sf2)",
              border: "1px solid var(--br)",
              borderRadius: 11,
              padding: "0 12px",
            }}
          >
            <input
              ref={iRef}
              value={inp}
              onChange={(e) => setInp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder={canSend ? `${clone.name}에게 질문하세요...` : "한도를 초과했습니다"}
              disabled={!canSend}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--tx)",
                fontSize: 13,
                padding: "11px 0",
                fontFamily: "var(--fn)",
              }}
            />
          </div>
          <button
            type="button"
            onClick={send}
            disabled={!inp.trim() || load || !canSend}
            style={{
              width: 40,
              height: 40,
              borderRadius: 9,
              background: themeColor,
              border: "none",
              cursor: inp.trim() && !load && canSend ? "pointer" : "not-allowed",
              opacity: inp.trim() && !load && canSend ? 1 : 0.35,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: "var(--on-cy)" }}>
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div
          style={{
            maxWidth: 600,
            margin: "4px auto 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mo)" }}>🔐 학습 자료 기반 답변</span>
          {!fbDone && (
            <button
              type="button"
              onClick={() => setFbPopup(true)}
              style={{
                fontSize: 10,
                color: "var(--tx3)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--mo)",
                textDecoration: "underline",
              }}
            >
              피드백 남기기
            </button>
          )}
          {fbDone && (
            <span style={{ fontSize: 10, color: "var(--gn)", fontFamily: "var(--mo)" }}>✓ 피드백 감사합니다</span>
          )}
        </div>
      </div>

      {fbPopup && !fbDone && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            background: "var(--overlay-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setFbPopup(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 380,
              background: "var(--sf)",
              border: "1px solid var(--br2)",
              borderRadius: 16,
              padding: "20px 20px",
              animation: "fu 0.25s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>대화는 어떠셨나요? 💬</div>
                <div style={{ fontSize: 11, color: "var(--tx2)" }}>피드백은 강사에게 직접 전달됩니다</div>
              </div>
              <button
                type="button"
                onClick={() => setFbPopup(false)}
                style={{ background: "none", border: "none", color: "var(--tx3)", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 4 }}
              >
                ×
              </button>
            </div>
            <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFbR(n)}
                  style={{
                    flex: 1,
                    padding: "10px 4px",
                    borderRadius: 9,
                    border: `1px solid ${fbR >= n ? "var(--go)" : "var(--br)"}`,
                    background: fbR >= n ? "var(--tg-go-bg)" : "var(--sf2)",
                    fontSize: 20,
                    cursor: "pointer",
                    transition: "all 0.1s",
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            {fbR > 0 && (
              <div style={{ fontSize: 11, color: "var(--tx2)", textAlign: "center", marginBottom: 8, fontFamily: "var(--mo)" }}>
                {["", "별로예요", "아쉬워요", "보통이에요", "좋아요!", "최고예요! 🎉"][fbR]}
              </div>
            )}
            <textarea
              value={fbT}
              onChange={(e) => setFbT(e.target.value)}
              placeholder="어떤 점이 좋았나요? (선택)"
              style={{
                width: "100%",
                padding: "9px 11px",
                border: "1px solid var(--br)",
                borderRadius: 9,
                background: "var(--sf2)",
                color: "var(--tx)",
                fontSize: 12,
                outline: "none",
                fontFamily: "var(--fn)",
                resize: "none",
                height: 68,
                lineHeight: 1.5,
                marginBottom: 10,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <Bt v="pr" dis={fbR === 0} on={() => { setFbDone(true); setFbPopup(false); }} style={{ flex: 1, justifyContent: "center" }}>
                피드백 제출
              </Bt>
              <Bt v="gh" on={() => setFbPopup(false)}>
                나중에
              </Bt>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
