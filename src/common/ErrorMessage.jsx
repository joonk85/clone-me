// 인라인 에러 블록 — API/폼 실패 시 제목·본문·선택적 다시 시도.

export default function ErrorMessage({ title = "오류", message = "문제가 발생했습니다.", onRetry }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 10,
        border: "1px solid var(--err-border)",
        background: "var(--err-surface)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--rd)", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.6 }}>{message}</div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            marginTop: 8,
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid var(--err-border)",
            background: "transparent",
            color: "var(--rd)",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "var(--fn)",
            fontWeight: 700,
          }}
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
