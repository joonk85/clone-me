# /market → 마스터 탐색 페이지 개편 — Side Effect 체크

> 수정 전 영향도 정리.

---

## 1. 영향받는 파일

| 구분 | 파일 | 변경 내용 |
|------|------|-----------|
| **페이지** | `src/member/Market.jsx` | 클론 목록 → 마스터 카드 목록, 검색·분야 필터, 빈 상태 문구 |
| **네비** | `src/common/Nav.jsx` | "마켓" → "탐색" (l, short) |
| **데이터** | `src/lib/supabaseQueries.js` | 변경 없음. 기존 `fetchMarketClones` 유지, Market에서 master 기준으로 그룹핑 |

---

## 2. 참조 관계 (유지)

- **Home.jsx**: `fetchMarketClones`, `rowToMarketCard` — 그대로 사용 (Featured/추천 클론용).
- **ChatPage.jsx**: `Navigate to="/market"` — 경로 동일.
- **MasterProfilePage**: `onBack={() => navigate("/market")}` — 경로 동일.
- **Onboarding, Buyer, Create 등**: `/market` 링크 — 경로 동일. 페이지 내용만 "마스터 탐색"으로 변경.

---

## 3. 데이터 전략

- **마스터 목록**: `fetchMarketClones()` 결과를 `master_id` 기준으로 그룹핑.
- **마스터 카드**: 첫 번째 클론의 av/color, 마스터 name·배지·tags·bio, 보유 클론 수, "클론 탐색" → `/master/:firstCloneId`.

---

## 4. 분야 필터

- 탭: 전체 / 비즈니스 / 마케팅 / 개발 / 디자인 / 교육 / 라이프스타일 / 기타.
- 마스터 `tags` 배열과 매칭 (포함 관계).

---

## 적용 완료 내역

- **페이지명:** "마스터 탐색". 상단 서브텍스트 "탐색", 카운트 "N명 마스터".
- **검색바:** placeholder "마스터 이름 / 분야 검색", MagnifyingGlassIcon. 이름·title·tags 기준 클라이언트 필터.
- **분야 탭:** CATEGORY_TABS 8개, 클릭 시 category 상태로 필터.
- **마스터 카드:** groupClonesByMaster(cloneCards)로 그룹핑. 아바타(첫 클론 av/color), 이름, MasterBadges(✓/🤝), 분야 태그(최대 3개), 한 줄 소개, "보유 클론 N개", "클론 탐색" → `/master/:first_clone_id`.
- **빈 상태:** "아직 등록된 마스터가 없습니다" / "첫 번째 마스터가 되어보세요" + 마스터 등록하기·홈으로.
- **Nav:** "마켓" → "탐색" (l, short).
