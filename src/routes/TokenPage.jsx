import { NavLink, Outlet } from "react-router-dom";

import TokenHistory from "../member/TokenHistory";
import TokenShop from "../member/TokenShop";

// /my/tokens — 토큰 상점·내역 탭. Phase 3 결제 연동.

const linkStyle = ({ isActive }) => ({
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: isActive ? "var(--cyd)" : "transparent",
  color: isActive ? "var(--cy)" : "var(--tx2)",
  fontSize: 12,
  fontWeight: isActive ? 700 : 400,
  cursor: "pointer",
  fontFamily: "var(--fn)",
  textDecoration: "none",
});

export default function TokenPage() {
  return (
    <div style={{ minHeight: 520, padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <NavLink to="/my/tokens" end style={linkStyle}>
          토큰 상점
        </NavLink>
        <NavLink to="/my/tokens/history" style={linkStyle}>
          내역
        </NavLink>
      </div>
      <Outlet />
    </div>
  );
}

// Route index = TokenShop, path "history" = TokenHistory
export function TokenShopTab() {
  return <TokenShop />;
}
export function TokenHistoryTab() {
  return <TokenHistory />;
}
