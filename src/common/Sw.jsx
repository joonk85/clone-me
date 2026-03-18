// 토글 스위치 — on(켜짐) 시 녹색 트랙, onChange에 다음 boolean 전달.

export default function Sw({ on, onChange }) {
  return (
    <div
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(!on);
        }
      }}
      tabIndex={0}
      style={{
        width: 30,
        height: 17,
        borderRadius: 9,
        background: on ? "var(--gn)" : "var(--sf3)",
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: on ? 13 : 2,
          width: 13,
          height: 13,
          borderRadius: "50%",
          background: on ? "var(--bg)" : "var(--tx3)",
          transition: "left .2s",
        }}
      />
    </div>
  );
}
