// 로딩 스피너 — GLOBAL_CSS의 @keyframes sp 회전. size·color(토큰 또는 클론 색) 조절 가능.

export default function LoadingSpinner({ size = 14, color = "var(--cy)" }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        borderTopColor: "transparent",
        animation: "sp 0.8s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}
