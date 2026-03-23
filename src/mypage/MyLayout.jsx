import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRightCircleIcon,
  BellIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "../contexts/AuthContext";
import { useWindowSize } from "../hooks/useWindowSize";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMyUserRow } from "../lib/supabaseQueries";

const MASTER_TABS = [
  { to: "/my/master/profile", end: true, l: "프로필" },
  { to: "/my/master/verify", end: true, l: "인증" },
  { to: "/my/master/clones", end: true, l: "내 클론" },
  { to: "/my/master/revenue", end: true, l: "수익" },
  { to: "/my/master/pricing", end: true, l: "단가" },
  { to: "/my/master/payout", end: true, l: "정산" },
];

function masterTabStyle({ isActive }) {
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

/** 마스터 스튜디오 (/my/master/*) — 기존 상단 탭만 유지 */
export function MasterStudioChrome() {
  const { isMobile } = useWindowSize();
  const { pathname } = useLocation();
  const padX = "max(var(--page-pad-x), var(--safe-left))";
  const padR = "max(var(--page-pad-x), var(--safe-right))";
  const wideClones = pathname.startsWith("/my/master/clones");
  const contentMax = wideClones ? 1180 : 960;

  return (
    <div style={{ minHeight: "60vh", paddingBottom: "calc(24px + var(--safe-bottom))", background: "var(--bg)" }}>
      <div
        style={{
          borderBottom: "1px solid var(--br)",
          background: "var(--sf2)",
          padding: `12px ${padX} 12px ${padR}`,
        }}
      >
        <div style={{ maxWidth: contentMax, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
          <Link
            to="/my/general"
            style={{
              fontSize: "var(--fs-caption)",
              color: "var(--tx2)",
              textDecoration: "none",
              fontFamily: "var(--fn)",
              fontWeight: 600,
            }}
          >
            ← 멤버 계정
          </Link>
          <p
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--tx3)",
              fontFamily: "var(--mo)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              margin: 0,
              fontWeight: 600,
            }}
          >
            마스터 스튜디오
          </p>
        </div>
        <div
          className="nav-scroll"
          style={{ maxWidth: contentMax, margin: "12px auto 0", paddingLeft: padX, paddingRight: padR, overflowX: "auto", WebkitOverflowScrolling: "touch" }}
        >
          <div style={{ display: "flex", gap: 6, paddingBottom: 2 }}>
            {MASTER_TABS.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} style={masterTabStyle}>
                {t.l}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: `${isMobile ? 16 : 24}px ${padX} 40px ${padR}`, maxWidth: contentMax, margin: "0 auto" }}>
        <Outlet />
      </div>
    </div>
  );
}

function navItemStyle({ isActive }) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    borderRadius: "var(--r-md)",
    textDecoration: "none",
    fontFamily: "var(--fn)",
    fontSize: "var(--fs-caption)",
    fontWeight: isActive ? 700 : 500,
    color: isActive ? "var(--cy)" : "var(--tx2)",
    background: isActive ? "var(--cyd)" : "transparent",
    border: isActive ? "1px solid var(--br2)" : "1px solid transparent",
  };
}

const ACCOUNT_NAV = [
  { to: "/my/general", end: true, label: "General", Icon: UserCircleIcon },
  { to: "/my/security", end: true, label: "Security", Icon: ShieldCheckIcon },
  { to: "/my/subscription", end: false, label: "Subscription & Usage", Icon: CreditCardIcon },
  { to: "/my/notifications", end: true, label: "Notifications", Icon: BellIcon },
];

/** 멤버 계정: 앱 Rail 대체 — 데스크톱 fixed 좌측 전고 / 모바일 상단 탭 */
function MemberAccountShell() {
  const { user, supabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useWindowSize();

  const [role, setRole] = useState("member");

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) return;
    const { row: u } = await fetchMyUserRow(supabase);
    setRole(u?.role === "master" ? "master" : "member");
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onUser = () => load();
    window.addEventListener("clone-me-user-profile-changed", onUser);
    return () => window.removeEventListener("clone-me-user-profile-changed", onUser);
  }, [load]);

  const padX = "max(var(--page-pad-x), var(--safe-left))";
  const padR = "max(var(--page-pad-x), var(--safe-right))";
  /** AppShell `MY_ACCOUNT_SIDEBAR_W` 와 동일해야 함 */
  const SIDEBAR_W = 268;

  const homeLinkStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: "var(--fs-caption)",
    color: "var(--tx2)",
    textDecoration: "none",
    fontFamily: "var(--fn)",
    fontWeight: 600,
    marginBottom: 18,
  };

  const sidebarNav = (
    <>
      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {ACCOUNT_NAV.map(({ to, end, label, Icon }) => (
          <NavLink key={to} to={to} end={end} style={navItemStyle}>
            <Icon style={{ width: 20, height: 20, flexShrink: 0 }} aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
      <div style={{ height: 1, background: "var(--br)", margin: "18px 0" }} role="separator" aria-hidden />
      <button
        type="button"
        onClick={() => navigate(role === "master" ? "/my/master/profile" : "/master-register")}
        style={{
          ...navItemStyle({ isActive: false }),
          width: "100%",
          cursor: "pointer",
          textAlign: "left",
          border: "1px solid var(--br2)",
          background: "var(--sf2)",
        }}
      >
        <ArrowRightCircleIcon style={{ width: 20, height: 20, flexShrink: 0 }} aria-hidden />
        Go to My Master AI
      </button>
    </>
  );

  const desktopAsideStyle = {
    position: "fixed",
    left: 0,
    top: 0,
    height: "100dvh",
    width: SIDEBAR_W,
    zIndex: 200,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    boxSizing: "border-box",
    padding: "calc(var(--safe-top) + 16px) 16px calc(20px + var(--safe-bottom)) 16px",
    background: "var(--sf)",
    borderRight: "1px solid var(--br)",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <>
      {!isMobile ? (
        <aside aria-label="계정 메뉴" style={desktopAsideStyle}>
          <Link to="/" style={homeLinkStyle}>
            ← 홈으로
          </Link>
          <p
            style={{
              fontSize: 10,
              fontFamily: "var(--mo)",
              letterSpacing: "0.14em",
              color: "var(--tx3)",
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            USER ACCOUNT
          </p>
          {sidebarNav}
        </aside>
      ) : (
        <div
          style={{
            flexShrink: 0,
            borderBottom: "1px solid var(--br)",
            background: "var(--sf2)",
            padding: `12px ${padX} 12px ${padR}`,
          }}
        >
          <Link to="/" style={{ ...homeLinkStyle, marginBottom: 12, fontSize: "var(--fs-xs)" }}>
            ← 홈으로
          </Link>
          <p style={{ fontSize: 10, fontFamily: "var(--mo)", letterSpacing: "0.12em", color: "var(--tx3)", marginBottom: 8, fontWeight: 700 }}>USER ACCOUNT</p>
          <div className="nav-scroll" style={{ display: "flex", gap: 6, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 4 }}>
            {ACCOUNT_NAV.map(({ to, end, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                style={({ isActive }) => ({
                  ...navItemStyle({ isActive }),
                  flexDirection: "column",
                  gap: 4,
                  padding: "10px 12px",
                  minWidth: 72,
                  alignItems: "center",
                })}
              >
                <Icon style={{ width: 18, height: 18 }} aria-hidden />
                <span style={{ fontSize: 10, textAlign: "center", lineHeight: 1.2 }}>{label.split(" ")[0]}</span>
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => navigate(role === "master" ? "/my/master/profile" : "/master-register")}
              style={{
                minHeight: "var(--touch-min)",
                padding: "10px 12px",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--br2)",
                background: "var(--sf3)",
                color: "var(--tx2)",
                fontSize: 10,
                fontFamily: "var(--fn)",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              Master AI
            </button>
          </div>
        </div>
      )}

      <main
        style={{
          width: "100%",
          minHeight: "min(100%, 60vh)",
          padding: `${isMobile ? 16 : 28}px ${padX} 40px ${padR}`,
          paddingBottom: "calc(40px + var(--safe-bottom))",
          background: "var(--bg)",
        }}
      >
        {!supabaseConfigured ? (
          <p style={{ color: "var(--tx2)", fontFamily: "var(--fn)" }}>Supabase 설정 후 이용할 수 있습니다.</p>
        ) : (
          <Outlet context={{ refreshSidebar: load }} />
        )}
      </main>
    </>
  );
}

export default function MyLayout() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/my/master")) {
    return <Outlet />;
  }
  return <MemberAccountShell />;
}
