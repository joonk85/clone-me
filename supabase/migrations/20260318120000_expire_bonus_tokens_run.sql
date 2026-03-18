-- 보너스 토큰 만료 배치 (상세·pg_cron 예시: docs/supabase/cron_expire_bonus_tokens.sql)

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

REVOKE ALL ON FUNCTION public.expire_bonus_tokens_run() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_bonus_tokens_run() TO service_role;
