// 404 — 존재하지 않는 경로. Phase 2 React Router NotFound 라우트 연결.

export default function NotFound() {
  return (
    <div style={{ minHeight: 520, padding: 24, maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>404</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>페이지를 찾을 수 없습니다</h1>
      <p style={{ color: "var(--tx2)", lineHeight: 1.7 }}>Phase 1-2에서 라우터와 함께 연결합니다.</p>
    </div>
  );
}
