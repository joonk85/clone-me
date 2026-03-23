# 🧠 BRAIN.md — clone.me 프로젝트 기억
> 모든 에이전트는 작업 시작 전 이 파일을 읽습니다.
> 새로운 결정사항은 반드시 이 파일에 업데이트하세요.
> 마지막 업데이트: 2026.03 (PRD v4.2 기준 · 플랫폼 구독 모델 반영)
> ⚠️ 이 파일이 모든 판단의 기준입니다.
> 구현 완료·미완료 요약: **`docs/PROGRESS.md`** (에이전트는 가벼운 작업 시 BRAIN + PROGRESS, 무거운 작업 시 + PRD)

---

## 제품 한 줄 요약
**clone.me** — 마스터(전문가)가 자료를 올리면 AI 클론이 생성되어 멤버와 1:1 대화하는 한국 최초 지식 클론 플랫폼

---

## 핵심 용어

| 용어 | 정의 |
|---|---|
| 마스터 | 지식/경험을 공유하는 전문가 |
| 멤버 | 마스터 클론과 대화하는 유저 |
| 클론 | 마스터의 지식을 학습한 AI 에이전트 |
| 구매 토큰 | 결제 구매. 만료 없음. 보너스 소진 후 차감 |
| 보너스 토큰 | 무료 지급. 지급일 +30일 만료. 먼저 차감 |
| 플랫폼 구독 | 멤버 요금제 **Free / Basic / Pro / Ultimate**. 월간 토큰 지급·혜택은 플랜별 (DB 연동은 Phase 3 `platform_subscriptions` 등) |
| 1턴당 토큰 | 클론(마스터)마다 **대화 1턴 소모 토큰**을 마스터가 설정. UI·채팅에 **원화 참고**(예: 1토큰=₩100) 표시 |
| 클론 구독 (레거시) | PRD 초기안의 클론별 월 구독 — **사업 방향은 플랫폼 구독으로 이관**. 스키마에 `clone_subscriptions`가 남아 있어도 **제품 기준 과금은 플랫폼 플랜 + 토큰** |
| 패스 구독 (레거시) | 구 패스 월정액 모델 — **플랫폼 유료 플랜으로 대체** |
| 제휴 마스터 | 플랫폼 계약 파트너 (MVP: DB 직접 지정) |
| 청크 | 자료를 분할한 텍스트 단위 (RAG) |
| 임베딩 | 텍스트를 벡터로 변환한 수치 |

---

## 인프라 (확정)

```
Frontend:   React 18 + Vite 4 / React Router v6
Deploy:     Vercel (MVP) → AWS (Live)
AI 채팅:    MVP: Anthropic Claude (claude-sonnet-4-6) 전용
            Live(AWS): Claude + Google Gemini 병용 (채팅 답변 생성)
            ※ 텍스트 추출·임베딩 모두 ANTHROPIC_API_KEY (Claude 문서 API + voyage-3 embeddings)
Embedding:  Anthropic SDK `embeddings.create({ model: 'voyage-3', input })` → vector 차원은 DB와 일치 필요 (`/api/process-file`)
DB:         Supabase (PostgreSQL + pgvector)
  URL:      https://rhsbpfjscobjdrzqymjx.supabase.co
Storage:    Supabase Storage (원본 파일 영구 보관)
Auth:       Supabase Auth (이메일 + 비밀번호만)
CRON:       Supabase Edge Functions
결제:        미연결 (Phase 3)
```

---

## MVP 운영 원칙

| 기능 | MVP | 추후 |
|---|---|---|
| 이력 인증 | 서류 업로드 즉시 자동 승인 + ✓ 배지 | 어드민 수동 검토 |
| 마스터 등록 | 즉시 활성화 | 어드민 검토 |
| 제휴 마스터 | DB 직접 수정 | 어드민 페이지 |
| 결제/정산 | Mock | 토스페이먼츠 |
| 신고/제재 | 접수만 | 어드민 처리 |
| 리포트 다운로드 | UI만 | 실제 PDF/CSV |
| RAG | 텍스트 청크 + pgvector | 고도화 |
| 클론 테스트 | 10개 시나리오 + 리포트 | AI 자동 점수 |
| AI 채팅 모델 | Claude 전용 (Vercel) | Claude + Gemini 병용 (AWS) |

---

## 핵심 상수

```js
FREE_BASE = 5       // 클론당 무료 체험 기본 횟수 (비구독·체험 UX)
FREE_BONUS = 10     // 설문 완료 시 추가 횟수
MONTHLY_CAP = 200   // (레거시/채팅 한도 참고) 플랫폼 플랜·토큰 잔액이 실제 이용 한도
MAX_CLONES = 3      // 마스터당 최대 클론 수
MAX_DISCOUNT = 80   // 최대 할인율 (%)
MIN_TOKEN_PRICE = 1 // 최소 1턴당 토큰 단가 (마스터 설정 하한)
TOKEN_KRW_REF = 100 // UI·안내용: 1토큰 ≈ ₩100 (실결제 요율과 별도)
CHUNK_SIZE = 500    // 청크당 최대 토큰 수 (RAG)
TOP_K_CHUNKS = 5    // 답변 시 참조 청크 수
```

---

## 비즈니스 결정사항

### 계정 구조 (에어비앤비 모델)
- 멤버로 가입 → 마이페이지에서 마스터 등록 → **마스터 스튜디오** ` /my/master/*` 는 **fixed 좌측 마스터 레일 + 우측 콘텐츠**. 레일에서 **내 클론 클릭 → `/dashboard/:id` 상세** 연동.
- 마이 **멤버 계정 허브** `/my/*`: **`/my` 진입 시 앱 Left Rail 숨김**, 좌측 **fixed 계정 메뉴(268px)** 가 대체 — **General**(**General Settings**: 프로필 폼·읽기 전용 계정 정보·Reset/Cancel/Save) · **Security**(**Security Control**: 비밀번호·활성 세션·로컬 보안 로그·계정 삭제) · **Subscription & Usage**(**Current/Upgrade** 탭·계정/토큰 카드·이용 테이블·Mock 빌링·플랜 카드) · **Notifications** · **Go to My Master AI** → `/my/master/*`. **`/settings`** 는 `/my/general` 로 리다이렉트.
- 소셜 로그인 없음 (법인 미설립)

### 수익
- 마스터 75% / 플랫폼 25%
- 단가: 마스터 자유 설정 (최소 1토큰, 상한 없음)
- UI: 슬라이더 + 숫자 입력 필드 동시 제공

### 플랫폼 구독 (멤버) — **현행 비즈니스 모델**
- **Free**: 가입 보너스 **5토큰** (기존 보너스 정책과 병행 · 30일 만료 등은 PRD/DB)
- **Basic**: 월 **₩9,900** → 매월 **50토큰** 지급 (Mock/UI: `platformPlans` · 실결제·자동 지급 Phase 3)
- **Pro**: 월 **₩29,000** → 매월 **150토큰** 지급
- **Ultimate**: 월 **₩59,000** → 매월 **400토큰** 지급
- 멤버는 **보유 토큰으로 어떤 마스터 클론과도 대화** 가능 (클론별 별도 월 구독 불필요)
- **클론마다 1턴당 토큰 소모량은 마스터 설정** (최소 `MIN_TOKEN_PRICE`). 마스터 클론 설정 UI에 **원화 환산 안내** 표시 — 예: **3토큰/턴 ≈ 약 ₩300/턴** (`1토큰 = ₩100` 기준, `TOKEN_KRW_REF`)
- 토큰 **소진 시 추가 충전** 가능 (기존 토큰 패키지·TokenShop Mock 등)
- 공개 페이지 **`/pricing`**: 플랜 4종 비교·연간 20% 표시·Mock 저장(localStorage). 앱 **상단 헤더**(멤버 모드)에 플랜 뱃지 + Free일 때 **업그레이드** CTA — **Left Rail 하단**에는 토큰/플랜 뱃지 없음 (`/settings`·구독 섹션으로 일원화)

### 토큰 (충전·차감)
- 충전: 50T/₩5,000 · 110T/₩10,000 · 350T/₩30,000 (패키지 예시, PRD와 동기)
- 가입 보너스 5토큰 (30일 만료)
- 보너스 먼저 차감 → 구매 토큰

### 무료 체험
- 클론당 5회 (FREE_BASE)
- 설문 완료 +10회 (FREE_BONUS)
- free_trial_usage 테이블로 클론별 독립 추적

### 레거시: 패스 / 클론별 월구독
- 구 **패스 ₩29,000**·**클론 구독** 중심 서술은 **플랫폼 구독**으로 대체
- DB에 `clone_subscriptions` 등이 남아 있으면 **마이그레이션·RLS 정리는 Phase 3**에서 `platform_subscriptions`와 함께 검토

### 마스터 배지
- ✓ 검증: 서류 업로드 즉시 (MVP 자동)
- 🤝 제휴: DB 직접 수정 (MVP)

### 클론
- 최대 3개 / 클론별 독립 색상·아바타·단가·설정
- 비활성화: 마켓 숨김, 기존 대화 유지
- 탈퇴: 클론 비활성화, 대화이력 90일 후 삭제

### 마케팅 빈도
- low(20회 중 1) / medium(7회, 권장) / high(3회)

### 환불
- 구매 토큰: 없음 (장애 제외)
- 보너스 토큰: 없음, 만료 자동 소멸

---

## 클론 품질 시스템

### 자료 카테고리 (5가지)
```
A. 어투/스타일 (30%) — SRT 자막, SNS, 뉴스레터 ← 가장 중요
B. 핵심 지식 (40%)  — 강의 스크립트, PDF, 블로그, Notion
C. 케이스/경험 (20%) — 실제 사례, 실패담 (구조화 템플릿)
D. 판단 기준 (선택) — 추천/비추천, 원칙
E. 고정 답변        — AI보다 우선 적용
```

### 품질 점수 (0~100)
```
어투: 0/30  (SRT+15, SNS/뉴스레터+15)
지식: 0/40  (파일+15, 1만자+10, 5만자+10, Notion+5)
케이스: 0/20 (케이스5개+10, 판단기준+10)
고정답변: 0/10 (Q&A 5개+10)
색상: 75+초록 / 50~74 cyan / ~49 amber
```

### RAG 핵심 원칙
- **원본 파일 영구 보관** (삭제 시 출처 정확도 하락, 할루시네이션 증가)
- 텍스트 추출: PDF/DOCX → Claude API / SRT → 직접 파싱 / TXT → 직접 사용
- 추출된 텍스트를 .txt로 Storage 추가 저장 후 청크 분할
- 텍스트 → 청크(500토큰, overlap 50) → pgvector 임베딩
- 답변 시 TOP_K=5 청크 검색 → 출처 함께 반환
- 채팅 UI: 📄 파일명·페이지 / 📺 타임스탬프 표시
- 마케팅 링크와 출처 자동 연결

### 런칭 전 테스트 (10가지 시나리오)
자기소개 / AI정체성 / 핵심지식 / 어투 / 범위외 /
케이스 / 반론 / 추천 / 감정 / 연속일관성
→ ✅/⚠️/❌ 결과 리포트 → 마스터 합격 판단 후 출시

---

## 현재 구현 상태

### ✅ 완료 (데모 v28)
마켓플레이스 / 마스터 프로필(샘플대화탭) / 채팅(첫메시지·설문·피드백·전환카드)
클론 대시보드 4탭 / 클론 만들기 3단계 / 멤버 대시보드
고정 답변 / 클론 테스트(자유형) / 버전 히스토리
유사도 게이지 / 보안 설정 / 마케팅 링크 / 리포트

### Phase 2.5 완료 (RAG·대시보드 인사이트)
`/api/process-file` · `/api/chat`(RAG·고정답·`file_reference_stats`) · 채팅 출처·마케팅 링크 · 클론 테스트 10시나리오 · **인사이트「자료별 참조 현황」** (`CloneDash`)

### ❌ 남은 큰 덩어리
Phase 3 실결제 / Phase 4 어드민·리포트 다운로드 등 · 일부 화면 Mock 데이터 · 모바일 추가 폴리싱

---

## URL 구조

```
공개: / (비로그인 히어로: 지식 클론 플랫폼·한국 최초·BETA / 그라디언트 타이틀 / 마켓·강사 등록 CTA) /login /signup /signup/verified /market …
  ※ `/login`·`/signup`·`/signup/verified`: `PublicOnlyRoute` — 이미 로그인 시 `/`로 리다이렉트
  ※ 가입 메일 Redirect: /signup/verified → 세션 확정 후 /my (온보딩 미완이면 ProtectedRoute가 /onboarding)
보호: /onboarding /settings /my /my/master (/my/general·subscription 등)
      /chat/:cloneId /master-register /dashboard /dashboard/:cloneId /dashboard/create
```

## 네비게이션
- 멤버: 홈 / 마켓 / 대화 / 마이
- 멤버+마스터: 홈 / 마켓 / 대화 / 대시보드 / 마이

---

## 파일 구조

```
clone-me/
├── .cursorrules
├── agents/ (BRAIN/HOWTO/PM/UXUI/BRAND/RESEARCH/ARCHITECT/DEV/QA/LEGAL)
├── docs/ (PRD_v4.2.md / STYLE_GUIDE.md)
├── src/
│   ├── components/
│   │   ├── common/ (Av/Bt/Cd/Sw/Tg/Pb/LoadingSpinner/ErrorMessage)
│   │   ├── auth/ (Login/Signup/Verified/Onboarding)
│   │   ├── master/ (CloneDash[index/Overview/CloneManage/Insight/Ops] / MyClones/Create/MasterRegister)
│   │   ├── member/ (Market/Chat/Buyer/TokenShop/TokenHistory)
│   │   ├── mypage/ (MyPage/MemberTab/MasterTab/Settings)
│   │   ├── profile/ (MasterProfile)
│   │   └── pages/ (Home/Terms/Privacy/NotFound/ServerError)
│   ├── lib/ (supabase.js / anthropic.js / tokens.js)
│   ├── hooks/ (useAuth/useToken/useClone/useWindowSize)
│   └── App.jsx / main.jsx
├── api/ (chat.js / tokens.js / process-file.js)
├── supabase/functions/expire-bonus-tokens/
└── .env
```

---

## DB 테이블 목록 (전체)

```
users / masters / master_verifications
clones / clone_files / clone_chunks (pgvector)
clone_version_history / fixed_answers / demo_qa
clone_products / clone_updates / survey_questions / survey_responses
clone_notices / marketing_links
clone_subscriptions / free_trial_usage / monthly_usage
token_balances / bonus_tokens / token_transactions / pass_subscriptions
  ※ 멤버 과금 방향: **platform_subscriptions** (Phase 3) + 토큰 잔액. `clone_subscriptions`·`pass_subscriptions`는 레거시/이관 검토 대상
conversations / messages / message_sources / file_reference_stats
feedbacks / feedback_helpful / reports
clone_analytics_monthly / settlements
```

---

## 작업 우선순위

Phase 1: 기반(Router/DB/인증/온보딩/5토큰)
Phase 2: 마이페이지+계정+토큰Mock+CRON
Phase 2.5: RAG파이프라인+출처표시+테스트시나리오
Phase 3: 결제(사업자등록후)
Phase 4: 어드민+YouTube자막+리포트다운로드

---

## 주요 결정 로그

| 날짜 | 결정 | 이유 |
|---|---|---|
| 2026.03 | 카카오 로그인 제외 | 법인 미설립 |
| 2026.03 | MVP 이력인증 자동승인 | 어드민 미개발 |
| 2026.03 | 토큰 결제 Mock | 사업자 등록 전 |
| 2026.03 | 에어비앤비 계정 모델 | 전환율 최적화 |
| 2026.03 | 마스터 단가 자유설정 | 마스터 자율성 |
| 2026.03 | 플랫폼 할인 차액 부담 | 마스터 수익 보장 (초기) |
| 2026.03 | 원본 파일 영구 보관 | 출처 정확도 + 할루시네이션 방지 |
| 2026.03 | RAG + 출처 표시 | 마스터 신뢰 + 마케팅 링크 연결 |
| 2026.03 | 런칭 전 10가지 테스트 | 마스터가 직접 품질 판단 |
| 2026.03 | 자료 카테고리 A~E | 어투(암묵적 지식) 학습 필수 |
| 2026.03 | MVP AI = Claude 전용 | 단순화, 빠른 배포 |
| 2026.03 | Live(AWS) AI = Claude + Gemini 병용 | 채팅 답변 품질/비용 최적화 |
| 2026.03 | 텍스트 추출·임베딩은 Claude 고정 | 일관성, voyage-3 성능 |
| 2026.03 | **멤버 과금 = 플랫폼 구독 + 토큰** (Free/Basic/Pro/Ultimate) | 클론별 월구독·패스 중심에서 전환. 유료 플랜은 월 토큰 지급, 모든 클론 대화는 토큰·체험 정책으로 통일 |
| 2026.03 | **1턴당 토큰 = 마스터 설정 + ₩100/토큰 UI 참고** | 클론마다 단가 다름, 채팅·설정에 원화 안내 |

---

## PRD v4.2 최종 수정사항 (2026.03 추가)

### DB 스키마 수정

**masters 테이블 — slug 필드 추가**
```sql
slug text UNIQUE  -- clone.me/@{slug} 공유 링크용
```
- 마스터 등록 시 자동 생성 (이름 기반, 중복 시 숫자 suffix)
- 공유 링크: `clone.me/@{slug}`
- Phase 2에서 slug 자동 생성 구현 필요

**clone_subscriptions — UNIQUE 제약 변경** (레거시 테이블 · 제품 기준 과금은 플랫폼 구독)
```sql
-- 기존 UNIQUE(user_id, clone_id) → 제거
-- 재구독 허용 (취소 후 재구독 가능)
-- 대신 partial index:
CREATE UNIQUE INDEX ON clone_subscriptions(user_id, clone_id)
  WHERE status = 'active';
```
- **비즈니스**: 멤버는 **플랫폼 플랜 + 토큰**으로 모든 클론과 대화. `clone_subscriptions`는 DB 잔존 시 마이그레이션·정리만 검토.

**file_reference_stats — UNIQUE 강화**
```sql
-- 기존: UNIQUE(file_id, period)
-- 수정: UNIQUE(file_id, clone_id, period)  ← 파일+클론+기간 조합
```

### 클론 설정 수정

**security_delete_after_training 기본값**
- DB: `DEFAULT false` (원본 보관 = OFF가 기본)
- UI: "[기본 OFF] ← 원본 보관 권장" 표시
- ON 설정 시 경고: "출처 표시 정확도 하락"

**클론 만들기 Step 2 — 컬러 선택 추가**
- 컬러 피커 UI 추가
- 기본값: #63d9ff (cyan)
- 추천 팔레트 6개 제공
- 아바타/카드/채팅 UI에 즉시 반영

### 인프라 주의사항

**process-file 파일 전달 방식**
- 클라이언트에서 파일을 base64로 변환 후 req.body에 포함 (MVP/AWS 공통)
- AWS Lambda는 body 한도가 충분히 크므로 별도 처리 불필요
- DEV.md "process-file 파일 전달 방식" 패턴 참조

### Phase 2 추가 작업 (v28 하드코딩 → DB 연동)

```
- [ ] 마켓플레이스 DB 연동 (v28 하드코딩 → Supabase)
- [ ] 채팅 DB 연동 (무료체험 추적 포함)
- [ ] 마스터 프로필 DB 연동 (샘플대화/상품/업데이트/피드백)
- [ ] 클론 대시보드 DB 연동 (개요/인사이트/운영 탭)
- [ ] 마스터 slug 자동 생성 (등록 시)
```
