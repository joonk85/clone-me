// 카드 래퍼 — 패널·섹션 공통 배경(border-radius·surface). style로 패딩 등 덮어쓰기.

export default function Cd({ children, style: s }) {
  return (
    <div
      style={{
        background: "var(--sf)",
        border: "1px solid var(--br)",
        borderRadius: 13,
        ...s,
      }}
    >
      {children}
    </div>
  );
}
