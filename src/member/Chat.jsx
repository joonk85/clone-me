import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  BoltIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  DocumentIcon,
  LightBulbIcon,
  LinkIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  StarIcon,
  VideoCameraIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import Av from "../common/Av";
import MasterBadges from "../common/MasterBadges";
import Bt from "../common/Bt";
import Pb from "../common/Pb";
import { useAuth } from "../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import {
  fetchMessagesForConversation,
} from "../lib/supabaseQueries";
import { useAppRail } from "../contexts/AppRailContext";
import { usePageTitle } from "../contexts/PageTitleContext";
import { FREE_BASE, FREE_BONUS, MONTHLY_CAP } from "../lib/tokens";
import { buildClonePriceLabel } from "../lib/tokenPricing";
import "./chat-claude.css";

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
    return { type: "srt", text: `${name}${ts}` };
  }
  const page = s.page_number != null ? ` · ${s.page_number}페이지` : "";
  const sec = s.section_title ? ` · ${s.section_title}` : "";
  return { type: "doc", text: `${name}${page}${sec}` };
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setPageTitle } = usePageTitle();
  const { refreshRail } = useAppRail();
  const convFromUrl = searchParams.get("conv") || "";
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
  const [infoOpen, setInfoOpen] = useState(false);
  const [convLoading, setConvLoading] = useState(false);
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
    setPageTitle(clone.name || "대화");
    return () => setPageTitle(null);
  }, [clone.name, setPageTitle]);

  useEffect(() => {
    if (!isDbClone || !user || !convFromUrl) {
      setConvLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setConvLoading(true);
      const sb = getSupabaseBrowserClient();
      if (!sb) {
        setConvLoading(false);
        return;
      }
      const { data: convRow } = await sb
        .from("conversations")
        .select("id, clone_id, user_id")
        .eq("id", convFromUrl)
        .maybeSingle();
      if (cancelled) return;
      if (!convRow || convRow.user_id !== user.id) {
        setSearchParams({}, { replace: true });
        setConvLoading(false);
        return;
      }
      if (convRow.clone_id !== clone.id) {
        navigate(`/chat/${convRow.clone_id}?conv=${convFromUrl}`, { replace: true });
        return;
      }
      const { messages } = await fetchMessagesForConversation(sb, convFromUrl);
      if (cancelled) return;
      setConversationId(convRow.id);
      const mapped = (messages || []).map((m) => ({
        r: m.role === "user" ? "u" : "a",
        t: m.content || "",
        sources: [],
      }));
      if (mapped.length === 0) {
        setMsgs([
          {
            r: "a",
            t: clone.welcomeMsg || `안녕하세요! ${clone.name}의 AI 클론입니다.`,
            sources: [],
          },
        ]);
      } else {
        setMsgs(mapped);
        setSurveyStep("done");
      }
      setConvLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [convFromUrl, clone.id, clone.welcomeMsg, clone.name, isDbClone, user, navigate, setSearchParams]);

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
    setMsgs((p) => [...p, { r: "a", t: "설문 감사합니다! 무료 대화 +5회가 추가됐습니다.", sources: [] }]);
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
      refreshRail();
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
    refreshRail,
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
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
                <ChatBubbleLeftRightIcon style={{ width: 20, height: 20, color: "var(--cy)" }} />
                잠깐, 짧은 질문이 있어요!
              </div>
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
                      {qi < qs.length - 1 ? "다음" : (<><CheckIcon style={{ width: 16, height: 16, display: "inline-block", verticalAlign: "middle", marginRight: 4 }} />완료</>)}
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
    <div
      style={{
        position: "relative",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        width: "100%",
      }}
    >
      <div
        className="chat-claude-root"
        style={{
          ["--chat-accent"]: themeColor,
        }}
      >
        <div className="chat-claude-main">
          <header className="chat-claude-header" style={{ position: "relative", paddingTop: 4 }}>
            <div className="chat-claude-header-accent" />
            <div className="chat-claude-header-inner">
              <Av char={clone.av || "?"} color={themeColor} size={36} />
              <div className="chat-claude-header-meta">
                <div className="chat-claude-header-row">
                  <span className="chat-claude-header-name">{clone.name}</span>
                  <span style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mo)" }}>AI CLONE</span>
                  <MasterBadges verified={clone.isVerified ?? clone.featured} affiliate={clone.isAffiliate} />
                </div>
                <div className="chat-claude-header-sub">{clone.title || clone.subtitle || ""}</div>
              </div>
              {isSub && (
                <div className="chat-claude-quota">
                  <div>
                    이번달 {monthly}/{MONTHLY_CAP}
                  </div>
                  <Pb val={monthly} max={MONTHLY_CAP} c={themeColor} />
                </div>
              )}
              {!isSub && (
                <div
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: "var(--am-surface)",
                    fontSize: 10,
                    color: "var(--am)",
                    fontFamily: "var(--mo)",
                  }}
                >
                  체험 {rem}회
                </div>
              )}
              <button type="button" className="chat-claude-info-btn" onClick={() => setInfoOpen(true)} aria-label="클론 정보">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </button>
            </div>
          </header>

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
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <LightBulbIcon style={{ width: 16, height: 16 }} />
                무료 체험 {rem}회 남았습니다
              </span>
              <Bt v="pr" sz="sm">
                {clone.priceLabel || buildClonePriceLabel(clone.token_price ?? 1)}
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
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <BoltIcon style={{ width: 16, height: 16 }} />
                마지막 무료 체험 1회입니다
              </span>
              <Bt v="pr" sz="sm" style={{ background: "var(--am)" }}>
                지금 구독하기
              </Bt>
            </div>
          )}

          <div className="chat-claude-scroll">
            <div className="chat-claude-scroll-inner">
              {convLoading && (
                <div style={{ textAlign: "center", padding: 32, color: "var(--tx3)", fontSize: 13 }}>대화 불러오는 중…</div>
              )}
              {!convLoading &&
                msgs.map((msg, i) => (
                  <div key={i} className="chat-claude-row" data-role={msg.r === "u" ? "u" : "a"}>
                    {msg.r === "a" && <Av char={clone.av || "?"} color={themeColor} size={28} />}
                    <div className="chat-claude-bubble-wrap">
                      <div className="chat-claude-bubble">{msg.t}</div>
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
                          <CheckIcon style={{ width: 16, height: 16, display: "inline-block", verticalAlign: "middle", marginRight: 4 }} />
                          고정 답변
                        </div>
                      )}
                      {msg.r === "a" && clone.quality?.citation !== false && msg.sources?.length > 0 && (
                        <div className="chat-claude-sources">
                          <div className="chat-claude-sources-label">출처</div>
                          {msg.sources.map((s, j) => {
                            const { type, text } = formatSourceLine(s);
                            const SourceIcon = type === "srt" ? VideoCameraIcon : DocumentIcon;
                            return (
                              <div key={s.chunk_id || j} className="chat-claude-source-line" style={{ marginTop: j ? 6 : 0, display: "flex", alignItems: "center", gap: 6 }}>
                                <SourceIcon style={{ width: 16, height: 16, flexShrink: 0, color: "var(--tx2)" }} />
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
                            marginTop: 10,
                            padding: "10px 12px",
                            borderRadius: 12,
                            background: "var(--sf2)",
                            border: "1px solid var(--br2)",
                            textDecoration: "none",
                            color: "var(--chat-accent, var(--cy))",
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: "var(--fn)",
                          }}
                        >
                          <LinkIcon style={{ width: 20, height: 20, display: "inline-block", verticalAlign: "middle", marginRight: 6 }} />
                          {msg.marketing.product || "관련 링크"}
                          {msg.marketing.price ? (
                            <span style={{ fontWeight: 500, color: "var(--tx2)", marginLeft: 8 }}>{msg.marketing.price}</span>
                          ) : null}
                          <span style={{ float: "right", fontSize: 11 }}>열기 →</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              {!convLoading && load && (
                <div className="chat-claude-row" data-role="a">
                  <Av char={clone.av || "?"} color={themeColor} size={28} />
                  <div className="chat-claude-bubble-wrap">
                    <div
                      className="chat-claude-bubble"
                      style={{ display: "flex", gap: 5, alignItems: "center", padding: "14px 18px" }}
                    >
                      {[0, 1, 2].map((n) => (
                        <span
                          key={n}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "var(--chat-accent, var(--cy))",
                            animation: `d3 1.2s ${n * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {!convLoading && msgs.length >= 1 && <SurveyCard />}

              {!convLoading &&
                !isSub &&
                rem === 0 &&
                msgs.length > 1 &&
                (() => {
                  const lastBotMsg = msgs.filter((x) => x.r === "a").slice(-1)[0]?.t || "";
                  return (
                    <div style={{ animation: "chat-claude-fu 0.4s ease" }}>
                      <div style={{ position: "relative", marginBottom: 10 }}>
                        <div className="chat-claude-row" data-role="a">
                          <Av char={clone.av || "?"} color={themeColor} size={28} />
                          <div className="chat-claude-bubble-wrap">
                            <div
                              className="chat-claude-bubble"
                              style={{
                                filter: "blur(4px)",
                                userSelect: "none",
                                opacity: 0.55,
                              }}
                            >
                              {lastBotMsg.slice(0, 80)}...
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div
                            style={{
                              padding: "4px 12px",
                              borderRadius: 8,
                              background: "var(--sf3)",
                              border: "1px solid var(--br)",
                              fontSize: 11,
                              color: "var(--tx2)",
                            }}
                          >
                            <LockClosedIcon style={{ width: 16, height: 16, display: "inline-block", verticalAlign: "middle", marginRight: 6 }} />
                            구독 후 전체 답변 확인
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          border: "1px solid color-mix(in srgb, var(--chat-accent, var(--cy)) 35%, var(--br))",
                          borderRadius: 14,
                          padding: "16px",
                          background: "color-mix(in srgb, var(--chat-accent, var(--cy)) 8%, var(--sf))",
                        }}
                      >
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                          <Av char={clone.av || "?"} color={themeColor} size={32} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>이 대화를 계속하고 싶으신가요?</div>
                            <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 2 }}>{clone.name} 클론과 토큰으로 대화하기</div>
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
                            borderLeft: "2px solid var(--chat-accent, var(--cy))",
                          }}
                        >
                          <LightBulbIcon style={{ width: 16, height: 16, display: "inline-block", verticalAlign: "middle", marginRight: 6 }} />
                          토큰을 충전하면 이 주제를 더 깊이 이어갈 수 있어요.
                        </div>
                        <Bt v="pr" on={() => navigate("/my/subscription")} style={{ width: "100%", justifyContent: "center", background: "var(--chat-accent, var(--cy))" }}>
                          {clone.priceLabel || buildClonePriceLabel(clone.token_price ?? 1)} · 충전하기
                        </Bt>
                      </div>
                    </div>
                  );
                })()}

              <div ref={bot} />
            </div>
          </div>

          <div className="chat-claude-input-dock" style={{ background: "var(--sf)" }}>
            <div className="chat-claude-input-row">
              <div className="chat-claude-input-field">
                <input
                  ref={iRef}
                  value={inp}
                  onChange={(e) => setInp(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                  placeholder={canSend ? `${clone.name}에게 메시지 입력…` : "한도를 초과했습니다"}
                  disabled={!canSend}
                />
              </div>
              <button type="button" className="chat-claude-send" onClick={send} disabled={!inp.trim() || load || !canSend} aria-label="전송">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--on-cy)" }}>
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <div className="chat-claude-input-foot">
              <span style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mo)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <ShieldCheckIcon style={{ width: 16, height: 16 }} />
                학습 자료 기반 답변
              </span>
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
                <span style={{ fontSize: 10, color: "var(--gn)", fontFamily: "var(--mo)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <CheckIcon style={{ width: 16, height: 16 }} />
                  피드백 감사합니다
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {infoOpen && (
        <div
          className="chat-claude-info-modal"
          onClick={() => setInfoOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setInfoOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="클론 정보"
        >
          <div className="chat-claude-info-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Av char={clone.av || "?"} color={themeColor} size={44} />
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{clone.name}</div>
                  <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>{clone.title || clone.subtitle}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--tx3)",
                  fontSize: 22,
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: 4,
                }}
              >
                <XMarkIcon style={{ width: 20, height: 20 }} />
              </button>
            </div>
            <MasterBadges verified={clone.isVerified ?? clone.featured} affiliate={clone.isAffiliate} />
            <div style={{ marginTop: 14, fontSize: 13, color: "var(--tx2)", lineHeight: 1.65 }}>{clone.bio || clone.signature || "이 클론은 학습 자료를 바탕으로 답변합니다."}</div>
            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                borderRadius: 10,
                background: "var(--sf2)",
                border: "1px solid var(--br)",
                fontSize: 12,
                color: "var(--tx2)",
              }}
            >
              <div style={{ fontFamily: "var(--mo)", fontSize: 10, color: "var(--tx3)", marginBottom: 4 }}>이용 요금</div>
              {clone.priceLabel || buildClonePriceLabel(clone.token_price ?? 1)}
            </div>
            {isSub && (
              <div style={{ marginTop: 10, fontSize: 11, color: "var(--go)", fontFamily: "var(--mo)", display: "flex", alignItems: "center", gap: 4 }}>
                <CheckIcon style={{ width: 16, height: 16 }} />
                구독 중 · 월 {monthly}/{MONTHLY_CAP} 메시지
              </div>
            )}
          </div>
        </div>
      )}

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
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <ChatBubbleLeftRightIcon style={{ width: 20, height: 20, color: "var(--tx)" }} />
                  대화는 어떠셨나요?
                </div>
                <div style={{ fontSize: 11, color: "var(--tx2)" }}>피드백은 강사에게 직접 전달됩니다</div>
              </div>
              <button
                type="button"
                onClick={() => setFbPopup(false)}
                style={{ background: "none", border: "none", color: "var(--tx3)", cursor: "pointer", lineHeight: 1, padding: 4 }}
              >
                <XMarkIcon style={{ width: 20, height: 20 }} />
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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {fbR >= n ? (
                  <StarIconSolid style={{ width: 24, height: 24, color: "var(--go)" }} />
                ) : (
                  <StarIcon style={{ width: 24, height: 24, color: "var(--br)" }} />
                )}
                </button>
              ))}
            </div>
            {fbR > 0 && (
              <div style={{ fontSize: 11, color: "var(--tx2)", textAlign: "center", marginBottom: 8, fontFamily: "var(--mo)" }}>
                {["", "별로예요", "아쉬워요", "보통이에요", "좋아요!", "최고예요!"][fbR]}
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
