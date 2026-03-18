// 진행 바 — val/max 비율(%). 85% 초과 시 경고색(var(--am)), 아니면 c(기본 cy).

export default function Pb({ val, max, c = "var(--cy)" }) {
  const p = Math.min((val / max) * 100, 100);
  return (
    <div
      style={{
        height: 3,
        borderRadius: 2,
        background: "var(--sf3)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${p}%`,
          background: p > 85 ? "var(--am)" : c,
          borderRadius: 2,
          transition: "width .4s",
        }}
      />
    </div>
  );
}
