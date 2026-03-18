import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Bt from "../common/Bt";
import { useWindowSize } from "../hooks/useWindowSize";
import { getSupabaseBrowserClient } from "../lib/supabase";

export default function Signup() {
  const { isMobile } = useWindowSize();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

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

  const roleBtn = (active) => ({
    flex: 1,
    minHeight: "var(--touch-min)",
    padding: "10px 12px",
    borderRadius: "var(--r-md)",
    border: `1px solid ${active ? "var(--cy)" : "var(--br)"}`,
    background: active ? "var(--cyd)" : "var(--sf2)",
    color: active ? "var(--cy)" : "var(--tx2)",
    fontSize: isMobile ? "var(--fs-body)" : "var(--fs-lead)",
    fontWeight: 600,
    fontFamily: "var(--fn)",
    cursor: "pointer",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase가 설정되지 않았습니다. .env 를 확인하세요.");
      return;
    }

    setSubmitting(true);
    const origin = window.location.origin;
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${origin}/signup/verified`,
        data: { role: role === "master" ? "master" : "member" },
      },
    });
    setSubmitting(false);

    if (err) {
      setError(err.message || "가입에 실패했습니다.");
      return;
    }

    if (data.session) {
      setInfo("가입이 완료되었습니다. 온보딩으로 이동합니다.");
      setTimeout(() => navigate("/onboarding", { replace: true }), 600);
    } else {
      setInfo("가입 메일을 보냈습니다. 메일의 링크를 누르면 인증 후 마이페이지로 이동합니다. (대시보드에 /signup/verified 를 Redirect URL에 넣어 주세요.)");
    }
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
      <h1 style={{ fontSize: isMobile ? "var(--fs-h1-mobile)" : "var(--fs-h1)", fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>회원가입</h1>
      <p style={{ color: "var(--tx2)", lineHeight: 1.65, marginBottom: isMobile ? 20 : 22, fontSize: isMobile ? "var(--fs-body)" : "var(--fs-lead)" }}>
        가입 후 로그인해 사용합니다.{" "}
        <Link to="/login" style={{ color: "var(--cy)" }}>
          로그인
        </Link>
      </p>

      {error ? (
        <p style={{ color: "var(--rd)", fontSize: "var(--fs-lead)", marginBottom: 12, lineHeight: 1.5 }}>{error}</p>
      ) : null}
      {info ? (
        <p style={{ color: "var(--cy)", fontSize: "var(--fs-lead)", marginBottom: 12, lineHeight: 1.6 }}>{info}</p>
      ) : null}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: isMobile ? 16 : 14 }}>
        <div>
          <span style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--tx3)", fontFamily: "var(--mo)", marginBottom: 8 }}>가입 유형</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setRole("member")} style={roleBtn(role === "member")}>
              멤버
            </button>
            <button type="button" onClick={() => setRole("master")} style={roleBtn(role === "master")}>
              마스터
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="signup-email" style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--tx3)", fontFamily: "var(--mo)", marginBottom: 6 }}>
            이메일
          </label>
          <input id="signup-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={fieldStyle} required />
        </div>
        <div>
          <label htmlFor="signup-password" style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--tx3)", fontFamily: "var(--mo)", marginBottom: 6 }}>
            비밀번호
          </label>
          <input id="signup-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8자 이상" style={fieldStyle} required minLength={8} />
        </div>
        <div>
          <label htmlFor="signup-password2" style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--tx3)", fontFamily: "var(--mo)", marginBottom: 6 }}>
            비밀번호 확인
          </label>
          <input id="signup-password2" type="password" autoComplete="new-password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="한 번 더 입력" style={fieldStyle} required />
        </div>
        <Bt v="pr" type="submit" dis={submitting} style={{ minHeight: "var(--touch-min)", marginTop: 4 }}>
          {submitting ? "가입 중…" : "가입하기"}
        </Bt>
      </form>
    </div>
  );
}
