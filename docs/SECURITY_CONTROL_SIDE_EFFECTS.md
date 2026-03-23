# Security Control (`/my/security`) — Side effects

> 2026-03: 멤버 계정 **Security** 화면을 **Security Control** 스펙으로 정리. CSS 변수·Heroicons만 사용.

## UI

- **타이틀:** `Security Control` / 서브: 계정 보호·활성 세션 안내.
- **Email** — 현재 주소 표시 + 새 이메일 + **이메일 변경 요청** (`auth.updateUser({ email })`). **General** (`/my/general`) ACCOUNT INFO에서는 이메일 **읽기 전용** + Security 링크.
- **1. Password** — 영문 라벨(Current/New/Confirm), **Update Password** 버튼. 기존 `updateUser({ password })` + 현재 비밀번호 재검증 흐름 유지.
- **2. Active Sessions** — 세션 행: 기기명 + **CURRENT** 뱃지(현재 세션), 브라우저·접속 시각, 행 우측 **로그아웃 아이콘** (`ArrowRightOnRectangleIcon`). **LOG OUT ALL OTHER DEVICES** → `supabase.auth.signOut({ scope: 'others' })`.
- **3. Security Log** — 로그인 성공/실패·비밀번호 변경 이력, 성공 기본색·실패 `var(--rd)`. **VIEW FULL SECURITY HISTORY** 로 로컬 목록 전체 토글.
- **4. Danger zone** — 계정 삭제(빨간 버튼) + 확인 모달(MVP는 안내만).

## Active Sessions — 데이터 소스

- **`auth.sessions` 직접 조회**는 브라우저 anon 키로는 불가. 구현은 다음 순서:
  1. `GET {SUPABASE_URL}/auth/v1/user/sessions` 및 `GET .../auth/v1/sessions` + `Authorization: Bearer <access_token>` + `apikey` 시도 (`src/lib/authSessions.js`).
  2. 실패·빈 응답 시 **현재 JWT**(`session_id` 클레임) + `navigator.userAgent`로 **이 기기 1행**만 표시.
- **개별 세션 DELETE** (`/auth/v1/sessions/:id`) 시도 후 실패 시 안내 문구(안정 API 미노출 프로젝트 대비).

## Security Log — 로컬 저장

- `localStorage` 키 `clone_me_security_log_v1` (`src/lib/securityLocalLog.js`).
- **로그인 페이지** (`Login.jsx`): 성공 시 `login_success`, 실패 시 `login_failed` 기록(실패 상세는 고정 문구로 노출 최소화).
- **비밀번호 변경 성공** 시 `password_changed` 기록.
- 서버 감사 테이블은 Phase 3에서 `docs`에 별도 정의 가능.

## 관련 파일

- `src/mypage/MyAccountSecurity.jsx`
- `src/lib/authSessions.js`, `src/lib/securityLocalLog.js`, `src/lib/supabase.js` (`getSupabaseAuthConfig`)
- `src/auth/Login.jsx`

## 검증

- [ ] 비밀번호 변경 → 로그에 비밀번호 변경 항목
- [ ] 로그인 실패/성공 → Security Log 반영
- [ ] LOG OUT ALL OTHER DEVICES → 에러 없이 완료(다른 기기만 해제)
- [ ] 현재 행 로그아웃 아이콘 → 이 기기 로그아웃 확인
