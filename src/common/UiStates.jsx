import LoadingSpinner from "./LoadingSpinner";

/** 폼·페이지 상단 에러 (다크 토큰) */
export function ErrorBanner({ children, style }) {
  return (
    <div
      role="alert"
      style={{
        padding: "12px 16px",
        marginBottom: 14,
        borderRadius: "var(--r-md)",
        border: "1px solid var(--err-border)",
        background: "var(--err-surface)",
        color: "var(--rd)",
        fontSize: "var(--fs-caption)",
        fontFamily: "var(--fn)",
        lineHeight: 1.55,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SuccessBanner({ children, style }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        marginBottom: 14,
        borderRadius: "var(--r-md)",
        border: "1px solid var(--br2)",
        background: "var(--cyd)",
        color: "var(--cy)",
        fontSize: "var(--fs-caption)",
        fontFamily: "var(--fn)",
        fontWeight: 600,
        lineHeight: 1.5,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function LoadingBlock({ label = "불러오는 중…", compact }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: compact ? "28px 20px" : "44px 24px",
        minHeight: compact ? undefined : 200,
      }}
    >
      <LoadingSpinner size={22} />
      <p style={{ color: "var(--tx3)", fontSize: "var(--fs-caption)", fontFamily: "var(--mo)", letterSpacing: "0.04em" }}>{label}</p>
    </div>
  );
}

/**
 * 빈 목록·빈 화면 공통
 * @param {string} [icon] — 짧은 심볼(이모지 가능)
 */
export function EmptyState({ icon = "✦", title, hint, children }) {
  return (
    <div
      style={{
        borderRadius: "var(--r-xl)",
        border: "1px dashed var(--br2)",
        background: "linear-gradient(180deg, var(--cyg) 0%, var(--sf2) 100%)",
        padding: "clamp(26px, 6vw, 42px)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "clamp(1.75rem, 5vw, 2.25rem)", lineHeight: 1, marginBottom: 14, opacity: 0.35 }} aria-hidden>
        {icon}
      </div>
      {title && (
        <p style={{ color: "var(--tx)", fontSize: "var(--fs-body)", fontWeight: 700, fontFamily: "var(--fn)", marginBottom: hint ? 10 : 0, lineHeight: 1.4 }}>
          {title}
        </p>
      )}
      {hint && (
        <p style={{ color: "var(--tx2)", fontSize: "var(--fs-caption)", lineHeight: 1.65, fontFamily: "var(--fn)", maxWidth: 400, margin: "0 auto 20px" }}>{hint}</p>
      )}
      {children}
    </div>
  );
}
