import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import LoadingSpinner from "../common/LoadingSpinner";
import MasterBadges from "../common/MasterBadges";
import { useAuth } from "../contexts/AuthContext";
import { useWindowSize } from "../hooks/useWindowSize";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMasterForUser, fetchMyUserRow, fetchTokenSummary } from "../lib/supabaseQueries";

function tabStyle({ isActive }) {
  return {
    minHeight: "var(--touch-min)",
    padding: "0 14px",
    borderRadius: "var(--r-md)",
    border: "none",
    background: isActive ? "var(--cyd)" : "transparent",
    color: isActive ? "var(--cy)" : "var(--tx2)",
    fontSize: "var(--fs-caption)",
    fontWeight: isActive ? 700 : 600,
    textDecoration: "none",
    whiteSpace: "nowrap",
    fontFamily: "var(--fn)",
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

export default function MyLayout() {
  const { user, supabaseConfigured } = useAuth();
  const { pathname } = useLocation();
  const { isMobile } = useWindowSize();
  const isMasterArea = pathname.startsWith("/my/master");

  const [nick, setNick] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [role, setRole] = useState("member");
  const [verified, setVerified] = useState(false);
  const [masterAffiliate, setMasterAffiliate] = useState(false);
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ row: u }, { row: m }, tok] = await Promise.all([
      fetchMyUserRow(supabase),
      fetchMasterForUser(supabase),
      fetchTokenSummary(supabase, user.id),
    ]);
    setNick(u?.nickname || user.email?.split("@")[0] || "회원");
    setAvatarUrl(u?.avatar_url || "");
    setRole(u?.role === "master" ? "master" : "member");
    setVerified(!!m?.is_verified);
    setMasterAffiliate(!!m?.is_affiliate);
    setTokens(tok.total ?? 0);
    setLoading(false);
  }, [user?.id, user?.email]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  useEffect(() => {
    const onMaster = () => load();
    window.addEventListener("clone-me-master-profile-changed", onMaster);
    return () => window.removeEventListener("clone-me-master-profile-changed", onMaster);
  }, [load]);

  const initial = (nick || "?").trim().charAt(0).toUpperCase() || "?";

  const memberTabs = [
    { to: "/my/profile", end: true, l: "프로필" },
    { to: "/my/tokens", end: false, l: "토큰" },
    { to: "/my/subscription", end: true, l: "구독" },
    { to: "/my/conversations", end: true, l: "대화" },
    { to: "/my/become-master", end: true, l: role === "master" ? "마스터 스튜디오" : "마스터 등록" },
  ];

  const masterTabs = [
    { to: "/my/master/profile", end: true, l: "프로필" },
    { to: "/my/master/verify", end: true, l: "인증" },
    { to: "/my/master/clones", end: true, l: "내 클론" },
    { to: "/my/master/revenue", end: true, l: "수익" },
    { to: "/my/master/pricing", end: true, l: "단가" },
    { to: "/my/master/payout", end: true, l: "정산" },
  ];

  const tabs = isMasterArea ? masterTabs : memberTabs;
  const padX = "max(var(--page-pad-x), var(--safe-left))";
  const padR = "max(var(--page-pad-x), var(--safe-right))";

  return (
    <div
      style={{
        minHeight: "60vh",
        paddingBottom: "calc(24px + var(--safe-bottom))",
        background: "var(--bg)",
      }}
    >
      {/* 헤더: 아바타 · 닉네임 · 배지 · 토큰 */}
      <div
        style={{
          borderBottom: "1px solid var(--br)",
          background: "linear-gradient(165deg, var(--cyg) 0%, var(--sf) 55%, var(--sf2) 100%)",
          paddingTop: isMobile ? 12 : 16,
          paddingBottom: isMobile ? 16 : 20,
          paddingLeft: padX,
          paddingRight: padR,
        }}
      >
        <div style={{ maxWidth: 960, marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: isMobile ? 14 : 20, flexWrap: "wrap" }}>
            <div
              style={{
                position: "relative",
                width: isMobile ? 58 : 64,
                height: isMobile ? 58 : 64,
                flexShrink: 0,
                borderRadius: "50%",
                padding: 2,
                background: "linear-gradient(135deg, var(--cy) 0%, var(--pu) 100%)",
                boxShadow: "0 8px 28px var(--cyg)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: "var(--sf)",
                  border: "2px solid var(--sf)",
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--cyd)",
                      fontSize: isMobile ? 22 : 26,
                      fontWeight: 800,
                      color: "var(--cy)",
                      fontFamily: "var(--fn)",
                    }}
                  >
                    {initial}
                  </div>
                )}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: isMobile ? "calc(100% - 90px)" : 200 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 6 }}>
                {loading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <LoadingSpinner size={18} />
                    <span style={{ fontSize: "var(--fs-caption)", color: "var(--tx3)", fontFamily: "var(--mo)" }}>불러오는 중…</span>
                  </div>
                ) : (
                  <>
                    <h1
                      style={{
                        fontSize: isMobile ? "var(--fs-h1-mobile)" : "var(--fs-h1)",
                        fontWeight: 800,
                        margin: 0,
                        color: "var(--tx)",
                        fontFamily: "var(--fn)",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {nick}
                    </h1>
                    <span
                      style={{
                        fontSize: "var(--fs-xs)",
                        padding: "4px 10px",
                        borderRadius: "var(--r-md)",
                        background: role === "master" ? "var(--tg-pu-bg)" : "var(--sf3)",
                        color: role === "master" ? "var(--pu)" : "var(--tx2)",
                        fontFamily: "var(--mo)",
                        fontWeight: 600,
                        border: "1px solid var(--br)",
                      }}
                    >
                      {role === "master" ? "마스터" : "멤버"}
                    </span>
                    {role === "master" && (verified || masterAffiliate) && (
                      <MasterBadges verified={verified} affiliate={masterAffiliate} />
                    )}
                  </>
                )}
              </div>

              {!loading && supabaseConfigured && (
                <Link
                  to="/my/tokens"
                  style={{
                    marginTop: 4,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    borderRadius: "var(--r-lg)",
                    background: "var(--cyd)",
                    border: "1px solid var(--br2)",
                    textDecoration: "none",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--fs-xs)",
                      fontFamily: "var(--mo)",
                      letterSpacing: "0.08em",
                      color: "var(--cy)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    보유 토큰
                  </span>
                  <span style={{ fontSize: isMobile ? 20 : 22, fontWeight: 800, color: "var(--tx)", fontFamily: "var(--mo)", letterSpacing: "-0.02em" }}>
                    {tokens.toLocaleString()}
                  </span>
                  <span style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--tx2)", fontFamily: "var(--mo)" }}>T</span>
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--cy)", marginLeft: 4 }}>충전 →</span>
                </Link>
              )}
              {!loading && !supabaseConfigured && (
                <p style={{ fontSize: "var(--fs-sm)", color: "var(--tx3)", fontFamily: "var(--fn)", marginTop: 6 }}>Supabase 연결 시 토큰이 표시됩니다.</p>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: isMobile ? 0 : "auto", width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "flex-end" : "flex-start", flexWrap: "wrap" }}>
              {!isMasterArea && role === "master" && (
                <Link
                  to="/my/master/profile"
                  style={{
                    fontSize: "var(--fs-sm)",
                    padding: "10px 14px",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--br2)",
                    background: "var(--tg-pu-bg)",
                    color: "var(--pu)",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontFamily: "var(--fn)",
                  }}
                >
                  마스터 스튜디오
                </Link>
              )}
              {isMasterArea && (
                <Link
                  to="/my/profile"
                  style={{
                    fontSize: "var(--fs-sm)",
                    padding: "10px 14px",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--br)",
                    color: "var(--tx2)",
                    textDecoration: "none",
                    fontFamily: "var(--fn)",
                    fontWeight: 600,
                  }}
                >
                  ← 멤버
                </Link>
              )}
              <Link
                to="/my/settings"
                aria-label="설정"
                style={{
                  minWidth: "var(--touch-min)",
                  minHeight: "var(--touch-min)",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--br)",
                  background: "var(--sf2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  color: "var(--tx2)",
                  fontFamily: "var(--mo)",
                  fontSize: "var(--fs-caption)",
                  fontWeight: 600,
                }}
              >
                설정
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 서브 탭 */}
      <div
        style={{
          borderBottom: "1px solid var(--br)",
          background: "var(--sf2)",
          padding: `12px ${padX} 12px ${padR}`,
        }}
      >
        <div style={{ maxWidth: 960, marginLeft: "auto", marginRight: "auto" }}>
          <p
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--tx3)",
              fontFamily: "var(--mo)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 10,
              fontWeight: 600,
            }}
          >
            {isMasterArea ? "마스터 스튜디오" : "멤버 메뉴"}
          </p>
          <div className="nav-scroll" style={{ display: "flex", gap: 6, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to === "/my/become-master" && role === "master" ? "/my/master/profile" : t.to}
                end={t.end}
                style={tabStyle}
              >
                {t.l}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: `${isMobile ? 16 : 24}px ${padX} 40px ${padR}`,
          maxWidth: 960,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <Outlet context={{ refreshHeader: load }} />
      </div>
    </div>
  );
}
