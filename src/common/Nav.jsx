import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { useWindowSize } from "../hooks/useWindowSize";
import { shouldShowMobileTabBar } from "../lib/navShell";

const items = [
  { path: "/", l: "홈", short: "홈" },
  { path: "/market", l: "탐색", short: "탐색" },
  { path: "/my", l: "마이", short: "마이" },
];

function TabIcon({ name, active }) {
  const c = active ? "var(--cy)" : "var(--tx3)";
  const sw = 1.75;
  if (name === "home") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden style={{ display: "block" }}>
        <path
          d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-7H10v7H5a1 1 0 01-1-1v-9.5z"
          stroke={c}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "market") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden style={{ display: "block" }}>
        <path d="M4 8h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V8z" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
        <path d="M8 8V6a4 4 0 018 0v2" stroke={c} strokeWidth={sw} strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden style={{ display: "block" }}>
      <circle cx="12" cy="9" r="4" stroke={c} strokeWidth={sw} />
      <path d="M6 21v-1a6 6 0 0112 0v1" stroke={c} strokeWidth={sw} strokeLinecap="round" />
    </svg>
  );
}

export default function Nav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isMobile } = useWindowSize();
  const { user } = useAuth();

  const activePath = pathname.startsWith("/my")
    ? "/my"
    : pathname.startsWith("/market")
      ? "/market"
      : "/";

  const handleLogo = () => navigate("/");

  const tabBtn = (path, l, isActive) => (
    <button
      key={path}
      type="button"
      onClick={() => navigate(path)}
      style={{
        minHeight: "var(--touch-min)",
        padding: "0 14px",
        borderRadius: "var(--r-md)",
        border: "none",
        background: isActive ? "var(--cyd)" : "transparent",
        color: isActive ? "var(--cy)" : "var(--tx2)",
        fontSize: "var(--fs-caption)",
        fontWeight: isActive ? 700 : 500,
        cursor: "pointer",
        fontFamily: "var(--fn)",
        whiteSpace: "nowrap",
      }}
    >
      {l}
    </button>
  );

  const showTabBar = isMobile && shouldShowMobileTabBar(pathname);

  if (isMobile) {
    return (
      <>
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: "var(--z-nav)",
            background: "var(--nav-scrim)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid var(--br)",
            paddingTop: "var(--safe-top)",
            paddingLeft: "max(var(--page-pad-x), var(--safe-left))",
            paddingRight: "max(var(--page-pad-x), var(--safe-right))",
            minHeight: "calc(var(--nav-h-mobile) + var(--safe-top))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div
            onClick={handleLogo}
            onKeyDown={(e) => e.key === "Enter" && handleLogo()}
            role="button"
            tabIndex={0}
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--cy)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 12px var(--cyg)",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 900, color: "var(--on-cy)", fontFamily: "var(--fn-title)" }}>c</span>
            </div>
            <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--tx)", fontFamily: "var(--fn-title)" }}>
              clone.me
            </span>
          </div>
          {!user ? (
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{
                minHeight: "var(--touch-min)",
                padding: "0 14px",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--br2)",
                background: "var(--cyd)",
                color: "var(--cy)",
                fontSize: "var(--fs-caption)",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--fn)",
              }}
            >
              로그인
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/my/general")}
              style={{
                minHeight: "var(--touch-min)",
                padding: "0 12px",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--br)",
                background: "var(--sf2)",
                color: "var(--tx2)",
                fontSize: "var(--fs-sm)",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--fn)",
              }}
            >
              내 정보
            </button>
          )}
        </header>

        {showTabBar && (
          <nav
            role="navigation"
            aria-label="주요 메뉴"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: "var(--z-nav-tabbar)",
              background: "var(--nav-scrim)",
              backdropFilter: "blur(20px)",
              borderTop: "1px solid var(--br)",
              paddingBottom: "var(--safe-bottom)",
              display: "flex",
              alignItems: "stretch",
              justifyContent: "space-around",
              minHeight: "calc(var(--nav-tabbar-h) + var(--safe-bottom))",
              boxShadow: "0 -8px 32px var(--overlay-dim)",
            }}
          >
            {items.map(({ path, short }, i) => {
              const active = activePath === path;
              const iconName = i === 0 ? "home" : i === 1 ? "market" : "user";
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(path)}
                  style={{
                    flex: 1,
                    maxWidth: 160,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    padding: "8px 4px 10px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontFamily: "var(--fn)",
                    color: active ? "var(--cy)" : "var(--tx3)",
                  }}
                >
                  <TabIcon name={iconName} active={active} />
                  <span
                    style={{
                      fontSize: "var(--fs-xs)",
                      fontWeight: active ? 700 : 500,
                      letterSpacing: "0.02em",
                      color: active ? "var(--cy)" : "var(--tx3)",
                    }}
                  >
                    {short}
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </>
    );
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: "var(--z-nav)",
        background: "var(--nav-scrim)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--br)",
        height: "var(--nav-h)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--page-pad-x)",
        flexShrink: 0,
        gap: 12,
      }}
    >
      <div
        onClick={handleLogo}
        onKeyDown={(e) => e.key === "Enter" && handleLogo()}
        role="button"
        tabIndex={0}
        style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", flexShrink: 0 }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "var(--cy)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 10px var(--cyg)",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 900, color: "var(--on-cy)", fontFamily: "var(--fn-title)" }}>c</span>
        </div>
        <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--tx)", fontFamily: "var(--fn-title)" }}>
          clone.me
        </span>
      </div>
      <div
        className="nav-scroll"
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          flex: 1,
          justifyContent: "center",
          maxWidth: 400,
          alignItems: "center",
        }}
      >
        {items.map(({ path, l }) => tabBtn(path, l, activePath === path))}
      </div>
      <div style={{ width: 24, flexShrink: 0 }} aria-hidden />
    </header>
  );
}
