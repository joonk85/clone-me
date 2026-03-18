// 태그 칩 — 라벨·색상 키(cy|gn|am|rd|go|pu). 배경은 토큰, 글자는 포인트 컬러.

export default function Tg({ label, c = "cy" }) {
  const mp = {
    cy: ["var(--cyd)", "var(--cy)"],
    gn: ["var(--tg-gn-bg)", "var(--gn)"],
    am: ["var(--tg-am-bg)", "var(--am)"],
    rd: ["var(--tg-rd-bg)", "var(--rd)"],
    go: ["var(--tg-go-bg)", "var(--go)"],
    pu: ["var(--tg-pu-bg)", "var(--pu)"],
  };
  const [bg, fg] = mp[c] || mp.cy;
  return (
    <span
      style={{
        padding: "2px 9px",
        borderRadius: 4,
        fontSize: 11,
        fontFamily: "var(--mo)",
        background: bg,
        color: fg,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
