# clone.me

**한국 최초 지식 클론 플랫폼** — 전문가의 자료·노하우를 학습한 AI 클론이 구독자와 1:1로 대화합니다. 마스터는 클론을 만들고 운영하고, 멤버는 토큰으로 대화합니다.

---

## 현재 구현 상태

| 단계 | 상태 | 요약 |
|------|------|------|
| **Phase 1** | ✅ 완료 | 라우팅·Supabase·인증·온보딩·가입 보너스 토큰 등 |
| **Phase 2** | ✅ 완료 | 홈·마이페이지·마스터 등록·클론 생성·토큰(Mock)·프로필·이력 인증 등 |
| **Phase 2.5** | 🔄 진행 중 | RAG(`/api/process-file`, `/api/chat`)·출처·마케팅 링크·클론 테스트·자료별 참조 등 **코드 반영됨**. Supabase **마이그레이션·RLS SQL 적용**·운영 점검은 환경별로 진행 |

| 다음 | 내용 |
|------|------|
| **Phase 3** | 토스페이먼츠 실결제 (예정) |

상세 체크리스트: [`docs/PROGRESS.md`](docs/PROGRESS.md) · 에이전트 컨텍스트: [`agents/BRAIN.md`](agents/BRAIN.md)

---

## 기술 스택

- **React 18** + **Vite 4**
- **Supabase** — PostgreSQL, Auth, Storage, **pgvector** (클론 청크 검색)
- **Anthropic** — Claude(답변·PDF/DOCX 추출) + **voyage-3** 계열 임베딩 (`ANTHROPIC_API_KEY` 단일 키)
- **Vercel** — 프론트 빌드 + `api/` 서버리스 (`chat`, `process-file`)

---

## 로컬 실행

```bash
npm install
cp .env.example .env
# .env 에 Vite용 + (로컬에서 API 쓰려면) 서버용 변수 입력
npm run dev
```

- 프론트: 터미널에 표시되는 URL (기본 `http://localhost:5173`)
- **`/api/*`를 로컬에서 쓰려면** Vite 프록시 또는 Vercel CLI(`vercel dev`) 등으로 API를 함께 띄워야 합니다. 배포 환경에서는 Vercel이 `api/`를 자동 제공합니다.

---

## 환경 변수 (`.env.example` 기준)

| 변수 | 용도 |
|------|------|
| `VITE_SUPABASE_URL` | 브라우저 Supabase 클라이언트 (프로젝트 URL) |
| `VITE_SUPABASE_ANON_KEY` | 브라우저용 anon 키 (RLS 적용) |
| `SUPABASE_URL` | 서버리스 API에서 Supabase 접속 URL (`VITE_SUPABASE_URL`과 동일 값 권장, 미설정 시 `VITE_SUPABASE_URL` 폴백) |
| `SUPABASE_SERVICE_ROLE_KEY` | **`/api/chat`**, **`/api/process-file`** 등 서버 전용 — **프론트에 넣지 말 것** |
| `ANTHROPIC_API_KEY` | Claude + voyage 임베딩 (PDF/DOCX·채팅·RAG) |

선택(기본값 있음): `ANTHROPIC_EXTRACT_MODEL`, `ANTHROPIC_EMBEDDING_MODEL`, `ANTHROPIC_CHAT_MODEL` — `.env.example` 주석 참고.

**Vercel**: Dashboard → Project → Settings → Environment Variables 에 위 서버용 키들을 등록합니다.

---

## Supabase 설정

스키마·확장(pgvector)·RLS·Storage 버킷·마이그레이션 적용 순서는 아래 문서를 따르세요.

👉 **[`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md)**

RAG·채팅을 쓰려면 `supabase/migrations/` 내 SQL(예: `match_clone_chunks`, `clone_chunks` 1024차원 등)을 프로젝트에 맞게 적용해야 합니다.

---

## 배포 (Vercel)

1. GitHub에 푸시 후 [Vercel](https://vercel.com)에서 레포 연결  
2. 환경 변수에 `VITE_*`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` 설정  
3. Deploy

---

## 라이선스 / 문의

프로젝트 정책은 PRD·에이전트 문서(`agents/`)를 참고하세요.
