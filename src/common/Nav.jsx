import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useWindowSize } from "../hooks/useWindowSize";
import { useAppState } from "../contexts/AppStateContext";

export default function Nav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { role, setRole } = useAppState();
  const { isMobile } = useWindowSize();
  const [menuOpen, setMenuOpen] = useState(false);

  const cr = [
    { path: "/", l: "홈" },
    { path: "/dashboard/create", l: "클론 만들기" },
    { path: "/dashboard", l: "내 클론" },
  ];
  const by = [
    { path: "/", l: "홈" },
    { path: "/market", l: "마켓" },
    { path: "/my", l: "마이" },
  ];
  const items = role === "creator" ? cr : by;
  const activePath = pathname.startsWith("/dashboard")
    ? pathname === "/dashboard/create"
      ? "/dashboard/create"
      : "/dashboard"
    : pathname.startsWith("/my")
      ? "/my"
      : pathname;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const handleLogo = () => {
    setMenuOpen(false);
    navigate("/");
  };
  const handleTab = (path) => () => {
    setMenuOpen(false);
    navigate(path);
  };
  const handleRoleToggle = () => {
    setMenuOpen(false);
    setRole((r) => (r === "creator" ? "buyer" : "creator"));
    navigate("/");
  };

  const tabBtn = (path, l, isActive) => (
    <button
      key={path}
      type="button"
      onClick={handleTab(path)}
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

  const roleLabel = role === "creator" ? "구매자로" : "강사로";

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
            paddingLeft: "max(var(--page-pad-x-mobile), var(--safe-left))",
            paddingRight: "max(var(--page-pad-x-mobile), var(--safe-right))",
            minHeight: "calc(var(--nav-h-mobile) + var(--safe-top))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexShrink: 0,
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
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--cy)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 10px var(--cy)",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 900, color: "var(--on-cy)" }}>c</span>
            </div>
            <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, letterSpacing: "-0.03em" }}>clone.me</span>
          </div>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label="메뉴 열기"
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              minWidth: "var(--touch-min)",
              minHeight: "var(--touch-min)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--br)",
              background: "var(--sf2)",
              color: "var(--tx)",
              fontSize: 20,
              lineHeight: 1,
              cursor: "pointer",
              fontFamily: "var(--fn)",
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </header>

        {menuOpen && (
          <>
            <div
              role="presentation"
              onClick={() => setMenuOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "var(--overlay-dim)",
                zIndex: "var(--z-nav-backdrop)",
              }}
            />
            <nav
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                width: "min(300px, 86vw)",
                height: "100dvh",
                paddingTop: "calc(var(--safe-top) + 12px)",
                paddingBottom: "var(--safe-bottom)",
                paddingLeft: 20,
                paddingRight: 20,
                background: "var(--sf)",
                borderLeft: "1px solid var(--br)",
                zIndex: "var(--z-nav-drawer)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
                animation: "fu 0.2s ease",
              }}
            >
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 8 }}>
                MENU
              </div>
              {items.map(({ path, l }) => (
                <button
                  key={path}
                  type="button"
                  onClick={handleTab(path)}
                  style={{
                    minHeight: "var(--touch-min)",
                    textAlign: "left",
                    padding: "0 12px",
                    borderRadius: "var(--r-md)",
                    border: "none",
                    background: activePath === path ? "var(--cyd)" : "transparent",
                    color: activePath === path ? "var(--cy)" : "var(--tx)",
                    fontSize: "var(--fs-body)",
                    fontWeight: activePath === path ? 700 : 500,
                    cursor: "pointer",
                    fontFamily: "var(--fn)",
                  }}
                >
                  {l}
                </button>
              ))}
              <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid var(--br)" }}>
                <button
                  type="button"
                  onClick={handleRoleToggle}
                  style={{
                    width: "100%",
                    minHeight: "var(--touch-min)",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--br2)",
                    background: "var(--sf2)",
                    color: "var(--cy)",
                    fontSize: "var(--fs-caption)",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "var(--mo)",
                  }}
                >
                  {roleLabel}
                </button>
              </div>
            </nav>
          </>
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
      }}
    >
      <div
        onClick={handleLogo}
        onKeyDown={(e) => e.key === "Enter" && handleLogo()}
        role="button"
        tabIndex={0}
        style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}
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
            boxShadow: "0 0 10px var(--cy)",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 900, color: "var(--on-cy)" }}>c</span>
        </div>
        <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, letterSpacing: "-0.03em" }}>clone.me</span>
      </div>
      <div className="nav-scroll" style={{ display: "flex", gap: 4, overflowX: "auto", maxWidth: "min(52vw, 420px)", alignItems: "center" }}>
        {items.map(({ path, l }) => tabBtn(path, l, activePath === path))}
      </div>
      <button
        type="button"
        onClick={handleRoleToggle}
        style={{
          minHeight: 36,
          padding: "6px 12px",
          borderRadius: "var(--r-md)",
          border: "1px solid var(--br2)",
          background: "transparent",
          fontSize: "var(--fs-sm)",
          cursor: "pointer",
          fontFamily: "var(--mo)",
          color: "var(--cy)",
          flexShrink: 0,
        }}
      >
        {roleLabel}
      </button>
    </header>
  );
}
