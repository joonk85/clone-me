import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import MasterBadges from "../common/MasterBadges";
import { useAuth } from "../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMasterForUser, fetchMyUserRow, fetchTokenSummary } from "../lib/supabaseQueries";

const tab = ({ isActive }) => ({
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  background: isActive ? "var(--cyd)" : "transparent",
  color: isActive ? "var(--cy)" : "var(--tx2)",
  fontSize: 11,
  fontWeight: isActive ? 700 : 500,
  textDecoration: "none",
  whiteSpace: "nowrap",
  fontFamily: "var(--fn)",
  flexShrink: 0,
});

export default function MyLayout() {
  const { user, supabaseConfigured } = useAuth();
  const { pathname } = useLocation();
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
    { to: "/my/master/verify", end: true, l: "인증 배지" },
    { to: "/my/master/clones", end: true, l: "내 클론" },
    { to: "/my/master/revenue", end: true, l: "수익" },
    { to: "/my/master/pricing", end: true, l: "단가" },
    { to: "/my/master/payout", end: true, l: "정산계좌" },
  ];

  const tabs = isMasterArea ? masterTabs : memberTabs;

  return (
    <div style={{ minHeight: "72vh", paddingBottom: 48 }}>
      {/* 상단 헤더 */}
      <div
        style={{
          borderBottom: "1px solid var(--br)",
          background: "var(--sf)",
          padding: "16px max(16px, var(--page-pad-x-mobile))",
        }}
      >
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--br2)" }}
              />
            ) : (
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--cyd)",
                  border: "2px solid var(--br2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--cy)",
                  fontFamily: "var(--fn)",
                }}
              >
                {initial}
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--tx)" }}>{nick}</h1>
              <span
                style={{
                  fontSize: 10,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: role === "master" ? "rgba(183,148,255,0.15)" : "var(--sf2)",
                  color: role === "master" ? "var(--pu)" : "var(--tx2)",
                  fontFamily: "var(--mo)",
                  fontWeight: 600,
                }}
              >
                {role === "master" ? "마스터" : "멤버"}
              </span>
              {role === "master" && (verified || masterAffiliate) && (
                <MasterBadges verified={verified} affiliate={masterAffiliate} />
              )}
            </div>
            {!loading && supabaseConfigured && (
              <Link
                to="/my/tokens"
                style={{ fontSize: 13, color: "var(--cy)", marginTop: 6, display: "inline-block", fontWeight: 600 }}
              >
                토큰 {tokens.toLocaleString()} T
              </Link>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            {!isMasterArea && role === "master" && (
              <Link
                to="/my/master/profile"
                style={{
                  fontSize: 11,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--br2)",
                  color: "var(--pu)",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                마스터 스튜디오 →
              </Link>
            )}
            {isMasterArea && (
              <Link
                to="/my/profile"
                style={{
                  fontSize: 11,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--br)",
                  color: "var(--tx2)",
                  textDecoration: "none",
                }}
              >
                ← 멤버
              </Link>
            )}
            <Link
              to="/my/settings"
              aria-label="설정"
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                border: "1px solid var(--br)",
                background: "var(--sf2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                textDecoration: "none",
                color: "var(--tx)",
              }}
            >
              ⚙️
            </Link>
          </div>
        </div>
      </div>

      {/* 서브 탭 */}
      <div
        style={{
          borderBottom: "1px solid var(--br)",
          background: "var(--sf2)",
          padding: "10px max(12px, var(--page-pad-x-mobile))",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", gap: 4, alignItems: "center" }}>
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to === "/my/become-master" && role === "master" ? "/my/master/profile" : t.to}
              end={t.end}
              style={tab}
            >
              {t.l}
            </NavLink>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px max(16px, var(--page-pad-x-mobile)) 48px", maxWidth: 960, margin: "0 auto" }}>
        <Outlet context={{ refreshHeader: load }} />
      </div>
    </div>
  );
}
