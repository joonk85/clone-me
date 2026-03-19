/**
 * 마스터 배지 (PRD) — 검증 | 제휴 (Heroicons)
 * 카드·프로필·채팅 헤더·마이에서 공통 사용
 */
import { CheckBadgeIcon, HandRaisedIcon } from "@heroicons/react/24/outline";

const pill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
  borderRadius: 6,
  fontFamily: "var(--mo)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  lineHeight: 1,
};

export default function MasterBadges({ verified, affiliate, size = "sm" }) {
  if (!verified && !affiliate) return null;
  const fs = size === "md" ? 12 : 10;
  const py = size === "md" ? "4px 10px" : "3px 8px";

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexWrap: "wrap" }} aria-label="마스터 배지">
      {verified && (
        <span
          title="검증된 마스터 — 이력·자격 증빙이 확인되었습니다"
          style={{
            ...pill,
            fontSize: fs,
            padding: py,
            background: "var(--tg-gn-bg)",
            color: "var(--gn)",
            border: "1px solid var(--br2)",
          }}
        >
          <CheckBadgeIcon style={{ width: 16, height: 16 }} />
          검증
        </span>
      )}
      {affiliate && (
        <span
          title="제휴 마스터 — 플랫폼 제휴 프로그램 참여"
          style={{
            ...pill,
            fontSize: fs,
            padding: py,
            background: "var(--tg-pu-bg)",
            color: "var(--pu)",
            border: "1px solid var(--br2)",
          }}
        >
          <HandRaisedIcon style={{ width: 16, height: 16 }} />
          제휴
        </span>
      )}
    </span>
  );
}
