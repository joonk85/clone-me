# 마스터 클론 목록 (`/my/master/clones`) — Side effects

> 2026-03: 마스터 모드 **내 클론** 페이지를 테이블·통계·검색·페이지네이션 레이아웃으로 개편. **Supabase `clones`·`conversations`·`messages`** 집계.

## 레이아웃

- **앱 Rail (마스터 모드):** **홈** 아래 **`클론 목록`** 항목 추가 → `/my/master/clones` (`AppShell.jsx`). 기존 개별 클론 → `/dashboard/:id` 유지.
- **마스터 스튜디오 크롬:** `/my/master/*` 데스크톱은 **fixed 좌측 레일(268px)** + 우측 콘텐츠. `/my/master/clones` 는 우측 콘텐츠 **max-width 1180px**.
- **페이지 상단 바:** 검색(이름·UUID) · 토큰 링(`TokenRingGauge`)·`/my/subscription` · 알림 · 계정(`fetchMyUserRow` 아바타).
- **헤더:** 타이틀 **내 클론** · 통계 카드 **TOTAL ACTIVE** (`is_active`) · **이번 달 대화** (월간 메시지 수 합계).
- **테이블(데스크톱):** CLONE NAME(아바타·이름·id) · STATUS 뱃지 · 이번 달 대화 · 총 유저(distinct `conversations.user_id`) · 마지막 업데이트 · ACTIONS(대시보드/설정/테스트 아이콘 → 모두 `/dashboard/:id` + `myClones` 동기화).
- **모바일:** 동일 데이터 **카드** 스택.
- **페이지네이션:** `SHOWING a–b OF n CLONES` · PREV/NEXT (페이지당 6행).
- **하단 카드 3개:** 이번 달 총 대화+진행바(Mock 목표) · 품질 점수 평균(`quality_score`>0만) · **+ 새 클론 만들기** → `/dashboard/create`.
- **빈 상태:** `EmptyState` + **+ 첫 클론 만들기**.

## STATUS 규칙

- **Inactive:** `is_active === false` — 회색.
- **Operating:** `is_active` 이고 마지막 활동(대화·메시지·`clones.updated_at`)이 **7일 이내** — cyan.
- **Idle:** `is_active` 이고 7일 초과 무활동 — amber (`--am` / `--am-surface`).

## 데이터 (`src/lib/supabaseQueries.js`)

- `fetchClonesForMaster` — `subtitle`, `quality_score`, `version`, `discount_end` 등 확장 select.
- `fetchMasterClonesListAnalytics` — `conversations`(`is_test` false 또는 null) + 이번 달 `messages` 배치 조회(대화 id 청크) 후 JS 집계.
- `mapDbCloneToMyCloneShape` — **CloneDash** 진입 시 `AppStateContext.myClones`·`activeMyClone`에 머지용 최소 셰이프.

## 검증

- [ ] 마스터 모드에서 Rail **클론 목록** 활성 하이라이트
- [ ] 행 액션 후 대시보드 진입( UUID 클론)
- [ ] RLS 오류 시 빈 집계·테이블만 표시되는지
