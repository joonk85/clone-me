# General Settings (`/my/general`) — Side effects

> 2026-03: **General Settings** 레이아웃·**ACCOUNT INFO** 읽기 전용 블록·하단 **Reset / Cancel / Save** 정리. SNS 입력 UI는 제거( DB 컬럼 값은 로드·저장 시 유지).

## UI

- **타이틀:** `General Settings` · 서브: 플랫폼 기본 정보 안내.
- **좌:** 아바타(120px 원) · **CHANGE AVATAR** · 숨김 `input[type=file]` · Storage `avatars` + `users.avatar_url` (기존과 동일).
- **우:** **DISPLAY NAME** · **UNIQUE HANDLE (@ slug)**.
- **아래(같은 카드):** **PROFILE BIO** · `500`자 제한 · **`N / 500 characters`** 카운터.
- **ACCOUNT INFO** (별도 카드, 읽기 전용):
  - 이메일 — `user.email` · **Security** 링크(`/my/security`)로 변경 안내.
  - 가입일 — `user.created_at` (Supabase Auth).
  - 가입 경로 — `identities[0].provider` / `app_metadata.provider` → 한글·브랜드 라벨(이메일·Google 등).
  - 계정 ID — `user.id` (UUID).
- **하단:** 좌 **Reset to Defaults** (텍스트 링크 스타일) · 우 **Cancel** + **Save Changes**.

## 동작

- **Save Changes:** 기존과 동일 `updateMyUserRow` — 닉네임·핸들·바이오·아바타 URL + **SNS URL 네 컬럼**(상태에 남은 값, UI 없음).
- **Reset to Defaults / Cancel:** 마지막으로 로드·저장된 **baseline** 스냅샷으로 폼 복원 + 메시지 초기화.
- 아바타만 변경 시에도 **baseline**의 `avatar_url` 갱신.

## 제거

- 페이지 내 **SNS** 입력 블록(YouTube 등) 제거. 레거시 DB 값은 삭제하지 않으며 저장 시 기존 값 유지.

## 관련 파일

- `src/mypage/MyAccountGeneral.jsx`
- `docs/supabase/users_profile_slug_bio.sql` · `users_member_social_urls.sql` · `storage_avatars.sql` (선택/기존)

## 검증

- [ ] 2열(데스크톱) / 1열(모바일) 레이아웃
- [ ] Save 후 DB·baseline 일치
- [ ] Reset / Cancel 시 미저장 편집 취소
- [ ] ACCOUNT INFO 표시
