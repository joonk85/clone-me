# clone.me

한국 최초 지식 클론 플랫폼

## 배포 방법

### GitHub + Vercel (추천)

1. GitHub에 새 레포 만들기 (예: `clone-me`)
2. 이 폴더 내용 전체를 push
3. vercel.com → New Project → GitHub 레포 연결
4. 자동 감지됨 → Deploy 클릭
5. 완료 🎉

### 로컬 실행

```bash
npm install
cp .env.example .env   # Supabase URL·anon 키 입력
npm run dev
```

### Supabase + pgvector (Phase 1-3)

- `docs/SUPABASE_SETUP.md` 참고.
- `.env`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정.
- SQL Editor에서 `CREATE EXTENSION IF NOT EXISTS vector;` 실행 (또는 `supabase/migrations/` 마이그레이션).
