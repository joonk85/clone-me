import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

import Bt from "../common/Bt";
import Cd from "../common/Cd";
import { EmptyState, ErrorBanner } from "../common/UiStates";
import { useAuth } from "../contexts/AuthContext";
import { useWindowSize } from "../hooks/useWindowSize";
import { appendSecurityLog, readSecurityLog } from "../lib/securityLocalLog";
import { buildLocalSessionRow, fetchAuthSessionsForUser, tryRevokeSessionById } from "../lib/authSessions";
import { getSupabaseBrowserClient } from "../lib/supabase";

const LOG_PREVIEW = 5;

function formatWhen(isoOrMs) {
  try {
    const d = typeof isoOrMs === "number" ? new Date(isoOrMs) : new Date(isoOrMs);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function logTypeLabel(type) {
  if (type === "login_success") return "로그인 성공";
  if (type === "login_failed") return "로그인 실패";
  if (type === "password_changed") return "비밀번호 변경";
  return type;
}

export default function MyAccountSecurity() {
  const { user, supabaseConfigured } = useAuth();
  const { isMobile } = useWindowSize();

  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdErr, setPwdErr] = useState("");

  const [emailNew, setEmailNew] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
  const [emailErr, setEmailErr] = useState("");

  const [sessions, setSessions] = useState([]);
  const [sessionsSource, setSessionsSource] = useState("none");
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsErr, setSessionsErr] = useState("");
  const [sessionsBusy, setSessionsBusy] = useState(false);
  const [sessionsActionMsg, setSessionsActionMsg] = useState("");

  const [securityLog, setSecurityLog] = useState([]);
  const [showFullLog, setShowFullLog] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const field = useMemo(
    () => ({
      width: "100%",
      padding: "10px 12px",
      border: "1px solid var(--br)",
      borderRadius: "var(--r-md)",
      background: "var(--sf2)",
      color: "var(--tx)",
      fontSize: isMobile ? "var(--fs-input-mobile)" : "var(--fs-body)",
      outline: "none",
      fontFamily: "var(--fn)",
    }),
    [isMobile]
  );

  const sectionTitle = {
    fontSize: "var(--fs-body)",
    fontWeight: 800,
    margin: "0 0 12px",
    fontFamily: "var(--fn)",
    color: "var(--tx)",
  };

  const loadSessions = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setSessions([]);
      setSessionsSource("none");
      setSessionsLoading(false);
      return;
    }
    setSessionsLoading(true);
    setSessionsErr("");
    try {
      const { sessions: rows, source } = await fetchAuthSessionsForUser(supabase);
      setSessions(rows);
      setSessionsSource(source);
    } catch (e) {
      setSessionsErr(e?.message || "세션을 불러오지 못했습니다.");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSessions(session ? [buildLocalSessionRow(session)] : []);
      setSessionsSource("local");
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    setSecurityLog(readSecurityLog());
  }, []);

  const submitEmail = async (e) => {
    e.preventDefault();
    setEmailErr("");
    setEmailMsg("");
    const next = emailNew.trim();
    if (!next || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {
      setEmailErr("유효한 이메일을 입력하세요.");
      return;
    }
    if (next.toLowerCase() === (user?.email || "").toLowerCase()) {
      setEmailErr("현재 이메일과 동일합니다.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setEmailBusy(true);
    const { error } = await supabase.auth.updateUser({ email: next });
    setEmailBusy(false);
    if (error) {
      setEmailErr(error.message);
      return;
    }
    setEmailMsg("확인 메일이 새 주소로 발송될 수 있습니다. 메일함과 스팸함을 확인하세요.");
    setEmailNew("");
  };

  const submitPwd = async (e) => {
    e.preventDefault();
    setPwdErr("");
    setPwdMsg("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.email) return;
    if (pwd.length < 8) {
      setPwdErr("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (pwd !== pwd2) {
      setPwdErr("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setPwdBusy(true);
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPwd,
    });
    if (authErr) {
      setPwdBusy(false);
      setPwdErr("현재 비밀번호가 올바르지 않습니다.");
      return;
    }
    const { error: updErr } = await supabase.auth.updateUser({ password: pwd });
    setPwdBusy(false);
    if (updErr) {
      setPwdErr(updErr.message);
      return;
    }
    appendSecurityLog({ type: "password_changed", success: true });
    setSecurityLog(readSecurityLog());
    setPwdMsg("비밀번호가 변경되었습니다.");
    setCurrentPwd("");
    setPwd("");
    setPwd2("");
    await loadSessions();
  };

  const onSignOutOthers = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSessionsBusy(true);
    setSessionsActionMsg("");
    setSessionsErr("");
    const { error } = await supabase.auth.signOut({ scope: "others" });
    setSessionsBusy(false);
    if (error) {
      setSessionsErr(error.message || "요청에 실패했습니다.");
      return;
    }
    setSessionsActionMsg("다른 기기의 세션이 종료되었습니다. (액세스 토큰이 남은 기기는 만료 시까지 잠시 유효할 수 있습니다.)");
    await loadSessions();
  };

  const onSessionRowLogout = async (row) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSessionsBusy(true);
    setSessionsErr("");
    setSessionsActionMsg("");
    try {
      if (row.isCurrent) {
        const ok = window.confirm("이 기기에서 로그아웃할까요?");
        if (!ok) {
          setSessionsBusy(false);
          return;
        }
        await supabase.auth.signOut({ scope: "local" });
        return;
      }
      const revoked = await tryRevokeSessionById(supabase, row.id);
      if (!revoked) {
        setSessionsErr("개별 세션 해제 API가 프로젝트에서 비활성이거나 지원되지 않습니다. 아래 «다른 기기 모두 로그아웃»을 사용하세요.");
      } else {
        setSessionsActionMsg("선택한 세션이 종료되었습니다.");
        await loadSessions();
      }
    } finally {
      setSessionsBusy(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    await new Promise((r) => setTimeout(r, 400));
    setDeleteBusy(false);
    setDeleteOpen(false);
    alert("계정 완전 삭제는 서버·법무 절차가 필요합니다. Phase 3 이후 제공 예정입니다.");
  };

  const visibleLog = showFullLog ? securityLog : securityLog.slice(0, LOG_PREVIEW);

  if (!supabaseConfigured) {
    return (
      <Cd style={{ padding: "clamp(24px,5vw,36px)", borderStyle: "dashed" }}>
        <p style={{ color: "var(--tx2)", fontFamily: "var(--fn)" }}>Supabase 설정 후 이용할 수 있습니다.</p>
      </Cd>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <p style={{ fontSize: "var(--fs-xs)", color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 8 }}>SECURITY</p>
      <h1 style={{ fontSize: "var(--fs-h2)", fontWeight: 800, margin: "0 0 8px", fontFamily: "var(--fn-title)", color: "var(--tx)" }}>Security Control</h1>
      <p style={{ color: "var(--tx2)", fontSize: "var(--fs-caption)", marginBottom: 22, lineHeight: 1.65, fontFamily: "var(--fn)" }}>
        계정 보호 및 활성 세션을 관리하세요. 이메일은 <strong style={{ color: "var(--tx)" }}>General</strong>의 계정 정보에는 표시만 되며, 변경은 아래에서 진행합니다.
      </p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={sectionTitle}>Email</h2>
        <Cd style={{ padding: "clamp(16px,3vw,22px)", borderColor: "var(--br2)" }}>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", marginBottom: 8, fontFamily: "var(--mo)" }}>현재 이메일</div>
          <div style={{ fontSize: "var(--fs-body)", fontWeight: 600, marginBottom: 14, fontFamily: "var(--fn)", color: "var(--tx)" }}>{user?.email || "—"}</div>
          <form onSubmit={submitEmail} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {emailErr ? <ErrorBanner>{emailErr}</ErrorBanner> : null}
            {emailMsg ? <p style={{ color: "var(--gn)", fontSize: "var(--fs-xs)", fontFamily: "var(--fn)" }}>{emailMsg}</p> : null}
            <label style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--mo)" }}>새 이메일</label>
            <input type="email" value={emailNew} onChange={(e) => setEmailNew(e.target.value)} style={field} autoComplete="email" />
            <Bt v="pr" type="submit" dis={emailBusy} style={{ alignSelf: "flex-start", minHeight: "var(--touch-min)" }}>
              {emailBusy ? "요청 중…" : "이메일 변경 요청"}
            </Bt>
          </form>
        </Cd>
      </section>

      {/* 1. Password */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={sectionTitle}>Password</h2>
        <Cd style={{ padding: "clamp(16px,3vw,22px)", borderColor: "var(--br2)" }}>
          <form onSubmit={submitPwd} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pwdErr ? <ErrorBanner>{pwdErr}</ErrorBanner> : null}
            {pwdMsg ? (
              <p style={{ color: "var(--gn)", fontSize: "var(--fs-xs)", fontFamily: "var(--fn)" }}>{pwdMsg}</p>
            ) : null}
            <label style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--mo)" }}>Current password</label>
            <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} style={field} autoComplete="current-password" />
            <label style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--mo)" }}>New password</label>
            <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="8+ characters" style={field} autoComplete="new-password" />
            <label style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--mo)" }}>Confirm new password</label>
            <input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} style={field} autoComplete="new-password" />
            <Bt v="pr" type="submit" dis={pwdBusy} style={{ marginTop: 4, alignSelf: "flex-start", minHeight: "var(--touch-min)" }}>
              {pwdBusy ? "…" : "Update Password"}
            </Bt>
          </form>
        </Cd>
      </section>

      {/* 2. Active Sessions */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={sectionTitle}>Active Sessions</h2>
        <Cd style={{ padding: "clamp(16px,3vw,22px)", borderColor: "var(--br2)" }}>
          {sessionsSource === "local" ? (
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--fn)", marginBottom: 14, lineHeight: 1.55 }}>
              Supabase 공개 Auth API에서 세션 목록을 가져오지 못한 경우, 현재 기기만 표시됩니다. 다른 기기는 «다른 기기 모두 로그아웃»으로 일괄 해제할 수 있습니다.
            </p>
          ) : null}
          {sessionsErr ? <ErrorBanner style={{ marginBottom: 12 }}>{sessionsErr}</ErrorBanner> : null}
          {sessionsActionMsg ? (
            <p style={{ color: "var(--gn)", fontSize: "var(--fs-xs)", fontFamily: "var(--fn)", marginBottom: 12 }}>{sessionsActionMsg}</p>
          ) : null}
          {sessionsLoading ? (
            <p style={{ color: "var(--tx3)", fontFamily: "var(--mo)", fontSize: "var(--fs-caption)" }}>불러오는 중…</p>
          ) : sessions.length === 0 ? (
            <EmptyState title="활성 세션 없음" hint="로그인 후 이 기기가 여기에 표시됩니다." />
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {sessions.map((row) => (
                <li
                  key={row.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--br)",
                    background: "var(--sf2)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800, fontSize: "var(--fs-caption)", color: "var(--tx)", fontFamily: "var(--fn)" }}>{row.device}</span>
                      {row.isCurrent ? (
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: "var(--mo)",
                            fontWeight: 800,
                            letterSpacing: "0.08em",
                            color: "var(--cy)",
                            border: "1px solid var(--cy)",
                            borderRadius: 6,
                            padding: "2px 8px",
                          }}
                        >
                          CURRENT
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--tx2)", fontFamily: "var(--fn)", marginTop: 6, lineHeight: 1.5 }}>
                      {row.browser} · {formatWhen(row.updated_at)}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={row.isCurrent ? "이 기기에서 로그아웃" : "세션 종료"}
                    disabled={sessionsBusy}
                    onClick={() => onSessionRowLogout(row)}
                    style={{
                      flexShrink: 0,
                      width: 44,
                      height: 44,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid var(--br2)",
                      borderRadius: "var(--r-md)",
                      background: "var(--sf)",
                      color: "var(--tx2)",
                      cursor: sessionsBusy ? "not-allowed" : "pointer",
                      opacity: sessionsBusy ? 0.5 : 1,
                    }}
                  >
                    <ArrowRightOnRectangleIcon style={{ width: 22, height: 22 }} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Bt
            v="gh"
            dis={sessionsBusy || sessionsLoading}
            on={onSignOutOthers}
            style={{
              width: "100%",
              marginTop: 16,
              justifyContent: "center",
              minHeight: "var(--touch-min)",
              borderColor: "var(--br2)",
              fontFamily: "var(--mo)",
              letterSpacing: "0.06em",
              fontSize: 11,
            }}
          >
            LOG OUT ALL OTHER DEVICES
          </Bt>
        </Cd>
      </section>

      {/* 3. Security Log */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={sectionTitle}>Security Log</h2>
        <Cd style={{ padding: "clamp(16px,3vw,22px)", borderColor: "var(--br2)" }}>
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--fn)", marginBottom: 14, lineHeight: 1.55 }}>
            이 브라우저에만 저장되는 요약 이력입니다. 서버 감사 로그는 추후 연동할 수 있습니다.
          </p>
          {securityLog.length === 0 ? (
            <EmptyState title="기록 없음" hint="로그인·비밀번호 변경 시 여기에 쌓입니다." />
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {visibleLog.map((entry) => (
                <li
                  key={entry.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    padding: "10px 12px",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--br)",
                    background: "var(--sf2)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--fs-caption)",
                      fontWeight: 700,
                      fontFamily: "var(--fn)",
                      color: entry.success ? "var(--tx)" : "var(--rd)",
                    }}
                  >
                    {logTypeLabel(entry.type)}
                  </span>
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--mo)" }}>{formatWhen(entry.ts)}</span>
                  {entry.detail ? (
                    <span style={{ fontSize: "var(--fs-xs)", color: entry.success ? "var(--tx2)" : "var(--rd)", fontFamily: "var(--fn)" }}>{entry.detail}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {securityLog.length > LOG_PREVIEW ? (
            <button
              type="button"
              onClick={() => setShowFullLog((v) => !v)}
              style={{
                marginTop: 16,
                padding: 0,
                border: "none",
                background: "none",
                color: "var(--cy)",
                fontFamily: "var(--mo)",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              {showFullLog ? "접기" : "VIEW FULL SECURITY HISTORY"}
            </button>
          ) : null}
        </Cd>
      </section>

      {/* 4. 계정 삭제 */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ ...sectionTitle, color: "var(--rd)" }}>Danger zone</h2>
        <Cd style={{ padding: "clamp(16px,3vw,22px)", borderColor: "var(--err-border)", background: "var(--err-surface)" }}>
          <p style={{ fontSize: "var(--fs-caption)", color: "var(--tx2)", marginBottom: 12, lineHeight: 1.6, fontFamily: "var(--fn)" }}>
            복구할 수 없습니다. MVP에서는 실제 삭제를 제공하지 않습니다.
          </p>
          <Bt v="dn" on={() => setDeleteOpen(true)} style={{ minHeight: "var(--touch-min)" }}>
            계정 삭제
          </Bt>
        </Cd>
      </section>

      {deleteOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="계정 삭제 확인"
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--overlay-dim)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => !deleteBusy && setDeleteOpen(false)}
        >
          <div
            style={{
              maxWidth: 400,
              width: "100%",
              padding: 24,
              background: "var(--sf)",
              border: "1px solid var(--err-border)",
              borderRadius: "var(--r-xl)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "var(--fs-h3)", fontWeight: 800, marginBottom: 8, fontFamily: "var(--fn-title)", color: "var(--rd)" }}>계정을 삭제할까요?</h2>
            <p style={{ fontSize: "var(--fs-caption)", color: "var(--tx2)", lineHeight: 1.6, marginBottom: 20, fontFamily: "var(--fn)" }}>
              지금은 실제 삭제가 이루어지지 않으며, Phase 3 이후 절차가 연결됩니다.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <Bt v="gh" dis={deleteBusy} on={() => setDeleteOpen(false)}>
                취소
              </Bt>
              <Bt v="dn" dis={deleteBusy} on={confirmDelete}>
                {deleteBusy ? "…" : "삭제 진행"}
              </Bt>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
