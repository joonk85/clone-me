import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Bt from "../common/Bt";
import Cd from "../common/Cd";
import Sw from "../common/Sw";
import { useAppState } from "../contexts/AppStateContext";

// 신규 클론 마법사 — ①자료 업로드 ②이름·익명·가격 ③출시 확인 후 addMyClone. 학습 파이프라인은 Phase 연동.

export default function Create() {
  const navigate = useNavigate();
  const { addMyClone } = useAppState();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [price, setPrice] = useState(22000);
  const [mktFreq, setMktFreq] = useState("medium");
  const [qs, setQs] = useState(["현재 직군과 경력은?", "가장 어려운 상황은?", "목표는 무엇인가요?"]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const fRef = useRef(null);
  const displayName = isAnon ? "익명 강사" : name;
  const slug = (displayName + subtitle).replace(/\s|·/g, "").toLowerCase() || "클론명";
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
  const STEPS = ["자료 업로드", "클론 설정", "출시"];

  const doCreate = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 1800));
    setBusy(false);
    setDone(true);
    addMyClone({
      id: "my" + Date.now(),
      name: displayName,
      subtitle,
      price,
      discount: 0,
      discountEnd: "",
      active: true,
      subs: 0,
      docs: files.length,
      v: "v1",
      color: "#63d9ff",
      av: isAnon ? "?" : name[0] || "나",
      quality: { noAnswer: true, toneStyle: true, citation: true },
      mktLinks: [],
      updates: [],
      notices: [],
      isAnon,
      surveyQuestions: qs,
      mktFreq,
      ctx: `You are ${displayName}'s AI clone. ${subtitle}. Speak Korean. Only answer from uploaded materials.`,
    });
  };

  if (done)
    return (
      <div style={{ minHeight: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center", animation: "fu 0.5s ease" }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 7 }}>클론 완성!</h2>
          <p style={{ color: "var(--tx2)", marginBottom: 20, fontSize: 13, lineHeight: 1.7 }}>
            <strong style={{ color: "var(--tx)" }}>{name}</strong> 클론이 준비됐습니다.
          </p>
          <Cd style={{ padding: "10px 14px", marginBottom: 10, borderColor: "var(--br2)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ flex: 1, fontFamily: "var(--mo)", fontSize: 11, color: "var(--cy)" }}>clone.me/@{slug}</span>
            <Bt v="sf" sz="sm">
              복사
            </Bt>
          </Cd>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginBottom: 16 }}>
            {[
              ["💬 카카오", "#FEE500", "#000"],
              ["📷 인스타", "#E1306C", "#fff"],
              ["🔗 복사", "var(--sf2)", "var(--tx)"],
            ].map(([l, bg, fg], i) => (
              <button
                key={i}
                type="button"
                style={{
                  padding: "9px 4px",
                  borderRadius: 9,
                  border: "1px solid var(--br)",
                  background: bg,
                  color: fg,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--fn)",
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <Bt v="pr" on={() => navigate("/dashboard")}>
              내 클론 목록 →
            </Bt>
            <Bt v="gh" on={() => navigate("/")}>
              홈으로
            </Bt>
          </div>
        </div>
      </div>
    );

  return (
    <div style={{ minHeight: 600, padding: "18px 18px 40px" }}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ display: "flex", marginBottom: 24 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", height: 2, background: step > i ? "var(--cy)" : "var(--br)" }} />
              <div style={{ fontSize: 10, fontFamily: "var(--mo)", color: step === i + 1 ? "var(--cy)" : step > i + 1 ? "var(--gn)" : "var(--tx3)" }}>
                {step > i + 1 ? "✓" : ""}
                {s}
              </div>
            </div>
          ))}
        </div>

        {/* 1단계: 학습 파일 */}
        {step === 1 && (
          <div style={{ animation: "fu 0.3s ease" }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 5 }}>자료를 올려주세요</h2>
            <p style={{ color: "var(--tx2)", marginBottom: 12, fontSize: 12 }}>
              자료가 다양할수록 더 나답게 대화합니다. 누적 학습 방식으로 언제든 추가 가능합니다.
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
                onChange={(e) => setFiles((p) => [...p, ...[...e.target.files].map((f) => ({ n: f.name, s: (f.size / 1024 / 1024).toFixed(1) + " MB" }))])}
              />
              <div style={{ fontSize: 20, marginBottom: 6 }}>📂</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>드래그 또는 클릭</div>
              <div style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)" }}>PDF · DOCX · TXT · SRT</div>
            </div>
            <div style={{ fontSize: 11, color: "var(--gn)", fontFamily: "var(--mo)", marginBottom: files.length ? 10 : 0, opacity: 0.85 }}>🔐 AES-256 암호화 저장</div>
            {files.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "6px 10px", background: "var(--sf)", border: "1px solid var(--br)", borderRadius: 8 }}>
                    <span style={{ fontSize: 12 }}>📄</span>
                    <span style={{ flex: 1, fontSize: 12 }}>{f.n}</span>
                    <span style={{ fontSize: 10, color: "var(--gn)", fontFamily: "var(--mo)" }}>🔐</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Bt v="pr" on={() => setStep(2)} dis={files.length === 0}>
                다음 →
              </Bt>
            </div>
          </div>
        )}

        {/* 2단계: 프로필·가격 */}
        {step === 2 && (
          <div style={{ animation: "fu 0.3s ease" }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 14 }}>클론을 설정하세요</h2>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "11px 13px",
                background: "var(--sf2)",
                borderRadius: 9,
                border: `1px solid ${isAnon ? "var(--am)" : "var(--br)"}`,
                marginBottom: 12,
                transition: "border-color 0.2s",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>익명으로 등록하기</div>
                <div style={{ fontSize: 11, color: "var(--tx3)" }}>
                  구매자에게 강사 이름 대신 <span style={{ color: "var(--am)" }}>"익명 강사"</span>로 표시됩니다
                </div>
              </div>
              <Sw on={isAnon} onChange={(v) => setIsAnon(v)} />
            </div>

            {!isAnon && (
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)", display: "block", marginBottom: 4 }}>강사 이름</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="김민준" style={IS} />
              </div>
            )}
            {isAnon && (
              <div style={{ padding: "9px 12px", background: "var(--am-muted)", border: "1px solid var(--am-line)", borderRadius: 8, marginBottom: 10, fontSize: 11, color: "var(--am)" }}>
                ℹ️ 마켓에서 "익명 강사"로 표시됩니다. 클론 부제와 전문 분야는 그대로 노출됩니다.
              </div>
            )}

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)", display: "block", marginBottom: 4 }}>클론 부제 (타겟/특징)</label>
              <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="B2B 영업 핵심 전략" style={IS} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)", display: "block", marginBottom: 4 }}>월 구독료</label>
              <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} step={1000} min={5000} style={{ ...IS, fontFamily: "var(--mo)" }} />
              <div style={{ fontSize: 11, color: "var(--gn)", marginTop: 3, fontFamily: "var(--mo)" }}>구독자 결제 금액: ₩{price.toLocaleString()}/월</div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Bt v="gh" on={() => setStep(1)}>
                ←
              </Bt>
              <Bt v="pr" on={() => setStep(3)} dis={!isAnon && !name}>
                다음 →
              </Bt>
            </div>
          </div>
        )}

        {/* 3단계: 출시 */}
        {step === 3 && (
          <div style={{ animation: "fu 0.3s ease" }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 6 }}>🎉 준비됐습니다!</h2>
            <p style={{ color: "var(--tx2)", marginBottom: 16, fontSize: 13, lineHeight: 1.8 }}>
              지금 바로 출시할 수 있습니다.
              <br />
              <span style={{ color: "var(--cy)" }}>홍보 설정, 설문 설계는 출시 후 대시보드에서 언제든 추가할 수 있어요.</span>
            </p>

            <Cd style={{ padding: "14px 16px", marginBottom: 14, borderColor: "var(--br2)" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--cyd)",
                    border: "1px solid var(--br2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--cy)",
                    flexShrink: 0,
                  }}
                >
                  {isAnon ? "?" : name[0] || "나"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{displayName}</div>
                  <div style={{ fontSize: 11, color: "var(--tx2)" }}>{subtitle || "클론 부제 미설정"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--cy)" }}>₩{price.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mo)" }}>/월</div>
                </div>
              </div>
              <div style={{ marginTop: 10, padding: "7px 10px", background: "var(--sf2)", borderRadius: 7, fontSize: 11, color: "var(--tx2)", display: "flex", gap: 12 }}>
                <span>📄 {files.length}개 파일</span>
                {isAnon && <span style={{ color: "var(--am)" }}>👤 익명 등록</span>}
              </div>
            </Cd>

            <div style={{ padding: "11px 13px", background: "var(--sf2)", borderRadius: 10, marginBottom: 14, fontSize: 11, color: "var(--tx2)", lineHeight: 1.9 }}>
              <div style={{ fontWeight: 700, color: "var(--tx)", marginBottom: 5 }}>출시 후 대시보드에서 할 수 있는 것</div>
              {["홍보 설정 — 대화 중 강의 자동 언급 빈도", "설문 설계 — 구독자 정보 수집 질문 커스텀", "Notion 연동 — 자료 자동 동기화", "마케팅 링크 — 주제별 강의 연결"].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  <span style={{ color: "var(--tx3)" }}>○</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Bt v="gh" on={() => setStep(2)}>
                ←
              </Bt>
              <Bt v="pr" on={doCreate} dis={busy}>
                {busy ? (
                  <>
                    <span style={{ width: 12, height: 12, border: "2px solid rgba(0,0,0,.3)", borderTopColor: "#000", borderRadius: "50%", display: "inline-block", animation: "sp 0.8s linear infinite" }} />
                    생성 중...
                  </>
                ) : (
                  "🎉 클론 출시하기"
                )}
              </Bt>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

