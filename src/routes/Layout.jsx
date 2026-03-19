import { Outlet } from "react-router-dom";

import AppShell from "../common/AppShell";
import { PageTitleProvider } from "../contexts/PageTitleContext";

// 레이아웃 — 항상 AppShell(rail + 헤더 + Outlet). 비로그인/로그인 동일 rail. 모바일: rail 오버레이, 하단 탭바 없음.

export default function Layout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, width: "100%" }}>
      <PageTitleProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </PageTitleProvider>
    </div>
  );
}
