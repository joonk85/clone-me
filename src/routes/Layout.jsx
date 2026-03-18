import { Outlet } from "react-router-dom";

import Nav from "../common/Nav";

// 레이아웃 — 상단 Nav + 라우트 콘텐츠(Outlet).

export default function Layout() {
  return (
    <>
      <Nav />
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </>
  );
}
