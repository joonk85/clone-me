# 🏗️ ARCHITECT Agent — Tech Architect
> 항상 BRAIN.md를 먼저 읽으세요.

## 역할
기술 스택 결정, DB 설계, API 구조, RAG 파이프라인, 보안을 담당합니다.

## 기술 스택 (확정)

```
Frontend:   React 18 + Vite 4
Routing:    React Router v6
Deploy:     Vercel (MVP) → AWS (Live)
AI 채팅:    MVP: Anthropic Claude (claude-sonnet-4-6) 전용
            Live(AWS): Claude + Google Gemini 병용
AI 추출:    Anthropic Claude (PDF/DOCX 텍스트 추출 — MVP/Live 공통)
Embedding:  Anthropic voyage-3 (MVP/Live 공통)
DB:         Supabase (PostgreSQL 15 + pgvector)
Storage:    Supabase Storage
Auth:       Supabase Auth (JWT)
CRON:       Supabase Edge Functions
```

## AI 모델 전략

### MVP (Vercel)
```
채팅 답변 생성:  claude-sonnet-4-6 전용
텍스트 추출:     Claude API (PDF/DOCX base64)
임베딩 생성:     voyage-3
→ 단일 API 키(ANTHROPIC_API_KEY)만 관리, 빠른 배포
```

### Live (AWS)
```
채팅 답변 생성:  Claude + Gemini 병용
  - 기본: claude-sonnet-4-6
  - 대안: gemini-2.0-flash 또는 gemini-2.5-pro
  - 전환 기준: 비용/응답속도/품질 A/B 테스트 후 결정
  - 환경변수: GEMINI_API_KEY 추가 필요
텍스트 추출:     Claude API 고정 (Gemini로 전환 시 재검토)
임베딩 생성:     voyage-3 고정
```

### /api/chat.js — 모델 선택 패턴 (Live 기준)
```js
const AI_PROVIDER = process.env.AI_PROVIDER || 'claude' // 'claude' | 'gemini'

async function generateResponse(systemPrompt, userMessage) {
  if (AI_PROVIDER === 'gemini') {
    // Google Gemini API
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent([systemPrompt, userMessage])
    return result.response.text()
  }
  // 기본: Claude
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: `${systemPrompt}\n\n${userMessage}` }]
  })
  return response.content[0].text
}
```
⚠️ MVP에서는 AI_PROVIDER 분기 없이 Claude 직접 호출만 구현.

## RAG 아키텍처

### 파일 처리 (/api/process-file)
```
1. Supabase Storage에 원본 저장 (영구 보관)
2. 텍스트 추출 (파일 타입별):
   PDF / DOCX → Claude API (claude-sonnet-4-6) base64 직접 전달
     프롬프트: "텍스트 그대로 추출. [PAGE N] 페이지 구분. ## 섹션명 표시. 요약/변경 금지."
     비용: PDF 50페이지 기준 약 $0.07 (마스터당 1회성)
   SRT → 직접 파싱 (Claude 불필요, HH:MM:SS 타임스탬프 보존)
   TXT → 직접 사용
   → 추출된 텍스트를 .txt로 Storage 추가 저장
3. 청크 분할 (CHUNK_SIZE=500, overlap=50)
4. 메타데이터 태깅 (파일명/페이지/섹션/타임스탬프)
5. Anthropic Embedding → 벡터 생성
6. clone_chunks 테이블 저장
7. quality_score 재계산
```

### 대화 처리 (/api/chat)
```
※ MVP: Claude API 전용. Gemini 분기는 Live(AWS) 전환 시 ARCHITECT.md "AI 모델 전략" 참조.

1. fixed_answers 먼저 확인 (키워드 매칭)
2. 질문 임베딩 변환
3. pgvector 유사도 검색 TOP_K=5
4. 시스템 프롬프트 + 청크 + 질문 → Claude API (MVP) / Claude or Gemini (Live)
5. message_sources에 청크 ID 기록
6. file_reference_stats 업데이트
7. 출처 정보 + 답변 반환
```

### pgvector 인덱스
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE INDEX ON clone_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### 유사도 검색 쿼리
```sql
SELECT id, content, file_name, page_number,
       section_title, timestamp_start, timestamp_end,
       1 - (embedding <=> $query_embedding) as similarity
FROM clone_chunks
WHERE clone_id = $clone_id
ORDER BY similarity DESC
LIMIT 5;
```

## 토큰 차감 로직 (/api/tokens)
```
우선순위:

A. clone_subscriptions 활성? (개별 클론 구독)
   → monthly_usage.count < MONTHLY_CAP(200)?
   → 가능: count +1 / 토큰 차감 없음 (구독료로 이미 납부)

B. pass_subscriptions 활성? (월정액 패스)
   → pass_balance >= token_price?
   → 가능: pass_balance 차감, token_type='pass'
   → 제휴 마스터인 경우: actual_price = token_price × 50%
      platform_subsidy = token_price - actual_price (플랫폼 부담)
   ※ 패스는 monthly_usage가 아닌 pass_balance(토큰)로 운영

C. 구독 없음 → 무료 체험 체크
   → free_trial_usage.used_count < FREE_BASE + (survey_completed ? FREE_BONUS : 0)
   → 가능: used_count +1 / 토큰 차감 없음

D. 모두 소진 → 토큰 차감
   → bonus_tokens (expires_at 빠른 순) → purchased_balance 순서
```

## 보너스 만료 CRON
```
supabase/functions/expire-bonus-tokens/
실행: 매일 00:00 KST
WHERE expires_at < now() AND remaining > 0 AND is_expired = false
→ is_expired=true, remaining=0, token_transactions 기록
```

## DB 핵심 테이블 (새 추가분)

### clone_chunks (RAG 핵심)
```sql
CREATE TABLE clone_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  file_id uuid REFERENCES clone_files ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  file_name text, file_type text,
  page_number int, section_title text,
  timestamp_start text, timestamp_end text,
  material_category text,  -- A/B/C/D/E
  created_at timestamptz DEFAULT now()
);
```

### message_sources (출처 추적)
```sql
CREATE TABLE message_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages ON DELETE CASCADE,
  chunk_id uuid REFERENCES clone_chunks ON DELETE CASCADE,
  similarity_score numeric(5,4),
  created_at timestamptz DEFAULT now()
);
```

### file_reference_stats (자료별 참조 집계)
```sql
CREATE TABLE file_reference_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES clone_files ON DELETE CASCADE,
  clone_id uuid REFERENCES clones ON DELETE CASCADE,
  period text NOT NULL,
  reference_count int DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(file_id, clone_id, period)  -- 파일+클론+기간 조합
);
```

## 환경변수
```env
VITE_SUPABASE_URL=https://rhsbpfjscobjdrzqymjx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=  # 서버 전용, 클라이언트 절대 노출 금지
ANTHROPIC_API_KEY=sk-ant-...
```

## 보안 원칙
- SERVICE_ROLE_KEY → 서버사이드에서만
- 토큰 차감 → /api/tokens (서버사이드)
- 파일 업로드 → 타입(PDF/DOCX/TXT/SRT)/용량(50MB) 검증
- Supabase RLS → 모든 테이블 적용
- 원본 파일 → 기본값 보관 (삭제 시 출처 정확도 하락)

## 성능
- 메시지 히스토리: 최근 10개만 전송
- 이미지: Supabase Storage CDN
- 클론 목록: 페이지네이션 20개
- pgvector ivfflat 인덱스 필수

---

## PRD v4.2 최종 수정사항 (2026.03 추가)

### DB 스키마 수정

**① masters 테이블 — slug 추가**
```sql
CREATE TABLE masters (
  ...
  slug text UNIQUE,  -- clone.me/@{slug} 공유 링크
  ...
);
-- 마스터 등록 시 slug 자동 생성 로직:
-- 이름 → 영문 변환 or 한글 그대로 → 중복 시 숫자 suffix
-- 예: "김민준" → "kimjinjun" or "kimjinjun2"
```

**② clone_subscriptions — partial index로 변경**
```sql
-- 기존 UNIQUE(user_id, clone_id) 제거 → 재구독 허용
CREATE UNIQUE INDEX ON clone_subscriptions(user_id, clone_id)
  WHERE status = 'active';
-- 이유: 취소 후 재구독 시 같은 user_id+clone_id 조합 재삽입 필요
```

**③ file_reference_stats — UNIQUE 강화**
```sql
UNIQUE(file_id, clone_id, period)
-- 기존: UNIQUE(file_id, period) → 같은 파일이 다른 클론에 공유될 경우 충돌
```

**④ security_delete_after_training 기본값**
```sql
security_delete_after_training boolean DEFAULT false
-- false = 원본 보관 (권장)
-- true = 원본 삭제 (출처 정확도 하락 경고 필요)
```

### process-file 파일 전달 방식

```
클라이언트에서 파일을 base64로 변환 후 req.body에 포함하는 방식 사용
(MVP/AWS 공통 — AWS Lambda는 body 한도가 충분히 크므로 별도 처리 불필요)
DEV.md의 "process-file 파일 전달 방식" 패턴 참조
```
