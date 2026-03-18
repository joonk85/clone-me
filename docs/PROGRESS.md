# clone.me 구현 진행 상황

> 마지막 갱신: 2026-03  
> 상세 스펙은 PRD·BRAIN 참고.

---

## Phase 1 완료 ✅

- 폴더 구조 / Router / Protected Routes
- Supabase 연결 + DB 스키마(`schema_full_v4_2`) + RLS + `grant_public_api` 등
- 회원가입 / 로그인 / 이메일 인증 (`/signup/verified`)
- 온보딩 플로우 (`users.onboarding_completed`)
- 가입 보너스 5토큰 지급 (`signup_bonus_trigger` · `bonus_tokens` 30일)
- 공통 컴포넌트 + 모바일 대응(네비·터치·safe area 등)

---

## Phase 2 완료 ✅

- **홈 `/`** — 비로그인(히어로·통계·Featured·CTA) / 멤버(최근 대화·추천·토큰) / 마스터(클론·미답변 피드백)
- **마이페이지** — `MyLayout` 헤더(아바타·닉네임·배지·토큰·⚙️)  
  - 멤버 탭: 프로필·토큰·구독·대화·마스터 유도  
  - 마스터 탭: 프로필·인증·내 클론·수익·단가·정산계좌 (`/my/master/*`)
- **마스터 등록** `/master-register` — 3단계(기본정보·인증 선택·완료), URL **slug 입력·검증**, `masters` + `users.role`·`has_master_profile`
- **클론 만들기** `/dashboard/create` — 3단계 마법사, **테마 컬러피커**, 토큰/턴, Supabase `clones` INSERT
- **설정** `/my/settings` — 알림·로그아웃 (프로필은 `/my/profile`)
- **토큰** `/my/tokens` — Mock 충전(DB·브라우저 폴백), 이용 내역·필터, `token_mock_purchase_rls.sql`
- **프로필 사진** — Storage 버킷 `avatars`, `/my/profile` 업로드
- **마스터 이력 인증** — Storage `master-verifications` + `master_verifications` INSERT, 트리거로 `is_verified` 자동
- **보너스 만료** — `expire_bonus_tokens_run()` + `cron_expire_bonus_tokens.sql` · pg_cron/수동/RPC 안내
- **배지 UI** — `MasterBadges`(✓ 검증 · 🤝 제휴), 마켓·프로필·채팅·홈·마이

---

## Phase 2.5 미완료 ❌

- `/api/process-file` (RAG 파이프라인)
- `/api/chat` (pgvector 검색 + 출처)
- 채팅 UI 출처 표시
- 클론 테스트 10가지 시나리오
- 자료별 참조 현황

---

## Phase 3 미완료 ❌

- 토스페이먼츠 실제 결제

---

## Phase 4 미완료 ❌

- 어드민
- YouTube 자막
- AWS + Gemini

---

## 알려진 이슈

- **CSP / `eval()` 경고** — 개발 환경(Vite HMR 등), 우선순위 낮음

---

## 🚫 절대 구현하지 말 것 (MVP 범위 외)

- **실제 결제 (토스페이먼츠)** — Phase 3 전 금지
- **어드민 페이지** — Phase 4
- **YouTube 자막 자동 추출** — Phase 4
- **Gemini AI** — Live(AWS) 전용, MVP는 Claude만
- **SNS 텍스트 자동 수집** — Phase 4
- **리포트 PDF/CSV 실제 생성** — Phase 4
- **소셜 로그인 (카카오 등)** — 법인 미설립
- **`security_delete_after_training` 기본값 ON** — 원본 보관이 기본

---

## ⚠️ 주의사항 (Cursor가 자주 틀리는 것)

- **CSS Variables 대신 하드코딩 컬러 사용 금지**
- **base64 body 방식 변경 금지** (Storage URL 방식 쓰지 말 것)
- **`clone_subscriptions` UNIQUE 제약 추가 금지** (partial index만)
- **`pass_subscriptions` 차감 시** `monthly_usage`가 아닌 **`pass_balance`에서 차감**
- **MVP에서 `AI_PROVIDER` 분기 코드 추가 금지**

---

## 컴포넌트 의존성 맵

**토큰 변경 시 영향:**

- `token_balances` → MyPage잔액 / Chat차감 / TokenShop충전
- `bonus_tokens` → CRON / token_transactions / 잔액표시

**채팅 변경 시 영향:**

- `Chat.jsx` → token_balances / conversations / messages / free_trial_usage
- `api/chat.js` → clone_chunks / message_sources / file_reference_stats

**마스터/클론 변경 시 영향:**

- `clones` → Market / Dashboard / Chat헤더 / MyClones
- `masters` → 배지 / slug / 프로필

---

## 에이전트 호출 시 참조 순서

| 작업 규모 | 참조 |
|-----------|------|
| 가벼운 작업 | `@agents/BRAIN.md` `@docs/PROGRESS.md` |
| 무거운 작업 | `@agents/BRAIN.md` `@docs/PROGRESS.md` `@docs/CLONE_ME_PRD_v4_2.md` |

> PRD 파일명: 저장소 기준 `docs/CLONE_ME_PRD_v4_2.md` (v4.2). `docs/PRD_v4.2.md` 별칭이 필요하면 동일 내용으로 링크·복사.
