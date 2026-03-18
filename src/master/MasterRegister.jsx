import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Bt from "../common/Bt";
import { useAuth } from "../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMasterForUser, insertMaster, updateMyUserRow } from "../lib/supabaseQueries";

const field = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid var(--br)",
  borderRadius: 8,
  background: "var(--sf2)",
  color: "var(--tx)",
  fontSize: 14,
  outline: "none",
  fontFamily: "var(--fn)",
};

const steps = [
  { n: 1, t: "기본 정보" },
  { n: 2, t: "인증 선택" },
  { n: 3, t: "완료" },
];

export default function MasterRegister() {
  const navigate = useNavigate();
  const { user, supabaseConfigured } = useAuth();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [signature, setSignature] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");

  const [verifyPath, setVerifyPath] = useState("now"); // 'now' | 'later'

  const checkExisting = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) {
      setChecking(false);
      return;
    }
    const { row } = await fetchMasterForUser(supabase);
    setChecking(false);
    if (row) {
      navigate("/my/master/profile", { replace: true });
    }
  }, [user?.id, navigate]);

  useEffect(() => {
    checkExisting();
  }, [checkExisting]);

  const canStep1 = name.trim().length >= 1 && title.trim().length >= 1 && slug.trim().length >= 2;

  const handleStep1Next = (e) => {
    e.preventDefault();
    setErr("");
    const clean = slug.trim().replace(/[^a-z0-9-]/gi, "").toLowerCase();
    if (clean.length < 2) {
      setErr("URL slug는 영문·숫자·하이픈 2자 이상이어야 합니다.");
      return;
    }
    setSlug(clean);
    setStep(2);
  };

  const handleFinalize = async () => {
    setErr("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) return;

    const tags = tagsStr
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const slugClean = slug.trim().replace(/[^a-z0-9-]/gi, "").toLowerCase();

    setSubmitting(true);
    const { row, error } = await insertMaster(supabase, {
      user_id: user.id,
      name: name.trim(),
      title: title.trim(),
      signature: signature.trim() || null,
      slug: slugClean,
      bio: bio.trim() || null,
      tags: tags.length ? tags : null,
      color: "#63d9ff",
      links: {},
      status: "active",
    });

    if (error) {
      setSubmitting(false);
      if ((error.message || "").includes("unique") || error.code === "23505") {
        setErr("이미 사용 중인 slug이거나 마스터 프로필이 있습니다. 마이페이지에서 확인하세요.");
      } else {
        setErr(error.message || "등록에 실패했습니다.");
      }
      return;
    }

    const { error: uErr } = await updateMyUserRow(supabase, user.id, {
      role: "master",
      has_master_profile: true,
      updated_at: new Date().toISOString(),
    });
    setSubmitting(false);
    if (uErr) {
      setErr(`마스터 프로필은 생성되었으나 계정 역할 갱신에 실패했습니다: ${uErr.message}`);
      setStep(4);
      return;
    }

    setStep(4);
  };

  if (!supabaseConfigured) {
    return (
      <div style={{ minHeight: 400, padding: 24, maxWidth: 520, margin: "0 auto" }}>
        <p style={{ color: "var(--tx2)" }}>Supabase 설정 후 이용할 수 있습니다.</p>
      </div>
    );
  }

  if (checking) {
    return (
      <div style={{ minHeight: 400, padding: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--tx3)" }}>확인 중…</p>
      </div>
    );
  }

  /* ── 완료 화면 ── */
  if (step === 4) {
    return (
      <div style={{ minHeight: 520, padding: 24, maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>마스터 등록 완료</h1>
        <p style={{ color: "var(--tx2)", lineHeight: 1.7, marginBottom: 28, fontSize: 14 }}>
          {verifyPath === "later"
            ? "인증 서류는 마이페이지 → 인증 배지에서 제출하면 검토 후 배지가 부여됩니다."
            : "이제 첫 클론을 만들고 자료를 올리면 마켓에 노출할 수 있습니다."}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320, margin: "0 auto" }}>
          <Bt v="pr" on={() => navigate("/dashboard/create")}>
            첫 클론 만들기
          </Bt>
          <Bt v="gh" on={() => navigate("/my/master/profile")}>
            마스터 스튜디오로 이동
          </Bt>
          <Link to="/" style={{ color: "var(--tx2)", fontSize: 13, marginTop: 8 }}>
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 520, padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <div style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 10 }}>MASTER REGISTER</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>마스터 등록</h1>
      <p style={{ color: "var(--tx2)", lineHeight: 1.7, marginBottom: 20, fontSize: 13 }}>
        3단계로 마스터 프로필을 만듭니다. 완료 후 클론을 제작·활성화하면 마켓에 나갑니다.
      </p>

      {/* 스텝 인디케이터 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {steps.map((s, i) => (
          <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                background: step >= s.n ? "var(--cy)" : "var(--sf2)",
                color: step >= s.n ? "var(--on-cy)" : "var(--tx3)",
                border: step === s.n ? "2px solid var(--cy)" : "1px solid var(--br)",
              }}
            >
              {s.n}
            </div>
            <span style={{ fontSize: 12, color: step >= s.n ? "var(--tx)" : "var(--tx3)", fontWeight: step === s.n ? 700 : 400 }}>{s.t}</span>
            {i < steps.length - 1 && <span style={{ color: "var(--tx3)", margin: "0 4px" }}>→</span>}
          </div>
        ))}
      </div>

      {err ? <p style={{ color: "#f66", fontSize: 13, marginBottom: 16 }}>{err}</p> : null}

      {/* Step 1 */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>표시 이름 *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" style={field} required />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>한 줄 직함 *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="B2B 영업 코치" style={field} required />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>시그니처 문구</label>
            <input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="한 줄 메시지" style={field} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>태그 (쉼표)</label>
            <input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="영업, 코칭" style={field} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>프로필 URL (slug) *</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="hong-sales"
              style={field}
              autoComplete="off"
            />
            <p style={{ fontSize: 11, color: "var(--tx3)", marginTop: 6 }}>영문·숫자·하이픈만 사용. 마켓·프로필 주소에 쓰입니다.</p>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>소개 (선택)</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} style={{ ...field, resize: "vertical" }} placeholder="경력·전문 분야" />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Bt v="pr" type="submit" dis={!canStep1}>
              다음
            </Bt>
            <Link to="/my/become-master" style={{ alignSelf: "center", fontSize: 13, color: "var(--tx2)" }}>
              취소
            </Link>
          </div>
        </form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>인증 방식 선택</h2>
          <p style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 20, lineHeight: 1.6 }}>
            인증 배지는 선택 사항입니다. 서류 없이도 클론을 만들고 판매를 시작할 수 있습니다.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              type="button"
              onClick={() => setVerifyPath("now")}
              style={{
                textAlign: "left",
                padding: 16,
                borderRadius: 12,
                border: verifyPath === "now" ? "2px solid var(--cy)" : "1px solid var(--br)",
                background: verifyPath === "now" ? "var(--cyd)" : "var(--sf2)",
                cursor: "pointer",
                fontFamily: "var(--fn)",
                color: "var(--tx)",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 6 }}>바로 시작</div>
              <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.5 }}>인증 서류 없이 등록 완료 후 클론 제작으로 이동합니다.</div>
            </button>
            <button
              type="button"
              onClick={() => setVerifyPath("later")}
              style={{
                textAlign: "left",
                padding: 16,
                borderRadius: 12,
                border: verifyPath === "later" ? "2px solid var(--pu)" : "1px solid var(--br)",
                background: verifyPath === "later" ? "rgba(183,148,255,0.08)" : "var(--sf2)",
                cursor: "pointer",
                fontFamily: "var(--fn)",
                color: "var(--tx)",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 6 }}>인증 배지 · 나중에 제출</div>
              <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.5 }}>
                먼저 클론을 만들고, 마이페이지 → 인증 배지에서 경력·자격 서류를 올리면 검토 후 ✓ 배지가 붙습니다.
              </div>
            </button>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <Bt v="gh" on={() => setStep(1)}>
              이전
            </Bt>
            <Bt v="pr" on={() => setStep(3)}>
              다음
            </Bt>
          </div>
        </div>
      )}

      {/* Step 3 요약 & 제출 */}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>입력 내용 확인</h2>
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: "1px solid var(--br)",
              background: "var(--sf2)",
              marginBottom: 20,
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            <p>
              <strong style={{ color: "var(--tx3)" }}>이름</strong> {name.trim()}
            </p>
            <p>
              <strong style={{ color: "var(--tx3)" }}>직함</strong> {title.trim()}
            </p>
            <p>
              <strong style={{ color: "var(--tx3)" }}>URL slug</strong> {slug.replace(/[^a-z0-9-]/gi, "").toLowerCase()}
            </p>
            {signature.trim() && (
              <p>
                <strong style={{ color: "var(--tx3)" }}>시그니처</strong> {signature.trim()}
              </p>
            )}
            <p>
              <strong style={{ color: "var(--tx3)" }}>인증</strong>{" "}
              {verifyPath === "now" ? "바로 시작 (서류 없음)" : "배지는 이후 제출"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Bt v="gh" on={() => setStep(2)} dis={submitting}>
              이전
            </Bt>
            <Bt v="pr" on={handleFinalize} dis={submitting}>
              {submitting ? "등록 중…" : "등록 완료"}
            </Bt>
          </div>
        </div>
      )}
    </div>
  );
}
