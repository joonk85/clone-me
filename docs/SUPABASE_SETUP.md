# Supabase 설정 (Phase 1-3)

## 1. 클라이언트 (프론트)

1. 프로젝트 루트에 `.env` 생성 (`.env.example` 참고).
2. [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API 에서 **Project URL**, **anon public** 키 복사.

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

3. 코드에서 `getSupabaseBrowserClient()` 또는 `requireSupabaseBrowserClient()` 사용 (`src/lib/supabase.js`).

## 2. pgvector + 전체 스키마

**한 번에 적용:** `docs/supabase/schema_full_v4_2.sql` 파일 전체를 SQL Editor에 붙여넣고 **Run**.

- 맨 위에 `CREATE EXTENSION vector` 포함.
- `clone_chunks`, `message_sources`, `file_reference_stats` 등 PRD v4.2 테이블 전부.

**주의:** 이미 테이블이 있으면 오류입니다. 빈 프로젝트이거나, 기존 public 테이블을 DROP 한 뒤 실행하세요.

**HNSW 인덱스 오류 시:** 해당 `CREATE INDEX ... hnsw` 두 줄을 주석 처리하고, 청크 데이터 넣은 뒤 ivfflat 인덱스(파일 내 주석 참고)로 대체.

확인:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
```

## 3. RLS (Phase 1-5)

`docs/supabase/rls_policies_v4_2.sql` 전체를 SQL Editor에서 실행.

- `auth.users` 가입 시 `public.users` 자동 생성 트리거 포함
- 재실행 시 정책 이름 충돌 시 에러 → 필요 시 기존 정책 DROP 후 재실행

**403 Forbidden (users / clones / masters …):** 스키마만 만들었을 때 **`anon`·`authenticated` 에 GRANT 가 없으면** REST API가 전부 403 납니다.

1. **`docs/supabase/grant_public_api.sql`** 전체 실행 ← **마켓·내구독·토큰 등 한 번에 권장**
2. `users`만 따로 쓰려면 **`docs/supabase/fix_users_grants_rls.sql`** (위 1번에 users 포함됨)

## 4. 로그인/가입 쓰기

**지금 하면 되는 것 (이것만 하면 됨)**  
1. `.env` 에 Supabase URL·anon 키 넣기  
2. 앱에서 **회원가입** → **로그인**  
3. (이메일 인증 쓰면) **Authentication → URL Configuration** — Site URL + **Redirect URLs** 에  
   `http://localhost:5173/signup/verified` 및 배포 도메인 동일 경로 추가 (가입 확인 메일 콜백).  

가입하면 DB에 `public.users` 행이 자동으로 생깁니다. **별도 SQL 더 안 붙여도 됩니다.**

---

**`handle_new_user_role_metadata.sql` 은? → 선택 사항**

- **안 해도 됩니다.** 가입·로그인은 그대로 동작합니다.
- **할 때만:** 가입 화면에서 **「마스터」**를 골랐을 때 DB에도 `role = master`로 남기고 싶을 때 **한 번만**  
  프로젝트 폴더의 `docs/supabase/handle_new_user_role_metadata.sql` 파일 **전체를 복사 → Supabase 웹 → SQL Editor → 붙여넣기 → Run**.
- 안 하면 가입자 전원 DB상 `role`은 `member`로만 들어갑니다. 나중에 마이페이지에서 마스터로 바꾸는 기능을 만들면 그때 맞춰도 됩니다.

---

**`auth.uid()` 와 `public.users` 가 같은 사람인지 확인하고 싶을 때만** (선택):

**일치 여부 (SQL Editor, service role / postgres 로 실행):**

```sql
-- auth 에는 있는데 public.users 에 없는 계정 (비어 있어야 정상)
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;
```

```sql
-- 같은 id 인지 샘플 확인
SELECT au.id AS auth_id, pu.id AS public_id, au.email = pu.email AS email_match
FROM auth.users au
JOIN public.users pu ON pu.id = au.id
LIMIT 20;
```

**본인 `public.users` 행 (앱에서 확인):** 로그인 후 브라우저 콘솔 또는 코드에서  
`supabase.from('users').select('id,email,role').single()` — `id`가 `auth.getUser().id` 와 같으면 됩니다.  
(SQL Editor에서는 `auth.uid()`가 비어 있는 경우가 많습니다.)

**과거에 수동으로만 auth 만 있었던 경우 백필:**

```sql
INSERT INTO public.users (id, email, role)
SELECT id, email, 'member' FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id);
```

## 4a. 온보딩 플래그 (Phase 1-7)

`docs/supabase/users_onboarding_completed.sql` 1회 실행 → `users.onboarding_completed`.  
실행 직후 `UPDATE … = true` 로 **기존 행 전원 완료 처리**되고, **그 이후 신규 가입**만 온보딩을 거칩니다.

## 4b. 가입 보너스 5토큰 (Phase 1-8)

`docs/supabase/signup_bonus_trigger.sql` 실행 → `token_balances` 행 생성 + `bonus_tokens` 5개(30일) + `token_transactions` 기록.  
기존 `handle_new_user` 를 이 스크립트가 통째로 교체합니다. **이미 가입한 계정**은 파일 하단 주석 백필 SQL로 선택 적용.

## 4c. Mock 토큰 충전 (`/my/tokens`)

`docs/supabase/token_mock_purchase_rls.sql` 실행 → 앱에서 **테스트 결제 시뮬레이션** 시 `token_balances`·`token_transactions` 에 반영.  
미실행 시에도 상점의 **「브라우저에만 충전」**으로 UI 테스트 가능.

## 4d. 프로필 사진 Storage (`/my/profile`)

`docs/supabase/storage_avatars.sql` 실행 → 버킷 **`avatars`**(Public) + 본인 폴더(`{uuid}/`)에만 업로드 가능한 정책.

## 4e. 마스터 인증 서류 + 자동 ✓ 배지 (`/my/master/verify`)

1. **`docs/supabase/storage_master_verifications.sql`** — 버킷 **`master-verifications`**, 마스터 본인 폴더(`{master_id}/`)만 업로드.  
2. **`docs/supabase/trigger_master_verification_auto_verify.sql`** — `career` / `certificate` 증빙이 `approved`로 저장되면 `masters.is_verified = true`.

## 4f. 보너스 토큰 만료 (CRON)

- **`docs/supabase/cron_expire_bonus_tokens.sql`** — 함수 `expire_bonus_tokens_run()` : 만료된 `bonus_tokens` → `remaining=0`, `is_expired=true`, `token_transactions` 에 `bonus_expired` 기록.
- **pg_cron** 예시는 파일 주석 참고. 미사용 시 **service_role** 로 `POST /rest/v1/rpc/expire_bonus_tokens_run` 스케줄 호출 또는 SQL Editor에서 수동 실행.
- CLI 배포 시 `supabase/migrations/20260318120000_expire_bonus_tokens_run.sql` 에 동일 함수 포함.

## 5. 앱 연동 (내 정보 · 마스터 · 마켓)

- **`/settings`** — `public.users` 조회·수정 (닉네임, 알림 등). 프로필 사진·SNS는 `/my/profile`
- **`/my/master/profile`** — `public.masters` 등록·수정. **`/my/master/*`** — 인증·클론·수익·단가·정산 탭
- **`/market`** — `clones` + `masters` 조인 조회 (`is_active = true` 만)

## 6. Supabase CLI (선택)

로컬에 CLI가 있으면:

```bash
supabase link --project-ref <ref>
supabase db push
```

마이그레이션 파일은 `supabase/migrations/` 에 둡니다.
