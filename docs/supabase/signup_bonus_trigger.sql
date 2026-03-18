-- 가입 시 token_balances 생성 + bonus_tokens 5개(30일 만료) + 내역 1건
-- SQL Editor에서 한 번 실행 (이미 handle_new_user 가 있으면 아래가 덮어씀)

CREATE OR REPLACE FUNCTION public.seed_new_user_wallet(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bonus_id uuid;
BEGIN
  INSERT INTO public.token_balances (user_id, purchased_balance, pass_balance)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  IF EXISTS (
    SELECT 1 FROM public.bonus_tokens
    WHERE user_id = p_user_id AND reason = 'signup'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.bonus_tokens (user_id, amount, remaining, reason, expires_at)
  VALUES (
    p_user_id,
    5,
    5,
    'signup',
    (now() AT TIME ZONE 'utc') + interval '30 days'
  )
  RETURNING id INTO v_bonus_id;

  INSERT INTO public.token_transactions (
    user_id,
    amount,
    token_type,
    type,
    bonus_token_id,
    description
  ) VALUES (
    p_user_id,
    5,
    'bonus',
    'bonus_signup',
    v_bonus_id,
    '가입 축하 보너스 (30일 유효)'
  );
END;
$$;

-- 가입 트리거: public.users 동기화 후 지갑 시드
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r text;
BEGIN
  r := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'role'), ''), 'member');
  IF r NOT IN ('member', 'master') THEN
    r := 'member';
  END IF;

  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, r)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  PERFORM public.seed_new_user_wallet(NEW.id);
  RETURN NEW;
END;
$$;

-- 트리거는 기존과 동일 이름이면 재생성 불필요. 없을 때만:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ━━━ 기존 회원 백필 (선택) ━━━
-- INSERT INTO public.token_balances (user_id)
-- SELECT u.id FROM public.users u
-- WHERE NOT EXISTS (SELECT 1 FROM public.token_balances t WHERE t.user_id = u.id);
--
-- INSERT INTO public.bonus_tokens (user_id, amount, remaining, reason, expires_at)
-- SELECT u.id, 5, 5, 'signup', (now() AT TIME ZONE 'utc') + interval '30 days'
-- FROM public.users u
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.bonus_tokens b WHERE b.user_id = u.id AND b.reason = 'signup'
-- );
