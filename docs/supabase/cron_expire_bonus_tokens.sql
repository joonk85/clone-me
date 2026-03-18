-- 보너스 토큰 만료 배치 — expires_at 경과 행을 is_expired 처리 + 소멸분 token_transactions 기록
-- 1) 아래 함수 실행 (한 번 생성)
-- 2) pg_cron 으로 주기 실행 (유료 플랜 등) 또는 외부 스케줄러에서 service_role 로 RPC 호출

CREATE OR REPLACE FUNCTION public.expire_bonus_tokens_run()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  n int := 0;
BEGIN
  FOR r IN
    SELECT id, user_id, remaining, reason
    FROM public.bonus_tokens
    WHERE is_expired = false
      AND expires_at < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    IF r.remaining > 0 THEN
      INSERT INTO public.token_transactions (
        user_id,
        amount,
        token_type,
        type,
        bonus_token_id,
        description
      ) VALUES (
        r.user_id,
        -r.remaining,
        'bonus',
        'bonus_expired',
        r.id,
        format('보너스 만료 · 잔여 %sT 소멸 (%s)', r.remaining, COALESCE(r.reason, ''))
      );
    END IF;

    UPDATE public.bonus_tokens
    SET remaining = 0, is_expired = true
    WHERE id = r.id;

    n := n + 1;
  END LOOP;

  RETURN n;
END;
$$;

COMMENT ON FUNCTION public.expire_bonus_tokens_run IS '만료된 bonus_tokens 정리 및 bonus_expired 내역 기록. idempotent.';

REVOKE ALL ON FUNCTION public.expire_bonus_tokens_run() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_bonus_tokens_run() TO service_role;

-- ━━━ pg_cron (Supabase: Dashboard → Database → Extensions → pg_cron 활성화 후) ━━━
-- 매시 정각 UTC (필요 시 cron 표현식만 변경)
-- SELECT cron.schedule(
--   'expire-bonus-tokens-hourly',
--   '0 * * * *',
--   $$SELECT public.expire_bonus_tokens_run()$$
-- );
--
-- 작업 확인: SELECT * FROM cron.job;
-- 중지: SELECT cron.unschedule((SELECT jobid FROM cron.job WHERE jobname = 'expire-bonus-tokens-hourly'));

-- ━━━ pg_cron 미사용 시 ━━━
-- • Supabase Scheduled Functions(Edge)에서 service_role JWT 로
--   POST /rest/v1/rpc/expire_bonus_tokens_run  (PostgREST RPC 노출 필요)
-- • 또는 매일 SQL Editor에서 수동: SELECT public.expire_bonus_tokens_run();

-- RPC로 호출하려면 (선택):
-- alter database postgres set pgrst.db_schemas to 'public,graphql_public';  -- 기본 유지
-- 함수가 이미 public 이면: POST .../rpc/expire_bonus_tokens_run with Authorization: Bearer SERVICE_ROLE
