import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

import Bt from "../common/Bt";
import LoadingSpinner from "../common/LoadingSpinner";
import { getSupabaseBrowserClient } from "../lib/supabase";

function parseAuthParams() {
  const search = new URLSearchParams(window.location.search);
  let raw = "";
  try {
    raw = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  } catch {
    raw = "";
  }
  return { search, hash: new URLSearchParams(raw) };
}

function hasCallbackPayload() {
  const { search, hash } = parseAuthParams();
  if (search.get("code")) return true;
  if (hash.get("access_token")) return true;
  const t = hash.get("type");
  if (t === "signup" || t === "email_change" || t === "recovery") return true;
  return false;
}

function readOAuthError() {
  const { search, hash } = parseAuthParams();
  const code = search.get("error_code") || hash.get("error_code") || search.get("error") || hash.get("error");
  let description = search.get("error_description") || hash.get("error_description") || "";
  if (description) {
    try {
      description = decodeURIComponent(description.replace(/\+/g, " "));
    } catch {
      /* keep raw */
    }
  }
  if (!code && !description) return null;
  return { code, description };
}

function isExpiredLike(err) {
  const s = `${err?.code || ""} ${err?.description || ""}`.toLowerCase();
  return /expired|otp_expired|access_denied|invalid|used|not_found|flow_state/i.test(s);
}

export default function Verified() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [detail, setDetail] = useState("");
  const doneRef = useRef(false);

  const navigateMy = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    try {
      window.history.replaceState({}, "", "/signup/verified");
    } catch {
      /* ignore */
    }
    navigate("/my/profile", { replace: true });
  };

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setStatus("no_config");
      return;
    }

    let unsub = () => {};
    let timeoutId;
    let cancelled = false;

    const finishSuccess = (kind) => {
      if (doneRef.current || cancelled) return;
      setStatus(kind === "already" ? "already_verified" : "success");
      setTimeout(navigateMy, kind === "already" ? 1400 : 600);
    };

    const tryConfirmedSession = (session, preferFresh) => {
      if (!session?.user?.email_confirmed_at) return false;
      const fresh = preferFresh || hasCallbackPayload();
      finishSuccess(fresh ? "fresh" : "already");
      return true;
    };

    const oauthErr = readOAuthError();
    if (oauthErr) {
      setStatus(isExpiredLike(oauthErr) ? "expired" : "error");
      setDetail(oauthErr.description || oauthErr.code || "");
      return;
    }

    (async () => {
      const { search } = parseAuthParams();
      const code = search.get("code");

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (cancelled) return;
        if (error) {
          setStatus(isExpiredLike({ description: error.message }) ? "expired" : "error");
          setDetail(error.message);
          return;
        }
        if (tryConfirmedSession(data.session, true)) return;
      }

      const { data: { session: s0 } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (tryConfirmedSession(s0, hasCallbackPayload())) return;

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled || doneRef.current) return;
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
          tryConfirmedSession(session, event === "SIGNED_IN" || hasCallbackPayload());
        }
      });
      unsub = () => subscription.unsubscribe();

      timeoutId = window.setTimeout(async () => {
        if (cancelled || doneRef.current) return;
        const { data: { session: s1 } } = await supabase.auth.getSession();
        if (cancelled || doneRef.current) return;
        if (tryConfirmedSession(s1, hasCallbackPayload())) return;
        if (hasCallbackPayload()) {
          setStatus("expired");
          setDetail(
            "인증 링크가 만료되었거나 이미 사용되었습니다. 다시 로그인하거나 인증 메일을 재요청하세요."
          );
        } else {
          setStatus("needs_link");
        }
      }, 10000);
    })();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      unsub();
    };
  }, [navigate]);

  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: 520,
          padding: 24,
          maxWidth: 440,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <LoadingSpinner size={28} />
        <p style={{ color: "var(--tx2)", fontSize: 14, textAlign: "center", lineHeight: 1.6 }}>
          이메일 인증을 처리하는 중입니다…
        </p>
      </div>
    );
  }

  if (status === "no_config") {
    return (
      <div style={{ minHeight: 520, padding: 24, maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: "var(--tx2)", fontSize: 14, marginBottom: 20 }}>Supabase가 설정되지 않았습니다.</p>
        <Link to="/login" style={{ color: "var(--cy)" }}>
          로그인
        </Link>
      </div>
    );
  }

  if (status === "success" || status === "already_verified") {
    return (
      <div style={{ minHeight: 520, padding: 24, maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 12 }}>AUTH</div>
        <div style={{ lineHeight: 1, marginBottom: 14 }} aria-hidden>
          <CheckCircleIcon style={{ width: 24, height: 24, color: "var(--gn)" }} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
          {status === "already_verified" ? "이미 인증된 계정입니다" : "이메일 인증이 완료되었습니다"}
        </h1>
        <p style={{ color: "var(--tx2)", lineHeight: 1.7, fontSize: 13, marginBottom: 24 }}>
          {status === "already_verified"
            ? "로그인된 상태입니다. 마이페이지로 이동합니다."
            : "잠시 후 마이페이지로 이동합니다."}
        </p>
        <Bt v="pr" on={navigateMy}>
          마이페이지로
        </Bt>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div style={{ minHeight: 520, padding: 24, maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "var(--rd)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 12 }}>AUTH</div>
        <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 14 }} aria-hidden>
          ⏱
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>링크를 사용할 수 없습니다</h1>
        <p style={{ color: "var(--tx2)", lineHeight: 1.7, fontSize: 13, marginBottom: 20 }}>
          {detail || "인증 링크가 만료되었거나 이미 사용되었습니다. 새 인증 메일을 받거나 로그인해 보세요."}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "stretch" }}>
          <Bt v="pr" on={() => navigate("/login", { replace: true })}>
            로그인
          </Bt>
          <Bt v="gh" on={() => navigate("/signup", { replace: true })}>
            다시 가입하기
          </Bt>
        </div>
      </div>
    );
  }

  if (status === "needs_link") {
    return (
      <div style={{ minHeight: 520, padding: 24, maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>인증 링크로 접속해 주세요</h1>
        <p style={{ color: "var(--tx2)", lineHeight: 1.7, fontSize: 13, marginBottom: 24 }}>
          가입 시 받은 이메일의 확인 링크를 눌러 주세요. 이미 인증했다면 로그인할 수 있습니다.
        </p>
        <Bt v="pr" on={() => navigate("/login", { replace: true })}>
          로그인
        </Bt>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 520, padding: 24, maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "var(--rd)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 12 }}>AUTH</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>인증 처리 실패</h1>
      <p style={{ color: "var(--tx2)", lineHeight: 1.7, fontSize: 13, marginBottom: 24 }}>{detail || "알 수 없는 오류가 발생했습니다."}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "stretch" }}>
        <Bt v="pr" on={() => navigate("/login", { replace: true })}>
          로그인
        </Bt>
        <Bt v="gh" on={() => navigate("/", { replace: true })}>
          홈으로
        </Bt>
      </div>
    </div>
  );
}
