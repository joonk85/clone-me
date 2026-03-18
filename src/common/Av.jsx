// 아바타 — 클론/프로필 이니셜 원형. color는 클론 테마(마스터 지정), 배경·테두리는 해당 색의 투명도 오버레이.

export default function Av({ char, color, size = 44 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `${color}22`,
        border: `1.5px solid ${color}55`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        color,
        fontFamily: "var(--fn)",
        flexShrink: 0,
        boxShadow: `0 0 12px ${color}18`,
      }}
    >
      {char}
    </div>
  );
}
