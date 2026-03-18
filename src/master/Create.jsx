import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Av from "../common/Av";
import Bt from "../common/Bt";
import Cd from "../common/Cd";
import Sw from "../common/Sw";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMasterForUser } from "../lib/supabaseQueries";

const COLOR_PRESETS = ["#63d9ff", "#c4b5fd", "#4fffb0", "#ffb347", "#ff4f6d", "#ffc832", "#b794ff", "#e8e8f0"];

// 신규 클론 — 자료(선택) → 이름·테마색·토큰단가 → Supabase 저장 + 대시보드 연동

export default function Create() {
  const navigate = useNavigate();
  const { addMyClone, setActiveMyClone } = useAppState();
  const { user, supabaseConfigured } = useAuth();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [tokenPrice, setTokenPrice] = useState(1);
  const [cloneColor, setCloneColor] = useState("#63d9ff");
  const [mktFreq] = useState("medium");
  const [qs] = useState(["현재 직군과 경력은?", "가장 어려운 상황은?", "목표는 무엇인가요?"]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [err, setErr] = useState("");
  const [noMaster, setNoMaster] = useState(false);
  const fRef = useRef(null);

  const displayName = isAnon ? "익명 강사" : name;
  const slug = (displayName + subtitle).replace(/\s|·/g, "").toLowerCase() || "clone";

  const IS = {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid var(--br)",
    borderRadius: 9,
    fontSize: 13,
    background: "var(--sf2)",
    color: "var(--tx)",
    fontFamily: "var(--fn)",
    outline: "none",
  };

  const STEPS = ["자료", "클론 설정", "출시"];

  const checkMaster = useCallback(async () => {
    if (!supabaseConfigured) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) return;
    const { row } = await fetchMasterForUser(supabase);
    setNoMaster(!row);
  }, [user?.id, supabaseConfigured]);

  useEffect(() => {
    checkMaster();
  }, [checkMaster]);

  const doCreate = async () => {
    setErr("");
    const supabase = getSupabaseBrowserClient();
    const ctx = `You are ${displayName}'s AI clone. ${subtitle || ""}. Speak Korean. Answer from uploaded materials when available.`;

    if (supabaseConfigured && supabase && user?.id) {
      const { row: master } = await fetchMasterForUser(supabase);
      if (!master) {
        setErr("마스터 프로필이 필요합니다.");
        setNoMaster(true);
        return;
      }
      setBusy(true);
      const tp = Math.min(99, Math.max(1, parseInt(tokenPrice, 10) || 1));
      const { data, error } = await supabase
        .from("clones")
        .insert({
          master_id: master.id,
          name: displayName.trim() || "내 클론",
          subtitle: subtitle.trim() || null,
          color: cloneColor,
          av: isAnon ? "?" : (name.trim()[0] || "나"),
          token_price: tp,
          is_anonymous: isAnon,
          mkt_freq: mktFreq,
          ctx_prompt: ctx,
          welcome_msg: null,
          is_active: false,
          version: "v1",
          quality_no_answer: true,
          quality_tone_style: true,
          quality_citation: true,
        })
        .select("id")
        .single();

      setBusy(false);
      if (error) {
        setErr(error.message || "저장에 실패했습니다.");
        return;
      }
      const id = data.id;
      setCreatedId(id);

      const appClone = {
        id,
        name: displayName.trim() || "내 클론",
        subtitle: subtitle.trim() || "클론",
        price: 0,
        token_price: tp,
        discount: 0,
        discountEnd: "",
        active: false,
        subs: 0,
        docs: files.length,
        v: "v1",
        color: cloneColor,
        av: isAnon ? "?" : name.trim()[0] || "나",
        quality: { noAnswer: true, toneStyle: true, citation: true },
        mktLinks: [],
        updates: [],
        notices: [],
        files: [],
        trainingStatus: "idle",
        isAnon,
        surveyQuestions: qs,
        mktFreq,
        ctx,
      };
      addMyClone(appClone);
      setActiveMyClone(appClone);
      setDone(true);
      return;
    }

    // Supabase 없을 때 로컬만 (데모)
    setBusy(true);
    await new Promise((r) => setTimeout(r, 800));
    const id = "my" + Date.now();
    setCreatedId(id);
    addMyClone({
      id,
      name: displayName,
      subtitle,
      price: 0,
      token_price: Math.min(99, Math.max(1, parseInt(tokenPrice, 10) || 1)),
      discount: 0,
      discountEnd: "",
      active: false,
      subs: 0,
      docs: files.length,
      v: "v1",
      color: cloneColor,
      av: isAnon ? "?" : name[0] || "나",
      quality: { noAnswer: true, toneStyle: true, citation: true },
      mktLinks: [],
      updates: [],
      notices: [],
      files: [],
      trainingStatus: "idle",
      isAnon,
      surveyQuestions: qs,
      mktFreq,
      ctx,
    });
    setBusy(false);
    setDone(true);
  };

  if (noMaster && supabaseConfigured) {
    return (
      <div style={{ minHeight: 400, padding: 24, maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>마스터 프로필이 필요해요</h2>
        <p style={{ color: "var(--tx2)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>클론을 만들려면 먼저 마스터로 등록해 주세요.</p>
        <Bt v="pr" on={() => navigate("/master-register")}>
          마스터 등록하기
        </Bt>
        <div style={{ marginTop: 16 }}>
          <Link to="/dashboard" style={{ color: "var(--tx2)", fontSize: 13 }}>
            ← 대시보드
          </Link>
        </div>
      </div>
    );
  }

  if (done)
    return (
      <div style={{ minHeight: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center", animation: "fu 0.5s ease" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              margin: "0 auto 16px",
              border: `3px solid ${cloneColor}`,
              boxShadow: `0 0 24px ${cloneColor}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Av char={isAnon ? "?" : name[0] || "나"} color={cloneColor} size={48} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 7 }}>클론이 만들어졌어요</h2>
          <p style={{ color: "var(--tx2)", marginBottom: 12, fontSize: 13, lineHeight: 1.7 }}>
            <strong style={{ color: "var(--tx)" }}>{displayName}</strong> · 테마{" "}
            <span style={{ color: cloneColor, fontFamily: "var(--mo)" }}>{cloneColor}</span> · 토큰 {tokenPrice}/턴
          </p>
          {supabaseConfigured && (
            <p style={{ color: "var(--tx3)", fontSize: 12, marginBottom: 20 }}>대시보드에서 자료 업로드 후 마켓에 활성화할 수 있습니다.</p>
          )}
          <Cd style={{ padding: "10px 14px", marginBottom: 10, borderColor: "var(--br2)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ flex: 1, fontFamily: "var(--mo)", fontSize: 11, color: "var(--cy)" }}>@{slug.slice(0, 24)}</span>
          </Cd>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <Bt v="pr" on={() => navigate(createdId ? `/dashboard/${createdId}` : "/dashboard")}>
              대시보드로 →
            </Bt>
            <Bt v="gh" on={() => navigate("/dashboard")}>
              목록
            </Bt>
          </div>
        </div>
      </div>
    );

  return (
    <div style={{ minHeight: 600, padding: "18px 18px 40px" }}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        {err ? <p style={{ color: "#f66", fontSize: 13, marginBottom: 12 }}>{err}</p> : null}
        <div style={{ display: "flex", marginBottom: 24 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", height: 2, background: step > i ? "var(--cy)" : "var(--br)" }} />
              <div
                style={{
                  fontSize: 10,
                  fontFamily: "var(--mo)",
                  color: step === i + 1 ? "var(--cy)" : step > i + 1 ? "var(--gn)" : "var(--tx3)",
                }}
              >
                {step > i + 1 ? "✓ " : ""}
                {s}
              </div>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div style={{ animation: "fu 0.3s ease" }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 5 }}>학습 자료 (선택)</h2>
            <p style={{ color: "var(--tx2)", marginBottom: 12, fontSize: 12 }}>
              나중에 대시보드에서 PDF·DOCX 등을 올릴 수 있어요. 지금은 건너뛸 수 있습니다.
            </p>
            <div
              style={{
                border: "2px dashed var(--br)",
                borderRadius: 12,
                padding: "30px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: "var(--sf)",
                marginBottom: 9,
                transition: "all 0.2s",
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                setFiles((p) => [...p, ...[...e.dataTransfer.files].map((f) => ({ n: f.name, s: (f.size / 1024 / 1024).toFixed(1) + " MB" }))]);
              }}
              onClick={() => fRef.current?.click()}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--cy)";
                e.currentTarget.style.background = "var(--cyg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--br)";
                e.currentTarget.style.background = "var(--sf)";
              }}
            >
              <input
                ref={fRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={(e) =>
                  setFiles((p) => [...p, ...[...e.target.files].map((f) => ({ n: f.name, s: (f.size / 1024 / 1024).toFixed(1) + " MB" }))])
                }
              />
              <div style={{ fontSize: 20, marginBottom: 6 }}>📂</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>드래그 또는 클릭</div>
              <div style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)" }}>PDF · DOCX · TXT · SRT</div>
            </div>
            {files.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "6px 10px", background: "var(--sf)", border: "1px solid var(--br)", borderRadius: 8 }}>
                    <span style={{ fontSize: 12 }}>📄</span>
                    <span style={{ flex: 1, fontSize: 12 }}>{f.n}</span>
                    <span style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mo)" }}>{f.s}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Bt v="pr" on={() => setStep(2)}>
                다음 →{files.length ? ` (${files.length}개 파일)` : ""}
              </Bt>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: "fu 0.3s ease" }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 14 }}>클론 설정</h2>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "11px 13px",
                background: "var(--sf2)",
                borderRadius: 9,
                border: `1px solid ${isAnon ? "var(--am)" : "var(--br)"}`,
                marginBottom: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>익명으로 등록</div>
                <div style={{ fontSize: 11, color: "var(--tx3)" }}>마켓에 &quot;익명 강사&quot;로 표시</div>
              </div>
              <Sw on={isAnon} onChange={(v) => setIsAnon(v)} />
            </div>

            {!isAnon && (
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)", display: "block", marginBottom: 4 }}>클론 이름</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 영업 코칭 클론" style={IS} />
              </div>
            )}
            {isAnon && (
              <div style={{ padding: "9px 12px", background: "var(--sf2)", border: "1px solid var(--br)", borderRadius: 8, marginBottom: 10, fontSize: 11, color: "var(--tx2)" }}>
                마켓에는 익명으로 표시됩니다.
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)", display: "block", marginBottom: 4 }}>부제 / 한 줄 설명</label>
              <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="B2B 영업 핵심 전략" style={IS} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)", display: "block", marginBottom: 8 }}>테마 컬러</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 10 }}>
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`색 ${c}`}
                    onClick={() => setCloneColor(c)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: c,
                      border: cloneColor === c ? "3px solid var(--tx)" : "2px solid var(--br)",
                      cursor: "pointer",
                      boxShadow: cloneColor === c ? `0 0 12px ${c}88` : "none",
                    }}
                  />
                ))}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    color: "var(--tx2)",
                    cursor: "pointer",
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--br)",
                    background: "var(--sf2)",
                  }}
                >
                  <span style={{ fontFamily: "var(--mo)" }}>직접</span>
                  <input type="color" value={cloneColor} onChange={(e) => setCloneColor(e.target.value)} style={{ width: 40, height: 32, border: "none", cursor: "pointer", borderRadius: 6 }} />
                  <code style={{ fontSize: 11, color: "var(--cy)" }}>{cloneColor}</code>
                </label>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Av char={isAnon ? "?" : name.trim()[0] || "?"} color={cloneColor} size={52} />
                <span style={{ fontSize: 12, color: "var(--tx2)" }}>미리보기</span>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)", display: "block", marginBottom: 4 }}>
                토큰 소모 (턴당)
              </label>
              <input
                type="number"
                value={tokenPrice}
                onChange={(e) => setTokenPrice(Number(e.target.value))}
                min={1}
                max={99}
                style={{ ...IS, fontFamily: "var(--mo)", maxWidth: 120 }}
              />
              <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 4 }}>멤버가 대화할 때 턴당 차감되는 토큰 수 (1~99)</div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Bt v="gh" on={() => setStep(1)}>
                ←
              </Bt>
              <Bt v="pr" on={() => setStep(3)} dis={!isAnon && !name.trim()}>
                다음 →
              </Bt>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: "fu 0.3s ease" }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 6 }}>확인 후 만들기</h2>
            <p style={{ color: "var(--tx2)", marginBottom: 16, fontSize: 13, lineHeight: 1.8 }}>
              대시보드에서 자료·고정답변·활성화를 이어서 설정하세요.
            </p>

            <Cd style={{ padding: "14px 16px", marginBottom: 14, borderColor: cloneColor + "55" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ borderRadius: "50%", padding: 2, border: `2px solid ${cloneColor}` }}>
                  <Av char={isAnon ? "?" : name[0] || "나"} color={cloneColor} size={44} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{displayName}</div>
                  <div style={{ fontSize: 11, color: "var(--tx2)" }}>{subtitle || "부제 없음"}</div>
                  <div style={{ fontSize: 11, color: "var(--cy)", fontFamily: "var(--mo)", marginTop: 4 }}>
                    💎 {tokenPrice} 토큰/턴 · {cloneColor}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10, padding: "7px 10px", background: "var(--sf2)", borderRadius: 7, fontSize: 11, color: "var(--tx2)" }}>
                📄 선택 파일 {files.length}개
                {isAnon && <span style={{ color: "var(--am)", marginLeft: 8 }}>익명</span>}
              </div>
            </Cd>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Bt v="gh" on={() => setStep(2)}>
                ←
              </Bt>
              <Bt v="pr" on={doCreate} dis={busy}>
                {busy ? "저장 중…" : "클론 만들기"}
              </Bt>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
