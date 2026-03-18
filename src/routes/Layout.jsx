import { Outlet, useLocation } from "react-router-dom";

import Nav from "../common/Nav";
import { useWindowSize } from "../hooks/useWindowSize";
import { shouldShowMobileTabBar } from "../lib/navShell";

// 레이아웃 — 상단 Nav + (모바일) 하단 탭바 여백 + Outlet

export default function Layout() {
  const { pathname } = useLocation();
  const { isMobile } = useWindowSize();
  const tabPad = isMobile && shouldShowMobileTabBar(pathname);

  return (
    <>
      <Nav />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          paddingBottom: tabPad ? "calc(var(--nav-tabbar-h) + var(--safe-bottom))" : 0,
        }}
      >
        <Outlet />
      </div>
    </>
  );
}
