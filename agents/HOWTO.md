# 📖 에이전트 사용 가이드
> clone.me Cursor 멀티에이전트 시스템 (PRD v4.2 기준)

---

## 폴더 구조

```
clone-me/
├── .cursorrules           ← Cursor 전역 규칙 (자동 읽힘)
├── agents/
│   ├── BRAIN.md           ← 🧠 프로젝트 전체 기억 (항상 먼저)
│   ├── HOWTO.md           ← 📖 이 파일
│   ├── PM.md              ← 🎯 Product Manager
│   ├── UXUI.md            ← 🎨 UX/UI Designer
│   ├── BRAND.md           ← 🎭 Brand Designer
│   ├── RESEARCH.md        ← 🔬 Research
│   ├── ARCHITECT.md       ← 🏗️ Tech Architect (RAG 설계)
│   ├── DEV.md             ← 💻 Developer (RAG 코드)
│   ├── QA.md              ← 🧪 QA (10가지 테스트 시나리오)
│   └── LEGAL.md           ← ⚖️ Legal
├── docs/
│   ├── PRD_v4.2.md        ← 현재 최신 PRD (모든 이전 버전 대체)
│   └── STYLE_GUIDE.md
└── src/                   ← 실제 코드
```

---

## 에이전트 호출 방법

Cursor에서 Cmd+L (Mac) / Ctrl+L (Win)

```
# 기본 패턴
@agents/BRAIN.md @agents/[에이전트].md [요청]
```

---

## 상황별 에이전트 조합

### 새 기능
```
@agents/BRAIN.md @agents/PM.md @agents/UXUI.md @agents/DEV.md
@docs/PRD_v4.2.md @docs/STYLE_GUIDE.md
[기능명] 만들어줘. 모바일 대응 포함.
```

### UI 컴포넌트
```
@agents/BRAIN.md @agents/UXUI.md @agents/DEV.md @docs/STYLE_GUIDE.md
[컴포넌트명] 만들어줘. CSS Variables 사용, 모바일 분기 포함.
```

### RAG 파이프라인
```
@agents/BRAIN.md @agents/ARCHITECT.md @agents/DEV.md
@docs/PRD_v4.2.md
RAG [작업] 구현해줘.
```

### DB 설계
```
@agents/BRAIN.md @agents/ARCHITECT.md
[테이블/기능] DB 설계해줘.
```

### 버그 수정
```
@agents/BRAIN.md @agents/DEV.md @agents/QA.md
[버그 내용]: [재현 방법]
```

### 클론 품질 관련
```
@agents/BRAIN.md @agents/PM.md @agents/ARCHITECT.md @agents/DEV.md
클론 품질 [기능] 구현해줘.
```

### 법적 검토
```
@agents/BRAIN.md @agents/LEGAL.md
[내용] 법적으로 어떻게 처리해야 해?
```

---

## BRAIN.md 업데이트 규칙

새로운 결정 → 반드시 BRAIN.md 업데이트

```
@agents/BRAIN.md
[결정사항]을 BRAIN.md [해당 섹션]에 추가해줘.
주요 결정 로그에도 날짜와 함께 기록해줘.
```

---

## Phase 1 시작 명령어

아래를 Cursor에 그대로 붙여넣으세요:

```
@agents/BRAIN.md @agents/ARCHITECT.md @agents/DEV.md
@docs/PRD_v4.2.md @docs/STYLE_GUIDE.md

Phase 1 시작할게. 순서대로 해줘:

1. src/App.jsx 컴포넌트별 분리
   - common/ (Av, Bt, Cd, Sw, Tg, Pb, LoadingSpinner, ErrorMessage)
   - auth/ (Login, Signup, Verified, Onboarding)
   - member/ (Market, Chat, Buyer, TokenShop, TokenHistory)
   - master/ (MyClones, CloneDash/[index,Overview,CloneManage,Insight,Ops], Create, MasterRegister)
   - mypage/ (MyPage, MemberTab, MasterTab, Settings)
   - profile/ (MasterProfile)
   - pages/ (Home, Terms, Privacy, NotFound, ServerError)
   - lib/ (supabase.js, anthropic.js, tokens.js)
   - hooks/ (useAuth, useToken, useClone, useWindowSize)

2. React Router v6 설정 (PRD_v4.2.md URL 구조 참조)
   - Protected Routes 구현
   - 로그인 후 리다이렉트 로직

3. Supabase 클라이언트 + pgvector 활성화

4. DB 스키마 전체 생성 (PRD_v4.2.md DB 스키마 섹션 참조)
   - pgvector 확장 포함
   - clone_chunks, message_sources, file_reference_stats 포함

5. Supabase RLS 설정

6. 이메일 로그인 / 회원가입 / 이메일 인증 완료 페이지

7. 온보딩 플로우 (역할 선택 → 멤버/마스터)

8. 가입 시 보너스 5토큰 자동 지급
   - bonus_tokens 테이블에 30일 만료로 삽입
   - token_balances 생성

9. useWindowSize hook (isMobile 768px)

10. 공통 컴포넌트 구현 (STYLE_GUIDE.md 참조)

스타일: STYLE_GUIDE.md 기준. 모바일 대응 포함.
한 번에 하나씩, 완료되면 다음 진행.
```

---

## Phase 2 시작 명령어

```
@agents/BRAIN.md @agents/UXUI.md @agents/DEV.md
@docs/PRD_v4.2.md @docs/STYLE_GUIDE.md

Phase 2 시작할게. 순서대로 해줘:

1. 홈 페이지 (/) — 3가지 상태
   - 비로그인: 히어로 + 통계 바 + Featured 마스터 미리보기 + CTA
   - 멤버 로그인: 최근 대화 + 추천 마스터 + 토큰 잔액
   - 마스터 로그인: 클론 현황 + 미답변 피드백 알림

2. 마이페이지 전체 (/my, /my/master)
   - 상단 헤더: 프로필사진 + 닉네임 + 배지 + 토큰잔액 + ⚙️
   - 멤버 탭: 프로필 / 토큰관리 / 구독관리 / 대화기록 / 마스터등록유도
   - 마스터 탭: 프로필 / 인증배지 / 내클론 / 수익 / 단가설정 / 정산계좌

3. 마스터 등록 플로우 (/master-register)
   - Step 1: 기본 정보 (이름/직함/시그니처/태그)
   - Step 2: 인증 선택 (바로 시작 / 서류 업로드 → 즉시 자동 승인)
   - Step 3: 완료 → 첫 클론 만들기
   - 완료 시 masters.slug 자동 생성 (DEV.md 참조)

4. 클론 만들기 (/dashboard/create) — 3단계
   - Step 1: 자료 업로드 (카테고리 A~D 가이드 포함, 품질 점수 실시간)
   - Step 2: 클론 설정 (익명토글 + 이름/부제 + 컬러피커 + 단가 슬라이더)
   - Step 3: 출시 요약

5. 설정 페이지 (/my/settings)
   - 알림 설정 / 이용약관 / 계정관리 / 로그아웃

6. 토큰 구매 + 이용내역 (/my/tokens) — Mock 결제

7. 프로필 사진 업로드 (Supabase Storage)

8. 마스터 이력 인증 (서류 업로드 → 즉시 is_verified=true + ✓ 배지)

9. 보너스 토큰 만료 CRON (supabase/functions/expire-bonus-tokens/)

10. 배지 시스템 UI (✓ / 🤝 — 카드, 프로필, 채팅 헤더)

-- v28 하드코딩 → DB 연동 --

11. 마켓플레이스 DB 연동 (masters + clones 테이블에서 실제 데이터)

12. 채팅 DB 연동
    - free_trial_usage 추적 (클론당 5회)
    - monthly_usage 추적 (구독자 200회 한도)
    - 실제 대화 저장 (conversations + messages)

13. 마스터 프로필 DB 연동 (demo_qa / clone_products / clone_updates / feedbacks)

14. 클론 대시보드 DB 연동 (clone_analytics_monthly / feedbacks / file_reference_stats)

PRD_v4.2.md DB 스키마 참조. 모바일 대응 포함. 한 번에 하나씩.
```

---

## Phase 2.5 RAG 시작 명령어

```
@agents/BRAIN.md @agents/ARCHITECT.md @agents/DEV.md
@docs/PRD_v4.2.md

Phase 2.5 RAG 파이프라인 시작할게:

1. vercel.json 설정
   { "functions": { "api/process-file.js": { "maxDuration": 60 } } }

2. /api/process-file.js
   - 클라이언트에서 파일을 base64로 변환 후 req.body에 포함
   - DEV.md의 "process-file 파일 전달 방식" 패턴 참조

   - PDF/DOCX: Claude API 텍스트 추출
   - SRT: 직접 파싱 (타임스탬프 보존)
   - TXT: 직접 사용
   - 청크 분할 (500토큰, overlap 50)
   - Anthropic voyage-3 임베딩 → clone_chunks 저장
   - quality_score 재계산

3. /api/chat.js 업그레이드
   - pgvector 유사도 검색 TOP_K=5
   - fixed_answers 우선 확인
   - 출처 정보 + 답변 반환
   - message_sources 기록
   - file_reference_stats 업데이트

4. Chat.jsx 출처 표시 UI
   - PDF → 파일명 + 페이지 + 섹션
   - SRT → 파일명 + 타임스탬프
   - 마케팅 링크 자동 연결

5. 클론 테스트 10가지 시나리오 UI
   - 구조화 테스트 모드
   - ✅/⚠️/❌ 결과 리포트

6. 인사이트 탭 > 자료별 참조 현황
   - file_reference_stats UNIQUE(file_id, clone_id, period) 확인
   - 파일별 월 참조 횟수 바 차트
```

---

## 주의사항

1. **항상 BRAIN.md 먼저** — 모든 작업 전 컨텍스트 확인
2. **PRD v4.2가 최신** — 이전 버전 무시
3. **원본 파일 삭제 금지** — security_delete_after_training 기본 false (OFF)
4. **process-file 파일 전달** — base64 req.body 방식 사용 (MVP/AWS 공통)
5. **slug 자동 생성** — 마스터 등록 시 DEV.md 패턴 적용
6. **재구독 허용** — clone_subscriptions는 partial index (active만 UNIQUE)
7. **MVP 범위** — 어드민, 실제 결제, Gemini는 Live(AWS) 전용
8. **스타일 일관성** — STYLE_GUIDE.md CSS Variables 항상 사용
9. **모바일 필수** — isMobile 분기 모든 컴포넌트
