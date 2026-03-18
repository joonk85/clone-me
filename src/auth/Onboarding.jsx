import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Bt from "../common/Bt";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { getSupabaseBrowserClient } from "../lib/supabase";

const fieldStyle = {
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

const cardBase = {
  padding: "18px 16px",
  borderRadius: 12,
  border: "1px solid var(--br)",
  background: "var(--sf2)",
  textAlign: "left",
  cursor: "pointer",
  fontFamily: "var(--fn)",
  transition: "border-color 0.15s, background 0.15s",
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, supabaseConfigured, refreshUserProfile, onboardingCompleted } = useAuth();
  const { setRole } = useAppState();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [intent, setIntent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const redirectIfDone = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) return;
    const { data } = await supabase.from("users").select("onboarding_completed, role").eq("id", user.id).maybeSingle();
    if (data?.onboarding_completed) {
      setRole(data.role === "master" ? "creator" : "buyer");
      navigate(data.role === "master" ? "/dashboard" : "/market", { replace: true });
    }
  }, [user?.id, navigate, setRole]);

  useEffect(() => {
    if (onboardingCompleted) {
      redirectIfDone();
    }
  }, [onboardingCompleted, redirectIfDone]);

  const handleNextStep = () => setStep(2);

  const handleFinish = async () => {
    if (!intent) return;
    setErr("");
    const supabase = getSupabaseBrowserClient();

    if (supabase && user?.id) {
      setSaving(true);
      const dbRole = intent === "creator" ? "master" : "member";
      const patch = {
        nickname: displayName.trim() || null,
        role: dbRole,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };
      const up = await supabase.from("users").update(patch).eq("id", user.id).select("id").maybeSingle();
      let error = up.error;
      if (!up.error && !up.data) {
        const ins = await supabase.from("users").upsert(
          {
            id: user.id,
            email: user.email || "",
            ...patch,
          },
          { onConflict: "id" }
        );
        error = ins.error;
      }
      setSaving(false);
      if (error) {
        if (error.message?.includes("onboarding_completed") || error.code === "42703") {
          setErr("DB에 onboarding_completed 컬럼이 없습니다. docs/supabase/users_onboarding_completed.sql 을 실행하세요.");
        } else {
          setErr(error.message || "저장에 실패했습니다.");
        }
        return;
      }
      await refreshUserProfile();
    }

    setRole(intent === "creator" ? "creator" : "buyer");
    navigate(intent === "creator" ? "/dashboard" : "/market", { replace: true });
  };

  const cardStyle = (active) => ({
    ...cardBase,
    border: `1px solid ${active ? "var(--cy)" : "var(--br)"}`,
    background: active ? "var(--cyd)" : "var(--sf2)",
  });

  if (!supabaseConfigured) {
    return (
      <div style={{ minHeight: 520, padding: 24, maxWidth: 480, margin: "0 auto" }}>
        <p style={{ color: "var(--tx2)" }}>Supabase 미설정 시 온보딩 저장을 건너뜁니다.</p>
        <Bt v="pr" on={() => navigate("/market", { replace: true })} style={{ marginTop: 16 }}>
          마켓으로
        </Bt>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 520, padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <div style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 10 }}>ONBOARDING</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[1, 2].map((n) => (
          <div
            key={n}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: step >= n ? "var(--cy)" : "var(--sf3)",
            }}
          />
        ))}
      </div>

      {err ? <p style={{ color: "#f66", fontSize: 13, marginBottom: 14 }}>{err}</p> : null}

      {step === 1 && (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>표시 이름</h1>
          <p style={{ color: "var(--tx2)", lineHeight: 1.7, marginBottom: 20, fontSize: 13 }}>
            서비스에서 보여질 이름입니다. <code style={{ fontSize: 11 }}>public.users.nickname</code>에 저장됩니다.
          </p>
          <label htmlFor="onb-name" style={{ display: "block", fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)", marginBottom: 6 }}>
            닉네임 (선택)
          </label>
          <input
            id="onb-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="예: 클론러_민수"
            maxLength={32}
            style={{ ...fieldStyle, marginBottom: 20 }}
          />
          <Bt v="pr" on={handleNextStep}>
            다음
          </Bt>
        </>
      )}

      {step === 2 && (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>어떻게 이용하시나요?</h1>
          <p style={{ color: "var(--tx2)", lineHeight: 1.7, marginBottom: 20, fontSize: 13 }}>
            <strong>멤버</strong>는 <code style={{ fontSize: 11 }}>role = member</code>, <strong>마스터</strong>는{" "}
            <code style={{ fontSize: 11 }}>role = master</code>로 저장됩니다.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            <button type="button" onClick={() => setIntent("buyer")} style={cardStyle(intent === "buyer")}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tx)", marginBottom: 6 }}>멤버 · 구독자</div>
              <div style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.55 }}>다른 사람의 클론을 구독하고 채팅·콘텐츠를 이용합니다.</div>
            </button>
            <button type="button" onClick={() => setIntent("creator")} style={cardStyle(intent === "creator")}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tx)", marginBottom: 6 }}>마스터 · 크리에이터</div>
              <div style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.55 }}>나만의 클론을 만들고 구독·수익을 운영합니다.</div>
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Bt v="pr" dis={!intent || saving} on={intent && !saving ? handleFinish : undefined}>
              {saving ? "저장 중…" : "시작하기"}
            </Bt>
            <Bt v="gh" on={() => setStep(1)} dis={saving}>
              이전
            </Bt>
          </div>
        </>
      )}
    </div>
  );
}
