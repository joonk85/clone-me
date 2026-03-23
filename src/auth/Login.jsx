import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Bt from "../common/Bt";
import { useAuth } from "../contexts/AuthContext";
import { useWindowSize } from "../hooks/useWindowSize";
import { appendSecurityLog } from "../lib/securityLocalLog";
import { getSupabaseBrowserClient } from "../lib/supabase";

export default function Login() {
  const { isMobile } = useWindowSize();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, supabaseConfigured } = useAuth();

  const from = searchParams.get("from") || "/onboarding";

  const fieldStyle = {
    width: "100%",
    minHeight: isMobile ? "var(--touch-min)" : 44,
    padding: isMobile ? "12px 14px" : "10px 12px",
    border: "1px solid var(--br)",
    borderRadius: "var(--r-md)",
    background: "var(--sf2)",
    color: "var(--tx)",
    fontSize: isMobile ? "var(--fs-input-mobile)" : "var(--fs-body)",
    outline: "none",
    fontFamily: "var(--fn)",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase가 설정되지 않았습니다. .env 를 확인하세요.");
      return;
    }
    setSubmitting(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (err) {
      appendSecurityLog({
        type: "login_failed",
        success: false,
        detail: "이메일 또는 비밀번호를 확인하세요.",
      });
      setError(err.message || "로그인에 실패했습니다.");
      return;
    }
    if (data.session?.user) {
      appendSecurityLog({ type: "login_success", success: true });
      navigate(from, { replace: true });
    }
  };

  const handleDemoLogin = () => {
    setUser({ id: "demo", email: email || "demo@clone.me" });
    navigate(from, { replace: true });
  };

  return (
    <div
      style={{
        minHeight: 520,
        padding: "var(--page-pad-y) var(--page-pad-x)",
        paddingBottom: "max(var(--page-pad-y), var(--safe-bottom))",
        maxWidth: "var(--auth-max-w)",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 10 }}>AUTH</div>
      <h1 style={{ fontSize: isMobile ? "var(--fs-h1-mobile)" : "var(--fs-h1)", fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>로그인</h1>
      <p style={{ color: "var(--tx2)", lineHeight: 1.65, marginBottom: isMobile ? 20 : 22, fontSize: isMobile ? "var(--fs-body)" : "var(--fs-lead)" }}>
        가입한 이메일로 로그인합니다.{" "}
        <Link to="/signup" style={{ color: "var(--cy)" }}>
          회원가입
        </Link>
      </p>

      {error ? (
        <p style={{ color: "var(--rd)", fontSize: "var(--fs-lead)", marginBottom: 12, lineHeight: 1.5 }}>{error}</p>
      ) : null}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: isMobile ? 16 : 14 }}>
        <div>
          <label htmlFor="login-email" style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--tx3)", fontFamily: "var(--mo)", marginBottom: 6 }}>
            이메일
          </label>
          <input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={fieldStyle} required />
        </div>
        <div>
          <label htmlFor="login-password" style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--tx3)", fontFamily: "var(--mo)", marginBottom: 6 }}>
            비밀번호
          </label>
          <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={fieldStyle} required />
        </div>
        <Bt v="pr" type="submit" dis={submitting || !supabaseConfigured} style={{ minHeight: "var(--touch-min)", marginTop: 4 }}>
          {submitting ? "로그인 중…" : supabaseConfigured ? "로그인" : "Supabase 미설정"}
        </Bt>
        {!supabaseConfigured ? (
          <Bt v="gh" on={handleDemoLogin} style={{ minHeight: "var(--touch-min)" }}>
            데모 로그인 (보호 라우트만 테스트)
          </Bt>
        ) : null}
      </form>
    </div>
  );
}
