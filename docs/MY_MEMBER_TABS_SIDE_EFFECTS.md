# 마이페이지 멤버 탭 (`/my/*`) — Side Effect 체크

> 2026-03: 멤버 탭 **프로필 / 토큰 / 보안**으로 단순화. **구독·계정**은 **`/settings`**. **보안** 탭은 `/settings` 안내 페이지. **대화**·**마스터 스튜디오** 탭 제거(레일·상단 버튼으로 접근).

---

## 1. 라우트

| 경로 | 동작 |
|------|------|
| `/my` | → `/my/profile` |
| `/my/profile` | `MemberProfile` — 사진·닉네임·관심사·SNS URL |
| `/my/tokens` | `MemberTokensPage` — 잔액·충전하기·충전 패키지·**사용 이력** |
| `/my/tokens/history` | → `/my/tokens` |
| `/my/security` | `MemberSecurity` — 비밀번호·이메일·계정 삭제·로그아웃 |
| `/settings` | `Settings` — 계정·구독·알림·보안 |
| `/my/settings` | → `/settings` 리다이렉트 |
| `/my/subscription` | → `/settings` |
| `/my/security` | 안내 + `/settings` 이동 |
| `/my/conversations` | → `/` |
| `/my/become-master` | → `/master-register` |

마스터 영역 `/my/master/*` 는 변경 없음.

---

## 2. 헤더 (`MyLayout`)

- 닉네임 옆 **연필** → 인라인 편집(Enter 저장, Esc 취소, blur 저장).
- **마스터**인 경우 상단 **마스터 스튜디오** 버튼 유지.

---

## 3. DB / SQL

- SNS: `users.social_youtube_url`, `social_instagram_url`, `social_linkedin_url`, `social_website_url` — **`docs/supabase/users_member_social_urls.sql`** 미적용 시 닉네임 등만 저장되고 SNS는 안내 메시지.

---

## 4. 영향 파일

| 파일 | 내용 |
|------|------|
| `src/mypage/MyLayout.jsx` | 멤버 탭 3개·닉네임 인라인 편집 |
| `src/mypage/MemberProfile.jsx` | SNS 4필드 + Heroicons |
| `src/mypage/MemberTokensPage.jsx` | 토큰 단일 페이지 |
| `src/mypage/MemberSecurity.jsx` | 보안 |
| `src/mypage/Settings.jsx` | 구독 관리 섹션 |
| `src/member/TokenShop.jsx` | `embedded`, `onAfterRecharge` |
| `src/member/TokenHistory.jsx` | `embedded` |
| `src/App.jsx` | 라우트·리다이렉트 |
| `src/common/AppShell.jsx` | `PATH_TITLES` |
| `src/master/MasterRegister.jsx` | 취소 링크 → `/my/profile` |

레거시(미연결): `MemberSubscription.jsx`, `MemberConversations.jsx`, `MemberBecomeMaster.jsx` 참고용.
