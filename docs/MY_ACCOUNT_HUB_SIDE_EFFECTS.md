# 마이 계정 허브 `/my/*` — Side effects

> 2026-03: 멤버 **`/my/*`(단, `/my/master` 제외)** 에서 **앱 Left Rail을 숨기고**, **계정 사이드 메뉴가 동일 슬롯(고정 268px)** 을 사용. 우측에 선택한 섹션 콘텐츠. **기존 상단 탭(프로필/토큰/구독/보안/알림) 제거** → General / Security / Subscription & Usage / Notifications.

## 라우팅

| 경로 | 컴포넌트 |
|------|-----------|
| `/my` | → `/my/general` |
| `/my/general` | `MyAccountGeneral` — **General Settings**: 좌 아바타·CHANGE AVATAR / 우 Display name·@handle / Bio 500+카운터 · **ACCOUNT INFO**(읽기 전용) · Reset/Cancel/Save (`docs/GENERAL_SETTINGS_SIDE_EFFECTS.md`) |
| `/my/security` | `MyAccountSecurity` — **Security Control**: Email(변경)·Password·Active Sessions·Security Log·계정 삭제. General은 이메일 표시만 |
| `/my/subscription` | `MyAccountSubscription` — 탭 **Current / Upgrade** · ACCOUNT STATUS + TOKEN CONSUMPTION · Usage History 테이블·CSV(Mock) · 플랜 카드 4 · `docs/SUBSCRIPTION_USAGE_PAGE_SIDE_EFFECTS.md` |
| `/my/notifications` | `MyAccountNotifications` — 마케팅·이메일·신규 마스터 |
| `/my/profile` | → `/my/general` |
| `/my/tokens` (+ `/tokens/history`) | → `/my/subscription` |
| `/my/settings` | → `/my/general` |
| `/settings` | `Settings` → **`Navigate` `/my/general`** (북마크 호환) |
| `/my/master/*` | `MasterStudioChrome` + 기존 마스터 탭(프로필·인증·…) — **앱 Rail도 숨김**, `main` 좌측 마진 0 |

## 레이아웃

### `AppShell.jsx`

- `pathname.startsWith("/my")` → **`hideAppRail`**: 기본 앱 Rail `<aside>` **미렌더**.
- 데스크톱 **`main` `marginLeft`**: `/my` 이고 **`/my/master` 아님** → **268px** (`MY_ACCOUNT_SIDEBAR_W`). `/my/master/*` → **0**.
- 모바일: 레일 오버레이·햄버거(메뉴 열기)는 **`!hideAppRail`** 일 때만.
- `/my` 진입 시 **`setRailOpen(false)`** 로 이전에 열린 레일 상태 정리.

### `MyLayout.jsx` — `MemberAccountShell`

- 데스크톱: 계정 메뉴 **`position: fixed`**, `left: 0`, `top: 0`, `height: 100dvh`, **너비 268px** (`AppShell`과 동일), `z-index: 200`, `overflow-y: auto`, safe-area 패딩.
- 상단 **「← 홈으로」** (`/`). 섹션 **USER ACCOUNT** → **General / Security / Subscription & Usage / Notifications** → **구분선** → **Go to My Master AI**.
- 모바일: 상단 **「← 홈으로」** + 가로 스크롤 탭(동일 4항목 + Master AI 버튼).
- 사이드 하단 아바타·플랜·「내 클론 만들기」 블록은 **제거**(콘텐츠는 각 페이지에서 관리).

## DB (선택)

- `profile_slug`, `profile_bio`: `docs/supabase/users_profile_slug_bio.sql`
- 기존: SNS 컬럼 `users_member_social_urls.sql`, `notify_new_master` 등

## 삭제·대체 파일

- 제거: `MemberProfile.jsx`, `MemberSecurity.jsx`, `MemberTokensPage.jsx`
- 대체: `MyAccountGeneral.jsx`, `MyAccountSecurity.jsx`, `MyAccountSubscription.jsx`, `MyAccountNotifications.jsx`

## 앱 셸·기타 링크

- `AppShell`: 토큰 pill → `/my/subscription`, 드롭업 설정 → `/my/general`
- `Verified`, `Nav`, `MasterRegister`, `Chat` 등 `/my/profile`·`/my/tokens` 참조 갱신
- 마켓 벨 → `/my/notifications`

## 검증

- [ ] `/my` → General, **앱 Rail 없음**, 좌측 계정 메뉴만
- [ ] 데스크톱: 우측 콘텐츠가 레일 폭만큼 밀림(겹침 없음)
- [ ] 모바일 상단 탭·「← 홈으로」
- [ ] 마스터 스튜디오 `/my/master/profile` 및 ← 멤버 계정
- [ ] `/settings` 리다이렉트
