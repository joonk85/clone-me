import { Link } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

const card = {
  display: "block",
  padding: "18px 20px",
  borderRadius: 12,
  border: "1px solid var(--br)",
  background: "var(--sf)",
  textDecoration: "none",
  color: "var(--tx)",
  transition: "border-color 0.15s",
};

export default function MyPage() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: 520, padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 10 }}>MY</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>마이페이지</h1>
      <p style={{ color: "var(--tx2)", lineHeight: 1.7, marginBottom: 24, fontSize: 13 }}>
        {user?.email ? <span>로그인: {user.email}</span> : null}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
        <Link to="/my/settings" style={card}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>내 정보</div>
          <div style={{ fontSize: 12, color: "var(--tx2)" }}>닉네임, 관심사, 알림 (users 테이블)</div>
        </Link>
        <Link to="/my/master" style={card}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>마스터 프로필</div>
          <div style={{ fontSize: 12, color: "var(--tx2)" }}>이름, 소개, slug, 링크 (masters)</div>
        </Link>
        <Link to="/my/tokens" style={card}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>토큰</div>
          <div style={{ fontSize: 12, color: "var(--tx2)" }}>충전 · 내역</div>
        </Link>
        <Link to="/market" style={card}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>마켓</div>
          <div style={{ fontSize: 12, color: "var(--tx2)" }}>활성 클론 둘러보기</div>
        </Link>
      </div>
    </div>
  );
}
