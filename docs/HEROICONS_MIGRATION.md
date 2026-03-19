# Heroicons 통일 — Side Effect & 대상 파일

## 요약
- **lucide-react:** 프로젝트 내 미사용 → 설치/교체 없음.
- **교체:** 이모지 아이콘 → `@heroicons/react` (24/outline, 24/solid).
- **유지:** 빈 상태 일러스트용 이모지 (`EmptyPanel`의 `emoji` prop: ✨, 💬, 🛒 등).

## 크기·색상 규칙
- 크기: **16 | 20 | 24px** 만 사용 (`style={{ width, height }}` 또는 `className="w-4 h-4"` 등).
- 색상: **CSS Variables + currentColor** (부모 `color: var(--tx2)` 등 상속).

## 아이콘 매핑 (이모지 → Heroicons)
| 이모지 | 용도 | Heroicon (outline) | Heroicon (solid) |
|--------|------|--------------------|------------------|
| 📄 | 문서/출처 | DocumentIcon | DocumentIcon |
| 📺 | 영상/SRT 출처 | VideoCameraIcon | VideoCameraIcon |
| 🔗 | 링크/공유 | LinkIcon | LinkIcon |
| ✓ / ✔ | 완료/검증/체크 | CheckIcon | CheckIcon |
| × | 닫기 | XMarkIcon | XMarkIcon |
| ★ | 평점/별 | StarIcon | StarIcon |
| 🔒 | 잠금/구독 제한 | LockClosedIcon | LockClosedIcon |
| 🔐 | 보안/학습자료 | LockClosedIcon / ShieldCheckIcon | - |
| 💡 | 팁/안내 | LightBulbIcon | LightBulbIcon |
| ⚡ | 강조/주의 | BoltIcon | BoltIcon |
| 🤝 | 제휴 배지 | HandRaisedIcon | UserGroupIcon |
| 💬 | 대화/피드백 라벨 | ChatBubbleLeftRightIcon | - |
| 🙋 | 설문 | ChatBubbleBottomCenterTextIcon | - |
| 🎉 | 축하(텍스트) | 유지 또는 SparklesIcon | - |

## 대상 파일 목록 (교체만, EmptyPanel 등 유지)
1. **src/member/Chat.jsx** — 출처 📄📺, 버튼/배지 ✓🔗🔒🔐💡⚡★×, 설문 🙋
2. **src/common/MasterBadges.jsx** — ✓ 검증, 🤝 제휴
3. **src/pages/Home.jsx** — ★ 평점만 (EmptyPanel emoji 유지)
4. **src/master/Create.jsx** — ✓ 단계, 📄 파일
5. **src/master/MasterRegister.jsx** — ✓
6. **src/mypage/master/MasterVerify.jsx** — ✓, 🤝
7. **src/profile/MasterProfile.jsx** — ★, 💬(탭/헤더), ×
8. **src/member/Market.jsx** — ★
9. **src/auth/Verified.jsx** — ✓
10. **src/master/CloneDash/index.jsx** — 📌🔗✓📦🔐📺×★💬💡 등 섹션/라벨

## 적용 완료
- **Chat.jsx** — DocumentIcon, VideoCameraIcon, LinkIcon, CheckIcon, LockClosedIcon, ShieldCheckIcon, LightBulbIcon, BoltIcon, ChatBubbleLeftRightIcon, StarIcon(solid/outline), XMarkIcon.
- **MasterBadges.jsx** — CheckBadgeIcon, HandRaisedIcon.
- **Home.jsx** — StarIcon(solid). EmptyPanel emoji 유지.
- **Create.jsx** — CheckIcon, DocumentIcon, FolderIcon.
- **MasterRegister.jsx** — CheckCircleIcon.
- **MasterVerify.jsx** — CheckBadgeIcon, HandRaisedIcon, CheckCircleIcon.
- **MasterProfile.jsx** — StarIconSolid, ChatBubbleLeftRightIcon, CameraIcon, PlayIcon, AcademicCapIcon, EnvelopeIcon.
- **Market.jsx** — StarIcon(solid).
- **Verified.jsx** — CheckCircleIcon.
- **CloneDash/index.jsx** — LinkIcon, ChatBubbleLeftRightIcon, Square3Stack3DIcon, ExclamationTriangleIcon, ShieldCheckIcon, BoltIcon, LockClosedIcon, LightBulbIcon. NOTICE_TYPES 이모지 제거(텍스트만).

## 영향 없음
- **api/**, **docs/**, **agents/** — 코드 변경 없음.
- **EmptyPanel** 호출부 (`emoji="✨"` 등) — 유지.
