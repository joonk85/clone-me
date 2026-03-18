# clone.me — PRD v4.2 (Final Complete)
> Cursor AI에게: 이 문서를 읽고 프로젝트 컨텍스트를 파악하세요.
> 함께 참조: agents/BRAIN.md / docs/STYLE_GUIDE.md
> ⚠️ 이 문서는 모든 이전 버전(v4.1 포함)을 완전히 대체합니다.

---

## ⚠️ MVP 운영 원칙

| 기능 | MVP (지금) | 추후 (어드민 완성 후) |
|---|---|---|
| 마스터 이력 인증 | 서류 업로드 즉시 자동 승인 + ✓ 배지 | 어드민 수동 검토 |
| 마스터 등록 | 즉시 활성화 | 어드민 검토 후 활성화 |
| 제휴 마스터 | DB 직접 수정 | 어드민 페이지 |
| 결제/정산 | Mock (실제 결제 없음) | 토스페이먼츠 연동 |
| 신고/제재 | 신고 접수만 | 어드민 처리 |
| 보너스 토큰 만료 | Supabase CRON 자동 처리 | 동일 |
| 리포트 다운로드 | UI만 (실제 파일 생성 없음) | 실제 PDF/CSV 생성 |
| RAG 파이프라인 | 텍스트 청크 저장 + pgvector 검색 | 고도화 (멀티모달) |
| 클론 테스트 | 미니 채팅 + 테스트 시나리오 10개 | AI 자동 품질 점수 |
| AI 모델 (채팅) | Claude 전용 (claude-sonnet-4-6) | Claude + Gemini 병용 (AWS) |
| 배포 환경 | Vercel | AWS (Live) |

---

## 용어 정의

| 용어 | 정의 |
|---|---|
| **마스터 (Master)** | 지식/경험을 공유하는 전문가 |
| **멤버 (Member)** | 마스터 클론과 대화하는 유저 |
| **클론 (Clone)** | 마스터의 지식을 학습한 AI 에이전트 |
| **구매 토큰** | 결제 구매. 만료 없음. 보너스 소진 후 차감 |
| **보너스 토큰** | 무료 지급. 지급일 +30일 만료. 먼저 차감 |
| **클론 구독** | 특정 클론 월 구독 (별도 결제) |
| **패스 구독** | 월정액으로 전체 클론 접근 |
| **제휴 마스터** | 플랫폼 계약 파트너 |
| **청크 (Chunk)** | 자료를 분할한 텍스트 단위 (RAG 검색 단위) |
| **임베딩 (Embedding)** | 텍스트를 벡터로 변환한 수치 (의미 검색용) |

---

## 인프라

```
Frontend:   React 18 + Vite 4
Routing:    React Router v6
Deploy:     Vercel (MVP) → AWS (Live)
AI 채팅:    MVP: Anthropic Claude (claude-sonnet-4-6) 전용
            Live(AWS): Claude + Google Gemini 병용 (채팅 답변 생성)
AI 추출:    Anthropic Claude (PDF/DOCX 텍스트 추출 — 공통)
Embedding:  Anthropic Embeddings (voyage-3) — 공통
DB:         Supabase (PostgreSQL + pgvector)
  URL:      https://rhsbpfjscobjdrzqymjx.supabase.co
Storage:    Supabase Storage (원본 파일 영구 보관)
Auth:       Supabase Auth (이메일 + 비밀번호)
CRON:       Supabase Edge Functions
결제:        미연결 (Phase 3)
```

### 환경변수
```env
VITE_SUPABASE_URL=https://rhsbpfjscobjdrzqymjx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=          # 서버 전용
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 핵심 상수

```js
const FREE_BASE = 5          // 비구독자 기본 무료 체험 횟수 (클론당)
const FREE_BONUS = 10        // 설문 완료 시 추가 무료 체험 횟수
const MONTHLY_CAP = 200      // 구독자 월 대화 한도
const MAX_CLONES = 3         // 마스터당 최대 클론 수
const MAX_DISCOUNT = 80      // 최대 할인율 (%)
const MIN_TOKEN_PRICE = 1    // 최소 대화 단가 (토큰)
const CHUNK_SIZE = 500       // 청크당 최대 토큰 수 (RAG)
const TOP_K_CHUNKS = 5       // 답변 생성 시 참조 청크 수
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 클론 품질 시스템 (핵심)
## ━━━━━━━━━━━━━━━━━━━━━━━━━

### 클론이 "그 사람처럼" 느껴지려면

사람의 지식은 3가지 층으로 나뉩니다:

| 층 | 설명 | 현재 시스템 |
|---|---|---|
| 명시적 지식 | 글로 쓴 것 (강의, 책, FAQ) | ✅ 학습 가능 |
| 암묵적 지식 | 말하는 방식, 어투, 판단 기준 | ⚠️ SRT/SNS 필요 |
| 경험적 지식 | 실제 케이스, 실패담, 노하우 | ⚠️ 구조화 입력 필요 |

RAG만으로는 ①만 됩니다. ②③을 위한 자료가 추가로 필요합니다.

---

### 자료 카테고리 정의 (5가지)

#### A. 어투 & 스타일 학습 자료 (품질의 30%)
> 클론이 "이 사람의 말투"를 구사하게 만드는 자료

| 자료 종류 | 형식 | 수집 방법 |
|---|---|---|
| 유튜브 강의 자막 | .srt | YouTube URL 입력 → 자동 추출 |
| 팟캐스트 스크립트 | .txt | 직접 업로드 |
| SNS 게시물 모음 | .txt | 계정 연결 또는 직접 붙여넣기 |
| 인터뷰 기사 | .txt / .pdf | 직접 업로드 |
| 뉴스레터 아카이브 | .txt | 직접 업로드 |

> ⭐ 가장 중요. SRT 1개만 있어도 어투가 확연히 달라집니다.

#### B. 핵심 지식 베이스 (품질의 40%)
> 클론이 답변할 수 있는 실제 내용

| 자료 종류 | 형식 | 수집 방법 |
|---|---|---|
| 강의 스크립트 | .pdf / .docx | 직접 업로드 |
| 슬라이드 텍스트 추출본 | .txt | 직접 업로드 |
| 직접 쓴 책/전자책 | .pdf / .docx | 직접 업로드 |
| 블로그 포스트 모음 | .txt | 직접 붙여넣기 |
| Notion 워크스페이스 | - | Notion 연동 |

#### C. 케이스 & 경험 자료 (품질의 20%)
> 클론이 "실전 경험"을 말할 수 있게 하는 자료

| 자료 종류 | 형식 | 수집 방법 |
|---|---|---|
| 실제 상담/코칭 사례 (익명화) | .txt | 구조화 템플릿 제공 |
| 실패/성공 경험담 | .txt | 구조화 템플릿 제공 |
| 의사결정 기준 | .txt | 구조화 템플릿 제공 |
| 자주 받는 반론과 나의 답변 | .txt | 구조화 템플릿 제공 |

> 플랫폼이 템플릿을 제공합니다:
> "상황: / 내가 한 행동: / 결과: / 배운 점:"

#### D. 판단 기준 & 견해 (선택)
> 클론이 의견을 가진 것처럼 느껴지게 하는 자료

- "나는 ~에 동의하지 않는다" 모음
- 추천/비추천 목록과 이유
- 자신만의 원칙/철학 문서

#### E. 고정 답변 (직접 등록)
> AI가 절대 틀리면 안 되는 질문에 대한 답변

- "AI인가요?" → 직접 답변 등록
- "선생님 본인인가요?" → 직접 답변 등록
- 민감한 주제 처리 방식
- 자기소개 표준 답변

---

### 클론 품질 점수 (유사도 %) — 개선된 알고리즘

기존의 단순 파일 타입 체크 → 실제 품질 점수로 개선

```
총점 100점:

[어투 학습] 0~30점
  SRT/자막 파일 있음:              +15점
  SNS/인터뷰/뉴스레터 있음:        +15점

[핵심 지식] 0~40점
  PDF/DOCX/TXT 있음:               +15점
  총 단어수 10,000자 이상:          +10점
  총 단어수 50,000자 이상:          +10점
  Notion 연동:                      +5점

[케이스 & 경험] 0~20점
  케이스 문서 있음 (5개 이상):      +10점
  판단 기준/원칙 문서 있음:         +10점

[고정 답변] 0~10점
  기본 Q&A 5개 이상 등록:           +10점

색상:
  75~100점: 초록 (var(--gn)) — "나다운 대화 가능 ✓"
  50~74점:  cyan  (var(--cy)) — "기본 대화 가능, 보강 권장"
  0~49점:   amber (var(--am)) — "자료 보강 필요"
```

---

### RAG 파이프라인 아키텍처

**원칙: 원본 파일 영구 보관 + 청크 단위 인용**

임베딩만 남기고 원본 삭제하면 → 문맥 없이 벡터 근사값으로 답변 → 할루시네이션 증가 → 마스터 신뢰 하락.
**원본은 Supabase Storage에 영구 보관**하고, 텍스트는 청크로 쪼개서 pgvector에 임베딩합니다.

```
[자료 업로드 플로우]

1. 파일 → Supabase Storage 저장 (원본 보관)
2. 텍스트 추출 (파일 타입별 방식 상이):
   - PDF / DOCX: Claude API에 파일 직접 전달 → 텍스트 추출 (페이지/섹션 메타데이터 포함)
   - SRT: 직접 파싱 (Claude 불필요, 타임스탬프 보존)
   - TXT: 직접 사용
   → 추출된 텍스트를 .txt로 Supabase Storage 추가 저장
3. 청크 분할 (CHUNK_SIZE=500 토큰, overlap=50 토큰)
4. 각 청크에 메타데이터 태깅:
   {
     file_name: "B2B영업전략.pdf",
     file_type: "PDF",
     chunk_index: 12,
     page_number: 3,           // PDF의 경우
     section_title: "협상 클로징",  // 섹션 감지
     timestamp_start: "03:42",  // SRT의 경우
     timestamp_end: "05:10",
   }
5. Anthropic Embedding API로 벡터 생성
6. clone_chunks 테이블에 저장 (vector + metadata)

[대화 플로우]

1. 멤버 질문 → 임베딩 변환
2. pgvector로 유사 청크 TOP_K(5)개 검색
3. 청크 텍스트 + 마스터 시스템 프롬프트 + 질문 → Claude API
4. 답변 생성
5. 사용된 청크 ID → message_sources 테이블 기록
6. citation ON 시: 답변 하단에 출처 표시
```

---

### 출처 표시 기능 ("어느 강의 어디에서")

**멤버가 보는 출처 UI:**
```
[클론 답변 말풍선]
"콜드콜에서 첫 마디는 회사명으로 시작하지 마세요..."

📄 출처: B2B영업전략.pdf · 3페이지 · 협상 클로징 섹션
📺 출처: 콜드콜 강의 · 03:42~05:10
```

**강의 구매 연결 (마케팅 링크와 연동):**
```
이 내용이 더 궁금하다면 →
🎓 "콜드콜 마스터 클래스" ₩189,000 [자세히 보기]
```

출처 파일이 마스터의 판매 상품과 연결되어 있으면 자동으로 구매 링크가 함께 표시됩니다. 이것이 클론의 자연스러운 마케팅 도구가 됩니다.

**마스터 대시보드 — 자료별 참조 현황:**
```
[인사이트 탭 > 고급 섹션]

📊 자료별 참조 횟수 (이번 달)
B2B영업전략.pdf          ████████░░ 847회
콜드콜 강의.srt          ██████░░░░ 634회
협상케이스스터디.pdf      ████░░░░░░ 312회
영업FAQ_200선.txt         ███░░░░░░░ 198회
```

---

### 마스터 온보딩 순서 (품질 최우선)

클론을 만들 때 자료 업로드 순서를 가이드합니다:

```
[클론 만들기 Step 1 — 자료 업로드]

품질 가이드 배너:
"어떤 자료를 올리느냐가 클론 품질을 결정합니다."

권장 순서:
STEP A: 어투 학습 (가장 중요)
  → YouTube URL 입력 (자막 자동 추출)
  → SNS 계정 텍스트 붙여넣기
  예상 품질 점수: +15~30점

STEP B: 핵심 지식
  → 강의 스크립트 PDF 업로드
  → 블로그/책 업로드
  예상 품질 점수: +15~25점 추가

STEP C: 케이스 & 경험 (선택)
  → 케이스 템플릿 작성
  예상 품질 점수: +10~20점 추가

[현재 점수 실시간 표시]
━━━━━━━━━━━━━━━━━━━━━━━━
            62점 / 100점
어투 학습:  ████████░░ 15/30
핵심 지식:  ████████░░ 35/40
케이스:     ██░░░░░░░░ 5/20
고정 답변:  ███░░░░░░░ 7/10
━━━━━━━━━━━━━━━━━━━━━━━━
다음 단계: SRT 자막 추가하면 +15점!
```

---

### 런칭 전 클론 테스트 (강화)

**기존:** 자유 형식 미니 채팅
**강화:** 구조화된 10가지 테스트 시나리오 + 결과 리포트

```
[테스트 시나리오]

1. 자기소개 테스트
   질문: "안녕하세요, 처음 왔는데 뭘 도와주실 수 있나요?"
   기대: 마스터답게 자기소개 + 전문 분야 안내

2. AI 정체성 테스트
   질문: "AI 맞죠? 진짜 선생님이 아니잖아요?"
   기대: 고정 답변 or 설정된 방식으로 처리

3. 핵심 전문 지식 테스트
   질문: [마스터 태그 기반 자동 생성]
   기대: 자료에서 정확한 답변

4. 어투 일관성 테스트
   질문: "쉽게 설명해주세요"
   기대: 마스터의 실제 말투와 유사

5. 자료 범위 외 질문 테스트
   질문: [자료에 없는 주제]
   기대: "이 내용은 제 자료에 없어서..." 명확히 처리

6. 실전 케이스 테스트
   질문: "실제 사례를 들어서 설명해줄 수 있나요?"
   기대: 케이스 자료 활용

7. 반론 처리 테스트
   질문: "그 방법 효과 없지 않나요?"
   기대: 마스터답게 반론에 대응

8. 추천/비추천 테스트
   질문: "어떤 책/도구/방법 추천하세요?"
   기대: 판단 기준 자료 활용

9. 감정적 질문 테스트
   질문: "저 정말 힘들어요. 포기하고 싶어요."
   기대: 공감 + 전문적 조언

10. 연속 대화 일관성 테스트
    [3~4회 연속 질문]
    기대: 이전 답변과 모순 없음
```

**테스트 결과 리포트:**
```
[테스트 결과]

자기소개         ✅ 자연스러움
AI 정체성        ✅ 고정 답변 적용
핵심 지식        ✅ 정확
어투 일관성      ⚠️  약간 딱딱함 → SRT 자료 추가 권장
자료 범위 외     ✅ "모르겠다"고 명확히 처리
케이스 활용      ❌ 케이스 자료 없음 → 추가 필요
반론 처리        ⚠️  평범한 답변
추천/비추천      ❌ 자료 없음
감정적 질문      ✅ 적절한 공감
연속 일관성      ✅ 일관됨

종합 점수: 62점
권장: 런칭 전 SRT 자막 및 케이스 자료 추가 권장
```

마스터가 "합격"이라고 판단하면 → 출시 버튼 활성화.

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 비즈니스 모델
## ━━━━━━━━━━━━━━━━━━━━━━━━━

### 무료 체험 정책
- 비구독 멤버: 클론당 기본 5회 (FREE_BASE)
- 설문 완료 시: +10회 추가 (FREE_BONUS)
- 체험 소진 후: 클론 구독 또는 토큰 충전 유도
- 체험 횟수: 클론별 독립 추적 (free_trial_usage)

### 구독 구조

**① 개별 클론 구독 (월정액)**
- 마스터 설정 구독료 납부
- 월 MONTHLY_CAP(200)회 대화
- 클론별 독립 구독

**② 토큰 종량제**
- 마스터 설정 단가 차감
- 보너스 → 구매 순서
- 구독 없이 토큰만으로 모든 클론 이용 가능

**③ 패스 구독 ₩29,000/월**
- 기본 100토큰/월
- 제휴 마스터 50% 할인 (플랫폼 차액 부담)

### 마케팅 빈도 (mkt_freq)
- `low`: 대화 20회 중 1회
- `medium`: 대화 7회 중 1회 (권장)
- `high`: 대화 3회 중 1회

### 마스터 수익 배분
- 마스터 75% / 플랫폼 25%
- MVP: 계산값만, 실제 정산 없음

### 할인 정책
- 할인율 0~80%, 종료일 설정
- 표시: 원가 취소선 + 할인가 amber

### 토큰 환불 정책
- 구매 토큰: 환불 없음 (서비스 장애 제외)
- 보너스 토큰: 환불 없음 (만료 자동 소멸)

### 패스 취소 시
- 당월 말까지 혜택 유지
- 남은 기본 토큰 유지 (구매 토큰으로 전환)

---

## 마스터 배지 시스템

| 배지 | 기호 | MVP 조건 | 표시 위치 |
|---|---|---|---|
| 일반 마스터 | 없음 | 기본 | - |
| 검증된 마스터 | ✓ | 서류 업로드 즉시 자동 부여 | 카드, 프로필, 채팅 헤더 |
| 제휴 마스터 | 🤝 | DB 직접 수정 | 카드, 프로필, 채팅 헤더 |
| 검증 + 제휴 | ✓ 🤝 | 둘 다 해당 | 동시 표시 |

---

## 클론 정책
- 마스터당 최대 3개
- 클론별: 색상/아바타/단가/설정 독립
- 비활성화: 마켓 숨김, 기존 대화 유지
- 탈퇴 시: 클론 비활성화, 대화이력 90일 후 삭제

---

## 신고 기능 (MVP)
- 채팅 내 ··· 버튼
- 사유: 부적절한 내용 / 허위 정보 / 스팸 / 기타
- MVP: DB 저장만 (처리 없음)

---

## 인증 시스템

- 이메일 + 비밀번호
- 가입 즉시 보너스 5토큰 (30일 만료)

### Protected Routes
```
공개: /, /login, /signup, /signup/verified, /market, /master/:id, /terms, /privacy, /404, /500
보호: /onboarding, /my/*, /chat/*, /master-register, /dashboard/*
```

### 로그인 후 리다이렉트
```
첫 가입 → /onboarding
기존 멤버 → /my
기존 마스터 → /dashboard
```

---

## 온보딩 (/onboarding)

```
Step 1: 역할 선택
  [👤 멤버로 시작] [🎓 마스터로 시작]

Step 2-A (멤버): 관심 분야 → 5토큰 안내 → /market
Step 2-B (마스터): → /master-register
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 마이페이지 UX/UI
## ━━━━━━━━━━━━━━━━━━━━━━━━━

### 상단 헤더
```
[프로필사진]  닉네임  ✓ 🤝          ⚙️
💎 구매 110토큰
🎁 보너스 5토큰 (D-12 만료)
```

### 멤버 탭 (/my)
- 프로필 (사진/닉네임/관심분야)
- 토큰 관리 (잔액 + 충전 + 이용내역)
- 구독 관리 (클론 구독 목록 + 패스 구독)
- 대화 기록 + 검색
- 마스터 등록 유도 (미등록 시)

### 마스터 탭 (/my/master)
- 마스터 프로필 (이름/직함/시그니처/bio/태그/SNS/익명토글)
- 인증 & 배지 (Lv1~3, 즉시 자동 승인)
- 내 클론 목록 (최대 3개)
- 수익 요약
- 단가 설정 (슬라이더 + 입력 필드)
- 정산 계좌

### 설정 (/my/settings)
```
알림: 마케팅(OFF기본)/이메일(ON)/대화(ON)/피드백(ON,마스터만)
이용약관 및 정책: 이용약관 / 개인정보처리방침
계정 관리: 내정보 / 비밀번호 변경 / 회원탈퇴
로그아웃
```

회원 탈퇴 플로우:
```
탈퇴 사유(선택) → 경고 → 이메일 본인 확인 → 탈퇴 완료
마스터: 클론 비활성화 + 대화이력 90일 후 삭제
```

### 마스터 등록 (/master-register)
```
Step 1: 기본 정보 (이름/직함/시그니처/태그)
Step 2: 인증 선택 (바로 시작 / 서류 업로드)
Step 3: 완료 → 첫 클론 만들기
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 토큰 구매 페이지 (/my/tokens)
## ━━━━━━━━━━━━━━━━━━━━━━━━━

**잔액**
```
💎 구매 110토큰
🎁 보너스 5토큰 (D-12 만료)
합계: 115토큰
```

**충전 옵션 (Mock)**
- 50토큰 / ₩5,000
- 110토큰 / ₩10,000 🔥 인기
- 350토큰 / ₩30,000 💎 최저가
- "(테스트 모드 — 실제 결제 없음)" 안내

**패스 배너 (Mock)**
- ₩29,000/월 / 100토큰 + 제휴 마스터 50% 할인

**이용 내역**
필터: 전체/충전/사용/보너스/만료 | 기간: 이번달/지난달/3개월
카드: 타입, 클론명, 토큰수, 잔액 스냅샷, 날짜

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 멤버 인터페이스
## ━━━━━━━━━━━━━━━━━━━━━━━━━

### 홈 (/)
- 비로그인: 히어로 + 통계 바 + Featured 미리보기 + 하단 CTA
- 멤버: 최근 대화 + 추천 마스터 + 토큰 잔액
- 마스터: 클론 현황 + 미답변 피드백 알림

### 마켓플레이스 (/market)
- 검색 바 (마스터명/분야 실시간 필터)
- All-Access 패스 배너
- 카테고리 필터 (전체/영업/마케팅/교육/투자/개발/기타)
- Featured 카드: 아바타/이름/배지/시그니처/태그/별점/N토큰
- 전체 목록 카드: 시그니처/태그/프로필보기/무료체험/구독
- hover: Featured → 살짝 올라옴, 목록 → 마스터 컬러 테두리

### 마스터 프로필 (/master/:id)
탭: **샘플 대화💬** (기본 오픈) / 소개 / 강의·상품 / 업데이트 / 피드백 N

**샘플 대화**: 실제 말풍선 UI (Q: 오른쪽 cyan / A: 왼쪽 클론 아바타) + 하단 CTA
**소개**: bio + 전문 분야 태그
**강의·상품**: 상품 카드 (이름, 가격, 자세히 보기)
**업데이트**: 업데이트 카드 (날짜, 제목, 내용)
**피드백**: 평점 요약(큰숫자+분포바) + 목록(👍 도움됐어요) + 작성폼(구독자)/유도(비구독자)

### 채팅 (/chat/:cloneId)

**레이아웃**: 데스크탑 660px / 모바일 100dvh

**헤더 (고정)**
- 아바타(클론 컬러) + 이름 + AI CLONE 뱃지
- 구독자: 이번달 N/200회 + 프로그레스 바
- 비구독: "체험 N회 남음" amber 뱃지
- 신고 버튼 (···)

**전환 배너 (조건부)**
- 체험 2회 남음: cyan 배너 + 구독 버튼
- 체험 1회 남음: amber 배너 + 구독 버튼

**메시지 영역 (스크롤)**
- 클론 첫 메시지(welcomeMsg) 자동 표시
- 유저: 오른쪽 cyan 말풍선
- 클론: 왼쪽 클론 아바타(클론 컬러) + 말풍선
- 출처 표시 (citation ON 시):
  ```
  📄 B2B영업전략.pdf · 3페이지
  또는
  📺 콜드콜 강의 · 03:42~05:10
  [관련 강의 보기 →] ← 마케팅 링크 연결
  ```
- 타이핑 인디케이터 (점 3개 bounce)
- 인챗 설문 (survey_enabled): 성별/연령/직군 + 커스텀 질문
- 피드백 팝업 (3번째 교환 후 자동)
- 체험 소진 전환 카드 (마지막 답변 블러 + 충전/구독 유도)

**입력창 (고정 하단)**
- 텍스트 + 전송 (Enter)
- "🔐 암호화 문서 기반" + 피드백 링크

### 멤버 대시보드 (/my)
- 좌측 사이드바: 대화기록 / 구독 탭 + "+ 새 대화"
- 우측: 빈상태(🎵+마켓이동) or 대화 선택 시 이어하기

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 마스터 인터페이스
## ━━━━━━━━━━━━━━━━━━━━━━━━━

### 내 클론 목록 (/dashboard)
- 클론 카드: 아바타/이름/상태/구독자/문서수/버전/할인표시
- 빈 슬롯 카드 (3개 미만 시)

### 클론 만들기 (/dashboard/create) — 3단계

**Step 1 — 자료 업로드 (품질 가이드 포함)**
- 품질 가이드 배너: 권장 자료 순서 안내
- 자료 카테고리별 탭: A.어투/B.지식/C.케이스/D.판단기준
- YouTube URL 입력 → 자막 자동 추출
- 파일 드래그 앤 드롭 (PDF/DOCX/TXT/SRT)
- 실시간 품질 점수 표시 (0~100점)
- 케이스 템플릿 입력 폼

**Step 2 — 클론 설정**
- 익명 등록 토글
- 이름 / 부제
- 클론 컬러 선택 (컬러 피커 — 아바타/카드/채팅에 반영)
  기본값: #63d9ff (cyan) / 추천 팔레트 6개 제공
- 대화 단가 (슬라이더 + 입력, 최소 1토큰)

**Step 3 — 출시 요약**
- 품질 점수 최종 표시
- 출시 후 할 수 있는 것 안내

### 클론 대시보드 (/dashboard/:cloneId) — 4탭

#### 개요 탭
- 지표 3개: 구독자/이번달대화수/미답변피드백
- 클론 유사도/품질 게이지 (SVG 원형, 개선된 알고리즘)
- 구독료 관리: 월 가격 + 할인율(0~80%) + 할인 종료일 + 실제 결제금액 미리보기
- 공유 링크: clone.me/@{slug} 복사 / QR / 카카오 / 인스타
- 클론 활성화/비활성화 토글
- 바로가기: 자료 추가 / 인사이트 / 운영

#### 클론 관리 탭

**기본 섹션**

자료 업로드
- 카테고리별 업로드 안내 (A/B/C/D)
- YouTube URL → 자막 자동 추출
- 드롭존 + 우측 품질 점수 배지 (실시간)
- 지원: PDF/DOCX/TXT/SRT/NOTION
- AES-256 암호화 저장
- 중복 파일명 경고
- 업로드/삭제 시 자동 재학습 트리거 (uploading → training 표시)
- 버전 자동 증가

현재 학습 자료 목록
- 카테고리 태그 (A어투/B지식/C케이스/D판단)
- 파일명/용량/단어수/청크수/업로드일/버전
- 타입 뱃지: PDF빨강/DOCX파랑/TXT초록/SRT노랑/NOTION보라
- 파일 삭제 (2단계 확인)
- 총 파일수/용량/단어수/청크수 요약

**📊 자료별 참조 현황** (신규)
- 이번 달 각 파일이 얼마나 답변에 활용됐는지
- 많이 쓰인 파일 → 핵심 자료
- 안 쓰인 파일 → 삭제 또는 품질 개선 권장

내 클론 테스트 (자료 목록 바로 아래)
- "테스트 시작" 버튼
- 자유 대화 모드: 미니 채팅창 (280px)
- **구조화 테스트 모드**: 10가지 시나리오 자동 실행 + 결과 리포트
- 답변 하단: 📌 고정 답변 / 🤖 AI 생성 / 📄 출처 파일명
- 테스트 amber 배너 (구독자에게 비노출)
- 본인 클론: 토큰 차감 없음
- 결과 리포트: 항목별 ✅/⚠️/❌ + 권장 개선사항
- "출시 준비 완료" 판단 후 → 출시 버튼 활성화

**고급 섹션 (▼)**

버전 히스토리
- 버전 카드 (현재 하이라이트)
- 클릭 시 해당 버전 파일 목록 + 청크 수
- 이전 버전 롤백

외부 자료 연동
- Notion: 연결상태/싱크주기/페이지목록/지금싱크
- YouTube: 채널 연결 CTA / 자막 자동 수집

답변 품질 & 유사도
- 품질 점수 풀뷰 + 카테고리별 점수
- 토글 3종: 모르는 질문 처리(ON)/톤&스타일(ON)/인용 출처(ON)

고정 답변 등록
- AI보다 우선 적용
- 카드 클릭 시 편집
- 새 고정 답변 추가

보안 설정
- 학습 완료 후 원본 파일 삭제 [기본 OFF] ← 원본 보관 권장
  ⚠️ ON 설정 시 출처 표시 정확도 하락 경고
- 대화 내용 익명화 [기본 ON]
- 제3자 접근 차단 [기본 ON]
- 버전 히스토리 보관 [기본 ON]
- 위험 구역: 모든 자료 삭제 / 클론 초기화

#### 인사이트 탭

**기본 섹션**

피드백
- 요약: 평균 평점/총 피드백/미답변
- 목록: 별점/내용/날짜/답변 달기

수익
- 이번달: 총구독/플랫폼비용/내수령액
- 월별 바 차트 (최근 4개월)

프로필 샘플 대화 관리
- 최대 3개 핀 Q&A
- 대화이력에서 선택 / 직접 작성

리포트 (월별)
- 연도 드롭다운 + 월 버튼
- 6개 지표: 구독자/수익/대화수/신규/평점/이탈
- TOP 질문
- 다운로드: PDF/CSV — MVP: UI만

**고급 섹션 (▼)**

질문 분석
- 주간 대화 트렌드 바 차트
- TOP 질문 & 전환율 (50%+초록/30~50%amber/~30%빨강)
- 전환 퍼널: 클론 발견→프로필→첫 메시지→설문→3회 대화→구독

자료별 참조 현황
- 파일별 이번 달 참조 횟수 바 차트
- "많이 참조된 자료 = 핵심 자료"
- "참조 없는 자료 = 삭제 또는 보강 권장"

대화 이력
- 카드: 익명ID/인구통계/마지막질문/날짜/평점/전환여부
- 클릭 시 미리보기 펼침 (Q&A + 사용된 청크 파일명)

인구통계
- 연령대 분포 바 (20대/30대/40대/50대+)
- 직군 분포 바

#### 운영 탭

**기본 섹션**

첫 메시지 설계 (welcomeMsg)
- 말풍선 미리보기
- 텍스트 에디터
- 빠른 질문 추가 버튼
- 팁: "경력 한 줄 + 질문 유형 유도"

공지 관리
- 타입: 일반/📌중요/🎉이벤트/📚자료업데이트/⚠️주의사항
- 목록 + 새 공지 작성

설문 설계
- ON/OFF 토글
- 보상 토큰 설정 (0~N)
- 기본 정보 (성별/연령/직군)
- 커스텀 질문 (최대 5개)

**고급 섹션 (▼)**

마케팅 링크
- 빈도: 낮음(20회)/보통(7회,권장)/높음(3회)
- 주제 키워드 + 상품명 + 링크 + 가격

---

## URL 구조

```
공개
/ /login /signup /signup/verified
/market /master/:id /terms /privacy /404 /500

보호
/onboarding
/my /my/master /my/tokens /my/settings
/chat/:cloneId
/master-register
/dashboard /dashboard/:cloneId /dashboard/create
```

## 네비게이션

데스크탑 GNB (52px 상단 고정):
- 멤버: 홈/마켓/대화/마이
- 마스터포함: 홈/마켓/대화/대시보드/마이

모바일 탭바 (64px 하단 고정, iOS Safe Area):
- 멤버: 홈/마켓/대화/마이
- 마스터포함: 홈/마켓/대화/대시/마이

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## DB 스키마 (완전판 v4.2)
## ━━━━━━━━━━━━━━━━━━━━━━━━━

```sql
-- pgvector 확장 활성화 (Supabase 대시보드에서도 가능)
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 유저 ──────────────────────────────────────
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text DEFAULT 'member',
  has_master_profile boolean DEFAULT false,
  nickname text,
  avatar_url text,
  interests text[],
  notify_marketing boolean DEFAULT false,
  notify_email boolean DEFAULT true,
  notify_chat boolean DEFAULT true,
  notify_feedback boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 마스터 ────────────────────────────────────
CREATE TABLE masters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users ON DELETE CASCADE UNIQUE,
  name text,
  title text,
  bio text,
  signature text,
  color text DEFAULT '#63d9ff',
  slug text UNIQUE,                        -- clone.me/@{slug} 공유 링크용
  is_anonymous boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  is_affiliate boolean DEFAULT false,
  verification_level int DEFAULT 0,
  tags text[],
  links jsonb DEFAULT '{}',
  bank_account jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 마스터 이력 인증 ──────────────────────────
CREATE TABLE master_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid REFERENCES masters ON DELETE CASCADE,
  type text CHECK (type IN ('identity','education','career','certificate')),
  file_url text NOT NULL,
  status text DEFAULT 'approved'  -- MVP: 즉시 approved
    CHECK (status IN ('pending','reviewing','approved','rejected')),
  reject_reason text,
  reviewed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ── 클론 ──────────────────────────────────────
CREATE TABLE clones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid REFERENCES masters ON DELETE CASCADE,
  name text NOT NULL,
  subtitle text,
  color text DEFAULT '#63d9ff',
  av text,
  -- 가격/할인
  token_price int DEFAULT 1 CHECK (token_price >= 1),
  discount int DEFAULT 0 CHECK (discount BETWEEN 0 AND 80),
  discount_end date,
  -- 상태
  is_active boolean DEFAULT false,
  is_anonymous boolean DEFAULT false,
  version text DEFAULT 'v1',
  -- AI 설정
  welcome_msg text,
  ctx_prompt text,
  mkt_freq text DEFAULT 'medium' CHECK (mkt_freq IN ('low','medium','high')),
  -- 품질 설정
  quality_no_answer boolean DEFAULT true,
  quality_tone_style boolean DEFAULT true,
  quality_citation boolean DEFAULT true,
  -- 보안 설정
  security_delete_after_training boolean DEFAULT false, -- 원본 보관 권장
  security_anonymize_conversations boolean DEFAULT true,
  security_block_third_party boolean DEFAULT true,
  security_retain_versions boolean DEFAULT true,
  -- 설문 설정
  survey_enabled boolean DEFAULT false,
  survey_reward_tokens int DEFAULT 0,
  -- 품질 점수 (자동 계산)
  quality_score int DEFAULT 0,  -- 0~100점
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 클론 자료 파일 ────────────────────────────
CREATE TABLE clone_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  name text NOT NULL,
  size text,
  type text CHECK (type IN ('PDF','DOCX','TXT','SRT','NOTION')),
  material_category text CHECK (material_category IN ('A','B','C','D','E')),
  -- A:어투, B:지식, C:케이스, D:판단기준, E:고정답변
  file_url text,  -- Supabase Storage URL (원본 영구 보관)
  words int DEFAULT 0,
  chunk_count int DEFAULT 0,  -- 생성된 청크 수
  version text,
  created_at timestamptz DEFAULT now()
);

-- ── RAG 청크 (핵심 신규) ──────────────────────
CREATE TABLE clone_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  file_id uuid REFERENCES clone_files ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content text NOT NULL,           -- 청크 텍스트
  embedding vector(1536),          -- 임베딩 벡터 (pgvector)
  -- 메타데이터 (출처 표시용)
  file_name text,
  file_type text,
  page_number int,                 -- PDF 페이지
  section_title text,              -- 섹션/챕터 제목
  timestamp_start text,            -- SRT 시작 시각 "03:42"
  timestamp_end text,              -- SRT 종료 시각
  material_category text,          -- A/B/C/D/E
  created_at timestamptz DEFAULT now()
);

-- pgvector 인덱스 (유사도 검색 최적화)
CREATE INDEX ON clone_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ── 클론 버전 히스토리 ────────────────────────
CREATE TABLE clone_version_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  version text NOT NULL,
  note text,
  file_count int DEFAULT 0,
  chunk_count int DEFAULT 0,
  quality_score int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ── 고정 답변 ─────────────────────────────────
CREATE TABLE fixed_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 샘플 대화 (프로필 노출) ───────────────────
CREATE TABLE demo_qa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  is_pinned boolean DEFAULT false,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ── 마스터 상품 ───────────────────────────────
CREATE TABLE clone_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  name text NOT NULL,
  price text,
  url text,
  description text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ── 마스터 업데이트 ───────────────────────────
CREATE TABLE clone_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  created_at timestamptz DEFAULT now()
);

-- ── 설문 질문 ─────────────────────────────────
CREATE TABLE survey_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  question text NOT NULL,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ── 설문 응답 ─────────────────────────────────
CREATE TABLE survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  user_id uuid REFERENCES users ON DELETE CASCADE,
  gender text,
  age text,
  job text,
  answers jsonb DEFAULT '[]',
  completed_at timestamptz DEFAULT now(),
  UNIQUE(clone_id, user_id)
);

-- ── 공지 ──────────────────────────────────────
CREATE TABLE clone_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  type text DEFAULT '일반',
  title text NOT NULL,
  body text,
  created_at timestamptz DEFAULT now()
);

-- ── 마케팅 링크 ───────────────────────────────
CREATE TABLE marketing_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  topic text NOT NULL,
  product text NOT NULL,
  url text,
  price text,
  -- 연결된 clone_files (출처 표시와 자동 연결)
  linked_file_id uuid REFERENCES clone_files,
  created_at timestamptz DEFAULT now()
);

-- ── 개별 클론 구독 ────────────────────────────
CREATE TABLE clone_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users ON DELETE CASCADE,
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  price_paid int NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  started_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now()
  -- UNIQUE 제거: 취소 후 재구독 허용
  -- 활성 중복만 앱 레벨에서 체크 or partial index
);

-- 활성 구독만 중복 방지 (재구독 허용)
CREATE UNIQUE INDEX ON clone_subscriptions(user_id, clone_id)
  WHERE status = 'active';

-- ── 무료 체험 사용 현황 ───────────────────────
CREATE TABLE free_trial_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users ON DELETE CASCADE,
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  used_count int DEFAULT 0,
  survey_completed boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, clone_id)
);

-- ── 구독자 월 대화 사용량 ────────────────────
CREATE TABLE monthly_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users ON DELETE CASCADE,
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  period text NOT NULL,
  count int DEFAULT 0,
  cap int DEFAULT 200,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, clone_id, period)
);

-- ── 토큰 잔액 ─────────────────────────────────
CREATE TABLE token_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users ON DELETE CASCADE UNIQUE,
  purchased_balance int DEFAULT 0 CHECK (purchased_balance >= 0),
  pass_balance int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- ── 보너스 토큰 ───────────────────────────────
CREATE TABLE bonus_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users ON DELETE CASCADE,
  amount int NOT NULL CHECK (amount > 0),
  remaining int NOT NULL CHECK (remaining >= 0),
  reason text CHECK (reason IN ('signup','survey','event')),
  clone_id uuid REFERENCES clones,
  expires_at timestamptz NOT NULL,
  is_expired boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ── 토큰 거래 내역 ────────────────────────────
CREATE TABLE token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users ON DELETE CASCADE,
  amount int NOT NULL,
  token_type text CHECK (token_type IN ('purchased','bonus','pass')),
  type text CHECK (type IN (
    'purchase','usage',
    'bonus_signup','bonus_survey','bonus_event','bonus_expired',
    'pass_monthly','refund'
  )),
  clone_id uuid REFERENCES clones,
  bonus_token_id uuid REFERENCES bonus_tokens,
  token_price int,
  actual_price int,
  platform_subsidy int DEFAULT 0,
  description text,
  balance_after_purchased int,
  balance_after_bonus int,
  created_at timestamptz DEFAULT now()
);

-- ── 패스 구독 ─────────────────────────────────
CREATE TABLE pass_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  started_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  monthly_tokens int DEFAULT 100,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ── 대화 ──────────────────────────────────────
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users ON DELETE CASCADE,
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  is_test boolean DEFAULT false,
  is_converted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 메시지 ────────────────────────────────────
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations ON DELETE CASCADE,
  role text CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  tokens_charged int DEFAULT 0,
  token_type_used text
    CHECK (token_type_used IN ('purchased','bonus','pass','free_trial')),
  created_at timestamptz DEFAULT now()
);

-- ── 메시지 출처 (RAG 청크 추적) ─────────────
CREATE TABLE message_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages ON DELETE CASCADE,
  chunk_id uuid REFERENCES clone_chunks ON DELETE CASCADE,
  similarity_score numeric(5,4),  -- 유사도 점수 (0~1)
  created_at timestamptz DEFAULT now()
);

-- ── 자료별 참조 집계 (인사이트용) ────────────
CREATE TABLE file_reference_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES clone_files ON DELETE CASCADE,
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  period text NOT NULL,           -- '2025-01'
  reference_count int DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(file_id, clone_id, period)  -- 파일+클론+기간 조합으로 유일
);

-- ── 피드백 ────────────────────────────────────
CREATE TABLE feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users ON DELETE CASCADE,
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations,
  rating int CHECK (rating BETWEEN 1 AND 5),
  message text,
  reply text,
  replied_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ── 피드백 도움됐어요 ─────────────────────────
CREATE TABLE feedback_helpful (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid REFERENCES feedbacks ON DELETE CASCADE,
  user_id uuid REFERENCES users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(feedback_id, user_id)
);

-- ── 신고 ──────────────────────────────────────
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES users ON DELETE CASCADE,
  clone_id uuid REFERENCES clones,
  message_id uuid REFERENCES messages,
  reason text CHECK (reason IN ('부적절한_내용','허위_정보','스팸','기타')),
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved')),
  created_at timestamptz DEFAULT now()
);

-- ── 클론 월별 분석 데이터 ─────────────────────
CREATE TABLE clone_analytics_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  period text NOT NULL,
  subs int DEFAULT 0,
  new_subs int DEFAULT 0,
  churn int DEFAULT 0,
  convos int DEFAULT 0,
  revenue int DEFAULT 0,
  avg_rating numeric(3,2) DEFAULT 0,
  top_question text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(clone_id, period)
);

-- ── 정산 ──────────────────────────────────────
CREATE TABLE settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid REFERENCES masters ON DELETE CASCADE,
  period text NOT NULL,
  total_tokens int DEFAULT 0,
  gross_amount int DEFAULT 0,
  platform_fee int DEFAULT 0,
  platform_subsidy int DEFAULT 0,
  net_amount int DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

---

## RAG 처리 로직 (/api/process-file + /api/chat)

```
[파일 업로드 시 — /api/process-file]

1. Supabase Storage에 원본 파일 저장 (영구 보관)
   클라이언트에서 파일을 base64로 변환 후 req.body에 포함하여 서버에 전달
   (MVP/AWS 공통 방식 — DEV.md "process-file 파일 전달 방식" 참조)

2. 서버에서 base64 → Buffer 변환 후 텍스트 추출:
   - PDF / DOCX: Claude API (claude-sonnet-4-6)에 base64 전달
     → "텍스트를 그대로 추출. [PAGE N] 페이지 구분. ## 섹션명 표시. 요약/변경 금지"
     → 비용: PDF 50페이지 기준 약 $0.07 (마스터당 1회성)
   - SRT: 직접 파싱 (Claude 불필요)
     → 타임스탬프(HH:MM:SS) 보존, 자막 텍스트 추출
   - TXT: 직접 사용
   → 추출된 텍스트를 .txt로 Supabase Storage 추가 저장
3. 청크 분할 (500 토큰, 50 토큰 overlap)
4. 각 청크 메타데이터 태깅
5. Anthropic Embedding API로 벡터 생성
6. clone_chunks에 저장
7. clone_files.chunk_count 업데이트
8. clones.quality_score 재계산

[대화 시 — /api/chat]

1. 고정 답변 먼저 확인 (fixed_answers에서 키워드 매칭)
   → 매칭되면 고정 답변 반환, 청크 검색 생략

2. 질문 임베딩 변환

3. pgvector 유사도 검색:
   SELECT id, content, file_name, page_number,
          section_title, timestamp_start, timestamp_end,
          1 - (embedding <=> $query_embedding) as similarity
   FROM clone_chunks
   WHERE clone_id = $clone_id
   ORDER BY similarity DESC
   LIMIT 5 (TOP_K_CHUNKS)

4. 시스템 프롬프트 구성:
   [마스터 ctx_prompt]
   [검색된 청크 내용 (컨텍스트)]
   지시: "위 자료에서만 답하세요. 없으면 모르겠다고 하세요."

5. Claude API 호출 → 답변 생성

6. message_sources에 사용된 청크 ID + similarity 기록

7. file_reference_stats 업데이트

8. 출처 정보 클라이언트에 반환:
   {
     answer: "...",
     sources: [
       { file_name: "B2B영업전략.pdf", page: 3, section: "협상 클로징" },
       { file_name: "콜드콜편.srt", timestamp_start: "03:42", timestamp_end: "05:10" }
     ],
     is_fixed_answer: false
   }
```

---

## 토큰 차감 로직 (/api/tokens)

```
대화 1회 발생 시:

1. 구독 상태 확인 (우선순위 순)
   A. clone_subscriptions 활성? (개별 클론 구독)
      → monthly_usage.count < MONTHLY_CAP(200)?
      → 가능: count +1, messages.token_type_used='free_trial'
      → 토큰 차감 없음 (구독료로 이미 납부)

   B. pass_subscriptions 활성? (월정액 패스)
      → 패스는 monthly_usage가 아닌 pass_balance(토큰)로 운영
      → token_balances.pass_balance >= token_price?
      → 가능: pass_balance 차감, token_type='pass'
      → 제휴 마스터인 경우: actual_price = token_price × 50%
         platform_subsidy = token_price - actual_price (플랫폼 부담)

   C. 구독 없음 → 무료 체험 체크
      free_trial_usage.used_count < FREE_BASE + (survey_completed ? FREE_BONUS : 0)
      → 가능: used_count +1, messages.token_type_used='free_trial'
      → 토큰 차감 없음

   D. 모두 소진 → 토큰 차감
      bonus_tokens (expires_at 빠른 순) → purchased_balance 순서

2. 토큰 차감 시 (A제외, B·D 해당):
   token_transactions 기록
   balance 업데이트

3. 한도 초과 or 토큰 0 → 불가 응답
```

## 보너스 토큰 만료 CRON

```
supabase/functions/expire-bonus-tokens/
실행: 매일 00:00 KST

WHERE expires_at < now() AND remaining > 0 AND is_expired = false
→ is_expired = true, remaining = 0
→ token_transactions: type='bonus_expired' 기록
```

---

## 파일 구조

```
clone-me/
├── .cursorrules
├── agents/
│   ├── BRAIN.md / HOWTO.md
│   ├── PM.md / UXUI.md / BRAND.md / RESEARCH.md
│   ├── ARCHITECT.md / DEV.md / QA.md / LEGAL.md
├── docs/
│   ├── PRD_v4.2.md          ← 이 파일
│   └── STYLE_GUIDE.md
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Av.jsx / Bt.jsx / Cd.jsx / Sw.jsx / Tg.jsx / Pb.jsx
│   │   │   ├── LoadingSpinner.jsx / ErrorMessage.jsx
│   │   ├── auth/
│   │   │   ├── Login.jsx / Signup.jsx / Verified.jsx / Onboarding.jsx
│   │   ├── master/
│   │   │   ├── CloneDash/
│   │   │   │   ├── index.jsx / Overview.jsx
│   │   │   │   ├── CloneManage.jsx   ← 자료 카테고리 + RAG 품질 표시
│   │   │   │   ├── Insight.jsx       ← 자료별 참조 현황 포함
│   │   │   │   └── Ops.jsx
│   │   │   ├── MyClones.jsx / Create.jsx / MasterRegister.jsx
│   │   ├── member/
│   │   │   ├── Market.jsx / Chat.jsx  ← 출처 표시 포함
│   │   │   ├── Buyer.jsx / TokenShop.jsx / TokenHistory.jsx
│   │   ├── mypage/
│   │   │   ├── MyPage.jsx / MemberTab.jsx / MasterTab.jsx / Settings.jsx
│   │   ├── profile/
│   │   │   └── MasterProfile.jsx
│   │   └── pages/
│   │       ├── Home.jsx / Terms.jsx / Privacy.jsx
│   │       └── NotFound.jsx / ServerError.jsx
│   ├── lib/
│   │   ├── supabase.js
│   │   ├── anthropic.js
│   │   └── tokens.js
│   ├── hooks/
│   │   ├── useAuth.js / useToken.js / useClone.js / useWindowSize.js
│   ├── App.jsx
│   └── main.jsx
├── api/
│   ├── chat.js              ← Anthropic RAG 프록시
│   ├── tokens.js            ← 토큰 차감 (서버사이드)
│   └── process-file.js      ← 파일→청크→임베딩 처리
├── supabase/
│   └── functions/
│       └── expire-bonus-tokens/
└── .env
```

---

## 작업 우선순위

### Phase 1 — 기반 구축
- [ ] App.jsx 컴포넌트 분리 + 파일 구조
- [ ] React Router v6 + Protected Routes
- [ ] Supabase 연결 + pgvector 활성화
- [ ] DB 스키마 전체 생성
- [ ] Supabase RLS 설정
- [ ] 공통 컴포넌트 (Av/Bt/Cd/Sw/Tg/Pb)
- [ ] 이메일 로그인/회원가입/인증완료
- [ ] 온보딩 플로우 (역할 선택)
- [ ] 가입 시 보너스 5토큰 자동 지급
- [ ] useWindowSize hook

### Phase 2 — 마이페이지 & 계정
- [ ] 홈 페이지 (3가지 상태: 비로그인/멤버/마스터)
- [ ] 마이페이지 전체 (멤버탭+마스터탭)
- [ ] 마스터 등록 플로우
- [ ] 설정 페이지
- [ ] 프로필 사진 업로드
- [ ] 마스터 이력 인증 (즉시 자동 승인)
- [ ] 토큰 구매 (Mock)
- [ ] 토큰 이용 내역
- [ ] 보너스 토큰 만료 CRON
- [ ] 배지 시스템 UI (✓ / 🤝)
- [ ] 마켓플레이스 DB 연동 (v28 하드코딩 → Supabase)
- [ ] 채팅 DB 연동 (v28 하드코딩 → Supabase, 무료체험 추적 포함)
- [ ] 마스터 프로필 DB 연동 (샘플대화/상품/업데이트/피드백)
- [ ] 클론 대시보드 DB 연동 (개요/인사이트/운영 탭)
- [ ] 마스터 slug 자동 생성 (등록 시)

### Phase 2.5 — RAG 파이프라인 (기본)
- [ ] /api/process-file: 텍스트 추출(Claude API) + 청크 + 임베딩
  (base64 req.body 방식 — DEV.md "process-file 파일 전달 방식" 참조)
- [ ] /api/chat: pgvector 검색 + 출처 반환
- [ ] 채팅 UI: 출처 표시 (파일명/페이지/타임스탬프)
- [ ] 마스터 테스트: 10가지 시나리오 + 결과 리포트
- [ ] 자료별 참조 현황 (인사이트 탭)

### Phase 3 — 결제 (사업자 등록 후)
- [ ] 토스페이먼츠 토큰 충전
- [ ] 클론/패스 구독 결제
- [ ] /api/tokens 서버사이드 차감
- [ ] monthly_usage 추적
- [ ] 마스터 월 정산

### Phase 4 — 고도화
- [ ] 어드민 페이지
- [ ] YouTube 자막 자동 추출
- [ ] SNS 텍스트 자동 수집
- [ ] 리포트 PDF/CSV 실제 생성
- [ ] 모바일 최적화 심화

---

## 출시 전 체크리스트

### 법적
- [ ] /terms 이용약관
- [ ] /privacy 개인정보처리방침
- [ ] 가입 시 필수/선택 동의 체크박스
- [ ] 사업자 등록 (결제 전 필수)

### 보안
- [ ] Supabase RLS 전체 테이블
- [ ] 파일 업로드 타입(PDF/DOCX/TXT/SRT) + 용량(50MB) 검증
- [ ] API Rate Limiting
- [ ] SERVICE_ROLE_KEY 서버에서만
- [ ] 원본 파일 삭제 기본값 OFF (출처 정확도 보장)

### UX
- [ ] 이메일 인증 템플릿 한국어
- [ ] 404 / 500 페이지
- [ ] 모든 폼 에러 처리
- [ ] 로딩 상태 처리

### RAG 품질
- [ ] 첫 마스터 클론 실제 테스트 (10가지 시나리오)
- [ ] 출처 표시 정확도 확인
- [ ] 할루시네이션 방지 (자료 외 질문 처리 확인)

### 운영
- [ ] 보너스 토큰 만료 CRON 동작 확인
- [ ] 고객센터 채널
