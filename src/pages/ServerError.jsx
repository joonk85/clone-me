// 500 — 서버/API 오류 폴백. Phase 이후 에러 바운더리·리다이렉트 연동.

export default function ServerError() {
  return (
    <div style={{ minHeight: 520, padding: 24, maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>500</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>서버 오류</h1>
      <p style={{ color: "var(--tx2)", lineHeight: 1.7 }}>Phase 1 이후 단계에서 에러 핸들링과 연결합니다.</p>
    </div>
  );
}
