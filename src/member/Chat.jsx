import { useCallback, useEffect, useRef, useState } from "react";

import Av from "../common/Av";
import Bt from "../common/Bt";
import Pb from "../common/Pb";
import { FREE_BASE, FREE_BONUS, MONTHLY_CAP } from "../lib/tokens";

export default function Chat({ clone, subscribed, freeUsed, setFreeUsed, surveyDone, setSurveyDone }) {
  // 비구독: 무료 캡(+설문 시 보너스) · 구독: 월간 바(MONTHLY_CAP) · 메시지 POST /api/chat · 3턴 후 피드백 모달
  const themeColor = clone.color || "#63d9ff";

  const isSub = subscribed.includes(clone.id);
  const svd = surveyDone.includes(clone.id);
  const cap = svd ? FREE_BASE + FREE_BONUS : FREE_BASE;

  const [monthly, setMonthly] = useState(isSub ? 47 : 0);
  const [msgs, setMsgs] = useState([
    {
      r: "a",
      t: clone.welcomeMsg || `안녕하세요! ${clone.name}의 AI 클론입니다. ${clone.title || clone.subtitle || ""} 분야에서 궁금한 점을 물어보세요!`,
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
  const bot = useRef(null);
  const iRef = useRef(null);

  const used = freeUsed[clone.id] || 0;
  const canSend = isSub ? monthly < MONTHLY_CAP + 50 : used < cap;
  const rem = cap - used;

  useEffect(() => {
    bot.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // 사용자 메시지 3회 이후 피드백 모달 자동 오픈(1회)
  useEffect(() => {
    const userMsgs = msgs.filter((m) => m.r === "u").length;
    if (userMsgs === 3 && !fbDone && !fbPopup) {
      setFbPopup(true);
    }
  }, [msgs, fbDone, fbPopup]);

  const completeSurvey = () => {
    setSurveyDone((p) => [...p, clone.id]);
    setSurveyStep("done");
    setMsgs((p) => [...p, { r: "a", t: "설문 감사합니다! 🎉 무료 대화 +5회가 추가됐습니다. 더 맞춤화된 답변을 드릴게요!" }]);
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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `${clone.ctx || "You are an AI clone. Speak Korean."}\n\nYou are ONLY ${clone.name}'s clone. Never say you are Claude or Anthropic. If outside your knowledge base say: "이 내용은 제 자료에 없어서 답변드리기 어렵습니다."`,
          messages: [...msgs.filter((x) => x.r !== "sys").slice(-10).map((x) => ({ role: x.r === "u" ? "user" : "assistant", content: x.t })), { role: "user", content: m }],
        }),
      });
      const d = await res.json();
      setMsgs((p) => [...p, { r: "a", t: d.content?.find((b) => b.type === "text")?.text || "잠시 후 다시 시도해주세요." }]);
    } catch {
      setMsgs((p) => [...p, { r: "a", t: "연결에 문제가 있습니다. 잠시 후 다시 시도해주세요." }]);
    } finally {
      setLoad(false);
      setTimeout(() => iRef.current?.focus(), 100);
    }
  }, [inp, load, canSend, isSub, clone, msgs, setFreeUsed, monthly, setMonthly]);

  const IS = { width: "100%", padding: "8px 10px", border: "1px solid var(--br)", borderRadius: 8, background: "var(--sf3)", color: "var(--tx)", fontSize: 12, outline: "none", fontFamily: "var(--fn)" };

  const SurveyCard = () => {
    if (surveyStep === "done") return null;
    return (
      <div style={{ display: "flex", gap: 8, animation: "fu 0.3s ease" }}>
        <Av char={clone.av || "?"} color={themeColor} size={25} />
        <div style={{ flex: 1, background: "var(--sf)", border: "1px solid var(--br2)", borderRadius: 12, borderTopLeftRadius: 3, padding: "13px 15px", maxWidth: "82%" }}>
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
              const qi = parseInt(surveyStep.replace("q", ""));
              return (
                <>
                  <div style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", marginBottom: 7 }}>
                    {qi + 1}/{qs.length}
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 9 }}>{qs[qi]}</p>
                  <textarea value={surveyAns[qi]} onChange={(e) => setSurveyAns((p) => ((p = [...p]), (p[qi] = e.target.value), p))} placeholder="자유롭게..." style={{ ...IS, resize: "none", height: 60, lineHeight: 1.5, marginBottom: 9 }} />
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
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--br)", background: "var(--sf)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <Av char={clone.av || "?"} color={themeColor} size={30} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 13 }}>
            {clone.name} <span style={{ fontSize: 9, color: "var(--tx3)", fontFamily: "var(--mo)" }}>AI CLONE</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--tx2)" }}>{clone.title || clone.subtitle || ""}</div>
        </div>
        {isSub && (
          <div style={{ textAlign: "right", minWidth: 110 }}>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginBottom: 2, display: "flex", justifyContent: "space-between", fontFamily: "var(--mo)" }}>
              <span>이번달</span>
              <span>
                {monthly}/{MONTHLY_CAP}
              </span>
            </div>
            <Pb val={monthly} max={MONTHLY_CAP} c={themeColor} />
          </div>
        )}
        {!isSub && <div style={{ padding: "2px 8px", borderRadius: 5, background: "var(--am-surface)", fontSize: 10, color: "var(--am)", fontFamily: "var(--mo)" }}>체험 {rem}회</div>}
      </div>

      {!isSub && rem === 2 && (
        <div style={{ padding: "7px 16px", background: "var(--cyg)", borderBottom: "1px solid var(--br2)", fontSize: 11, color: "var(--cy)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span>💡 무료 체험 {rem}회 남았습니다</span>
          <Bt v="pr" sz="sm">
            ₩{(clone.price || 19000).toLocaleString()}/월 구독
          </Bt>
        </div>
      )}
      {!isSub && rem === 1 && (
        <div style={{ padding: "7px 16px", background: "var(--am-muted)", borderBottom: "1px solid var(--am-line)", fontSize: 11, color: "var(--am)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span>⚡ 마지막 무료 체험 1회입니다</span>
          <Bt v="pr" sz="sm" style={{ background: "var(--am)" }}>
            지금 구독하기
          </Bt>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 8, flexDirection: m.r === "u" ? "row-reverse" : "row", animation: "fu 0.2s ease" }}>
              {m.r === "a" && <Av char={clone.av || "?"} color={themeColor} size={24} />}
              <div style={{ maxWidth: "74%" }}>
                <div style={{ padding: "9px 13px", borderRadius: 12, background: m.r === "u" ? "var(--cyd)" : "var(--sf)", color: "var(--tx)", border: m.r === "u" ? "1px solid var(--br2)" : "1px solid var(--br)", fontSize: 13, lineHeight: 1.7, borderTopRightRadius: m.r === "u" ? 3 : 12, borderTopLeftRadius: m.r === "a" ? 3 : 12 }}>
                  {m.t}
                </div>
                {m.r === "a" && clone.quality?.citation && i > 0 && (
                  <div style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mo)", marginTop: 3, paddingLeft: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    <span>📄</span>
                    <span style={{ color: "var(--tx3)" }}>{clone.name}의 학습 자료 기반</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {load && (
            <div style={{ display: "flex", gap: 8 }}>
              <Av char={clone.av || "?"} color={themeColor} size={24} />
              <div style={{ padding: "10px 14px", borderRadius: 12, borderTopLeftRadius: 3, background: "var(--sf)", border: "1px solid var(--br)", display: "flex", gap: 4, alignItems: "center" }}>
                {[0, 1, 2].map((n) => (
                  <div key={n} style={{ width: 5, height: 5, borderRadius: "50%", background: themeColor, animation: `d3 1.2s ${n * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          {msgs.length >= 1 && <SurveyCard />}

          {!isSub &&
            rem === 0 &&
            msgs.length > 1 &&
            (() => {
              const lastBotMsg = msgs.filter((m) => m.r === "a").slice(-1)[0]?.t || "";
              return (
                <div style={{ animation: "fu 0.4s ease" }}>
                  <div style={{ position: "relative", marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Av char={clone.av || "?"} color={themeColor} size={24} />
                      <div style={{ maxWidth: "74%", padding: "9px 13px", borderRadius: 12, borderTopLeftRadius: 3, background: "var(--sf)", border: "1px solid var(--br)", fontSize: 13, lineHeight: 1.7, filter: "blur(4px)", userSelect: "none", color: "var(--tx)", opacity: 0.6 }}>
                        {lastBotMsg.slice(0, 80)}...
                      </div>
                    </div>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ padding: "3px 10px", borderRadius: 7, background: "var(--sf3)", border: "1px solid var(--br)", fontSize: 11, color: "var(--tx2)" }}>🔒 구독 후 전체 답변 확인</div>
                    </div>
                  </div>
                  <div style={{ border: `1px solid ${themeColor}44`, borderRadius: 13, padding: "16px 16px", background: `${themeColor}08`, animation: "fu 0.3s ease" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                      <Av char={clone.av || "?"} color={themeColor} size={32} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>이 대화를 계속하고 싶으신가요?</div>
                        <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 1 }}>{clone.name} 클론과 무제한 대화하기</div>
                      </div>
                    </div>
                    <div style={{ padding: "9px 11px", background: "var(--sf2)", borderRadius: 8, marginBottom: 10, fontSize: 11, color: "var(--tx2)", lineHeight: 1.6, borderLeft: `2px solid ${themeColor}` }}>
                      💡 구독하면 — 이 주제를 더 깊이 파고들 수 있습니다. 월 {(clone.price || 19000).toLocaleString()}원으로 매달 200회 무제한.
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Bt v="pr" on={() => {}} style={{ flex: 1, justifyContent: "center", background: themeColor }}>
                        ₩{(clone.price || 19000).toLocaleString()}/월 구독하기
                      </Bt>
                    </div>
                    <div style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mo)" }}>언제든 취소 가능 · 첫 달 무료 체험</div>
                  </div>
                </div>
              );
            })()}

          <div ref={bot} />
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--br)", background: "var(--sf)", padding: "10px 14px", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8, maxWidth: 600, margin: "0 auto" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", background: "var(--sf2)", border: "1px solid var(--br)", borderRadius: 11, padding: "0 12px" }}>
            <input
              ref={iRef}
              value={inp}
              onChange={(e) => setInp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder={canSend ? `${clone.name}에게 질문하세요...` : "한도를 초과했습니다"}
              disabled={!canSend}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--tx)", fontSize: 13, padding: "11px 0", fontFamily: "var(--fn)" }}
            />
          </div>
          <button
            onClick={send}
            disabled={!inp.trim() || load || !canSend}
            style={{ width: 40, height: 40, borderRadius: 9, background: themeColor, border: "none", cursor: inp.trim() && !load && canSend ? "pointer" : "not-allowed", opacity: inp.trim() && !load && canSend ? 1 : 0.35, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div style={{ maxWidth: 600, margin: "4px auto 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mo)" }}>🔐 암호화 문서 기반</span>
          {!fbDone && (
            <button onClick={() => setFbPopup(true)} style={{ fontSize: 10, color: "var(--tx3)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--mo)", textDecoration: "underline" }}>
              피드백 남기기
            </button>
          )}
          {fbDone && <span style={{ fontSize: 10, color: "var(--gn)", fontFamily: "var(--mo)" }}>✓ 피드백 감사합니다</span>}
        </div>
      </div>

      {fbPopup && !fbDone && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "var(--overlay-dim)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setFbPopup(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 380, background: "var(--sf)", border: "1px solid var(--br2)", borderRadius: 16, padding: "20px 20px", animation: "fu 0.25s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>대화는 어떠셨나요? 💬</div>
                <div style={{ fontSize: 11, color: "var(--tx2)" }}>피드백은 강사에게 직접 전달됩니다</div>
              </div>
              <button onClick={() => setFbPopup(false)} style={{ background: "none", border: "none", color: "var(--tx3)", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 4 }}>
                ×
              </button>
            </div>
            <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setFbR(n)} style={{ flex: 1, padding: "10px 4px", borderRadius: 9, border: `1px solid ${fbR >= n ? "var(--go)" : "var(--br)"}`, background: fbR >= n ? "var(--tg-go-bg)" : "var(--sf2)", fontSize: 20, cursor: "pointer", transition: "all 0.1s" }}>
                  ★
                </button>
              ))}
            </div>
            {fbR > 0 && <div style={{ fontSize: 11, color: "var(--tx2)", textAlign: "center", marginBottom: 8, fontFamily: "var(--mo)" }}>{["", "별로예요", "아쉬워요", "보통이에요", "좋아요!", "최고예요! 🎉"][fbR]}</div>}
            <textarea value={fbT} onChange={(e) => setFbT(e.target.value)} placeholder="어떤 점이 좋았나요? 개선할 점은? (선택)" style={{ width: "100%", padding: "9px 11px", border: "1px solid var(--br)", borderRadius: 9, background: "var(--sf2)", color: "var(--tx)", fontSize: 12, outline: "none", fontFamily: "var(--fn)", resize: "none", height: 68, lineHeight: 1.5, marginBottom: 10 }} />
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

