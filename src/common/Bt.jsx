// 버튼 — v: pr(강조)·gh(고스트)·sf(서페이스)·dn(위험), sz: sm|md|lg. ch 또는 children으로 라벨.

export default function Bt({
  ch,
  on,
  v = "pr",
  sz = "md",
  dis,
  type = "button",
  style: s,
  children,
}) {
  const t = ch || children;
  const p = sz === "sm" ? "5px 11px" : sz === "lg" ? "12px 24px" : "8px 18px";
  const fs = sz === "sm" ? 11 : sz === "lg" ? 15 : 13;
  const vs = {
    pr: { background: "var(--cy)", color: "var(--on-cy)", border: "none" },
    gh: {
      background: "transparent",
      color: "var(--tx)",
      border: "1px solid var(--br)",
    },
    sf: { background: "var(--sf2)", color: "var(--tx)", border: "none" },
    dn: { background: "var(--rd)", color: "#fff", border: "none" },
  };
  return (
    <button
      type={type}
      onClick={on}
      disabled={dis}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        cursor: dis ? "not-allowed" : "pointer",
        fontFamily: "var(--fn)",
        fontWeight: 700,
        borderRadius: 9,
        fontSize: fs,
        padding: p,
        opacity: dis ? 0.4 : 1,
        transition: "opacity 0.15s",
        ...vs[v],
        ...s,
      }}
    >
      {t}
    </button>
  );
}
