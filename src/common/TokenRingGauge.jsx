/** SVG 링 게이지: 퍼센트 + cyan/amber/red — HubTopBar·마이 구독 등 공통 */
export default function TokenRingGauge({ percent, tone, size = "md" }) {
  const lg = size === "lg";
  const dim = lg ? 96 : 64;
  const vb = lg ? 96 : 64;
  const cxy = vb / 2;
  const r = lg ? 40 : 26;
  const stroke = lg ? 5 : 4;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(100, Math.max(0, percent)) / 100);
  const strokeColor =
    tone === "red" ? "var(--market-gauge-red)" : tone === "amber" ? "var(--market-gauge-amber)" : "var(--market-gauge-cyan)";

  return (
    <svg width={dim} height={dim} viewBox={`0 0 ${vb} ${vb}`} aria-hidden style={{ flexShrink: 0 }}>
      <circle cx={cxy} cy={cxy} r={r} fill="none" stroke="var(--sf3)" strokeWidth={stroke} />
      <circle
        cx={cxy}
        cy={cxy}
        r={r}
        fill="none"
        stroke={strokeColor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform={`rotate(-90 ${cxy} ${cxy})`}
        style={{ transition: "stroke-dashoffset 0.4s ease, stroke 0.3s ease" }}
      />
      <text
        x={cxy}
        y={cxy + (lg ? 5 : 2)}
        textAnchor="middle"
        style={{ fontFamily: "var(--mo)", fontSize: lg ? 14 : 11, fontWeight: 700, fill: "var(--tx)" }}
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}
