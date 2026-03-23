# 설정 페이지 `/settings` 분리 — Side effects

> 2026-03: 설정을 **`/my/settings` → `/settings`** 로 분리. 마이·마스터 레이아웃 탭에서 **설정 탭은 원래 없음**(헤더·레일만 진입). 멤버 탭「보안」은 안내 + `/settings` 이동.

## 라우팅

| 경로 | 동작 |
|------|------|
| **`/settings`** | `Settings` (보호). 계정·구독·알림·보안·로그아웃 |
| **`/my/settings`** | → **`/settings`** 리다이렉트 (북마크 호환) |
| **`/my/subscription`** | → **`/settings`** 리다이렉트 |

## 진입 경로

- 좌측 Rail 하단 프로필 드롭업 → **설정** → `navigate("/settings")`
- 마이페이지 헤더 우측: 멤버 영역 **⚙️**(아이콘만), 마스터 스튜디오 영역 **설정**(텍스트)
- 프로필/토큰 페이지 내 문구 링크 → `/settings`

## `/my/security` (멤버 탭「보안」)

- **이전:** 이메일·비밀번호·계정 삭제 폼
- **이후:** `/settings` 로 통합 안내 + **설정으로 이동** 버튼

## 알림 컬럼

- `notify_marketing` (기본 false), `notify_email` (기본 true) — 기존 스키마
- **`notify_new_master`** — 선택. 미적용 시 저장 시 해당 필드 제외 후 안내. SQL: `docs/supabase/users_notify_new_master.sql`

## 닉네임

- 설정에서 `users.nickname` 수정 시 `clone-me-user-profile-changed` 이벤트 → `MyLayout` 헤더 갱신

## 문서·에이전트 동기화

- `agents/BRAIN.md`, `UXUI.md`, `PM.md`, `HOWTO.md`
- `docs/PROGRESS.md`, `MY_MEMBER_TABS_SIDE_EFFECTS.md`, `PLATFORM_SUBSCRIPTION_SIDE_EFFECTS.md`, `APP_LAYOUT_SIDE_EFFECTS.md`, `FLOW_RAIL_SPEC.md`, `SUPABASE_SETUP.md`
- PRD 본문은 필요 시 별도 갱신 (`/my/settings` 언급)

## 검증 체크리스트

- [ ] 로그인 후 `/settings` 직접 접근
- [ ] `/my/settings` → `/settings` 리다이렉트
- [ ] 레일 드롭업·마이 헤더 ⚙️·마스터 헤더「설정」
- [ ] `/my/security` → 설정 이동 버튼
- [ ] 구독 Mock·알림 저장 (컬럼 없을 때 신규 마스터 알림 안내)
