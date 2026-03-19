# clone.me 구현 진행 상황

> 마지막 갱신: 2026-03  
> 상세 스펙은 PRD·BRAIN 참고.

---

## 최근 반영 사항 (2026-03)

| 항목 | 내용 | 참고 문서 |
|------|------|-----------|
| **채팅 UI** | Claude 스타일: 좌측 Rail(240px)·대화 목록·구독 클론, 상단 헤더(클론 아바타·배지·정보), 말풍선·출처(📄/📺 → Heroicons), 하단 입력 고정. 모바일 100dvh·햄버거 토글. | `docs/CHAT_SIDEBAR_SIDE_EFFECTS.md` |
| **아이콘 통일** | `@heroicons/react` 도입. 이모지·버튼/배지 아이콘 → Heroicons(16/20/24px, currentColor). 빈 상태 일러스트 이모지는 유지. | `docs/HEROICONS_MIGRATION.md` |
| **폰트·타이포** | 타이틀 Syne(700·800), 본문 Pretendard Variable + 시스템, 숫자/코드 Space Mono. 크기 12/14/16/18/24/32/48px, 줄간격 1.5. Nav 로고·h1~h4에 `--fn-title`. | `docs/FONT_EMOJI_SIDE_EFFECTS.md`, `docs/STYLE_GUIDE.md` |
| **이모지 정리** | 버튼·배지·태그 이모지 → Heroicons 또는 텍스트. 빈 상태(EmptyPanel·Buyer·MasterProfile 샘플 없음)만 유지. | `docs/FONT_EMOJI_SIDE_EFFECTS.md` |
| **홈 히어로** | Featured·Recommend 카드 링크 `/clone/:id` → `/chat/:id`. 히어로 섹션 `className="home-hero"`, `aria-label="메인 소개"`. 전역 스타일 충돌 방지 가이드. | `docs/HOME_HERO_SIDE_EFFECTS.md` |
| **채팅 사이드바** | Rail·오버레이 Escape 키 닫기, `aria-label`·`aria-hidden` 보강. | `docs/CHAT_SIDEBAR_SIDE_EFFECTS.md` |
| **마스터 등록 간소화** | `/master-register` 3단계 제거 → **단일 폼**(클론 이름·설명·컬러) → 제출 시 마스터(없으면 생성) + 클론 1개 생성 → 즉시 `/dashboard/:id`. 인증·자료는 대시보드·마이페이지에서 선택. | `docs/MASTER_REGISTER_SIDE_EFFECTS.md` |

---

## Phase 1 완료 ✅

- 폴더 구조 / Router / `ProtectedRoute` + **`PublicOnlyRoute`** (`/login`·`/signup`·`/signup/verified` — 로그인 시 `/` 리다이렉트)
- Supabase 연결 + DB 스키마(`schema_full_v4_2`) + RLS + `grant_public_api` 등
- 회원가입 / 로그인 / 이메일 인증 (`/signup/verified`)
- 온보딩 플로우 (`users.onboarding_completed`)
- 가입 보너스 5토큰 지급 (`signup_bonus_trigger` · `bonus_tokens` 30일)
- 공통 컴포넌트 + 모바일 대응(네비·터치·safe area 등)

---

## Phase 2 완료 ✅

- **홈 `/`** — 비로그인: BETA 뱃지·시안 그라디언트 히어로 타이틀·cyan 글로우·통계(100+/24시간/월200회)·마켓/강사 CTA · Featured·하단 회원 CTA / 멤버·마스터 동일
- **네비** — 데스크톱: 상단 홈·마켓·마이 / 모바일: 하단 탭바(동일 3탭) + 헤더 로고·로그인|내 정보 (`navShell.js`로 채팅·대시보드 등에서 탭바 숨김)
- **마켓 `/market`** — 헤더 카드·Featured 가로 스크롤(모바일)/그리드·리스트 카드(액센트 바·이미지 아바타)·필터 빈 목록·Supabase 미설정/빈 마켓/에러 UI·`LoadingSpinner` (CSS 변수만)
- **마이 `/my`** — 헤더(그라데이션·링 아바타·닉네임·멤버/마스터 뱃지·`MasterBadges`·토큰 카드 링크)·설정 텍스트 버튼·멤버/마스터 탭 라벨·`MemberProfile`·`MasterTab` 카드 폼·로딩/에러 토큰색
- **UI 공통 (5차)** — `UiStates.jsx`(`ErrorBanner`·`LoadingBlock`·`EmptyState`)·`--on-rd`·에러 배너 통일(온보딩·설정·마스터·토큰샵 등)·`MasterBadges`/Buyer/CloneDash/프로필 링크 하드코딩 색 제거·768px 가이드 STYLE_GUIDE §13
- **마이페이지** — `MyLayout` 헤더(아바타·닉네임·배지·토큰·⚙️)  
  - 멤버 탭: 프로필·토큰·구독·대화·마스터 유도  
  - 마스터 탭: 프로필·인증·내 클론·수익·단가·정산계좌 (`/my/master/*`)
- **마스터 등록** `/master-register` — **간소화:** 클론 이름·설명·컬러만 입력 → 마스터(없으면 생성) + 클론 1개 생성 → 즉시 `/dashboard/:id` 이동. 인증/자료는 나중에(대시보드·마이페이지)
- **클론 만들기** `/dashboard/create` — 추가 클론용 3단계(자료 → 클론 설정 → 출시). 마스터 없으면 `/master-register` 유도
- **설정** `/my/settings` — 알림·로그아웃 (프로필은 `/my/profile`)
- **토큰** `/my/tokens` — Mock 충전(DB·브라우저 폴백), 이용 내역·필터, `token_mock_purchase_rls.sql`
- **프로필 사진** — Storage 버킷 `avatars`, `/my/profile` 업로드
- **마스터 이력 인증** — Storage `master-verifications` + `master_verifications` INSERT, 트리거로 `is_verified` 자동
- **보너스 만료** — `expire_bonus_tokens_run()` + `cron_expire_bonus_tokens.sql` · pg_cron/수동/RPC 안내
- **배지 UI** — `MasterBadges`(✓ 검증 · 🤝 제휴), 마켓·프로필·채팅·홈·마이

---

## Phase 2.5 완료 ✅

> 배포 시 SQL 미적용이면 `match_clone_chunks` / `marketing_links` RLS 등 별도 적용.

- ~~`/api/process-file`~~ ✅ — base64 body · Claude PDF/DOCX · SRT/TXT · 청크 500/50 → `clone_chunks` · `quality_score` 재계산. 호출 시 `Authorization: Bearer <access_token>` · Vercel `ANTHROPIC_API_KEY` · `SUPABASE_SERVICE_ROLE_KEY`
  - **embedding 차원:** `vector(1536)` → **`vector(1024)`** 로 변경됨 — Supabase SQL `20260318150000_clone_chunks_embedding_voyage1024.sql` 적용 후 기존 청크 삭제 → 자료 **재처리** 필요
  - **임베딩 모델:** **`voyage-3-large`**, **`ANTHROPIC_API_KEY`** 로 호출 (Anthropic SDK / 동일 키)
  - **`VOYAGE_API_KEY` 불필요** (Vercel·로컬에서 삭제)
- ~~`/api/chat`~~ ✅ — `Authorization: Bearer` · fixed_answers 키워드 · 질문 임베딩(voyage·`ANTHROPIC_API_KEY`) · `match_clone_chunks` TOP 5 · Claude 답변 · `message_sources` · `file_reference_stats` · `{ answer, conversationId, sources }`. **SQL:** `20260319120000_match_clone_chunks.sql` 적용 필요
- ~~채팅 UI 출처 표시~~ ✅ — PDF/DOCX(파일·페이지·섹션), SRT(파일·타임스탬프), 고정답변 뱃지, `marketing_links` 키워드·빈도 기반 링크 카드. **SQL:** `20260319130000_marketing_links_chat_read.sql` (멤버가 마케팅 링크 SELECT)
- ~~클론 테스트 10가지 시나리오~~ ✅ — `CloneDash` 테스트 패널 · `/api/chat` 연동(로그인+UUID 클론) · 로컬 고정답변 폴백 · 출처·자가평가
- ~~자료별 참조 현황~~ ✅ — 인사이트 탭 `file_reference_stats` + `clone_files` 보강 조회 · 월별(이번 달 포함)/전체 합산 · 파일별 바 비교

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

---

## Side Effect 문서 (수정 전 참고)

| 문서 | 대상 |
|------|------|
| `docs/HEROICONS_MIGRATION.md` | 아이콘 교체 시 매핑·대상 파일 |
| `docs/FONT_EMOJI_SIDE_EFFECTS.md` | 폰트·이모지 변경 시 영향·순서 |
| `docs/HOME_HERO_SIDE_EFFECTS.md` | 홈 히어로 수정 시 컴포넌트·CSS·네비 |
| `docs/CHAT_SIDEBAR_SIDE_EFFECTS.md` | 채팅 UI·사이드바 수정 시 상태·API·레이아웃 |
| `docs/MASTER_REGISTER_SIDE_EFFECTS.md` | 마스터 등록·클론 생성 플로우·DB |
