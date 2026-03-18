-- 가입 시 public.users.role 을 회원가입 메타데이터와 맞춤 (한 번 실행)
-- 앱에서 signUp({ options: { data: { role: 'master' | 'member' } } }) 사용 시 반영됨

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
  RETURN NEW;
END;
$$;
