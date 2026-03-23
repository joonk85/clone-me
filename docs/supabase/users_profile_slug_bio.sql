-- 멤버 General: UNIQUE HANDLE (@slug), PROFILE BIO (500자 권장 앱 검증)
-- 미적용 시 앱은 해당 필드 없이 저장하고 안내합니다.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_slug text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_bio text;

CREATE UNIQUE INDEX IF NOT EXISTS users_profile_slug_lower_idx ON public.users (lower(profile_slug))
  WHERE profile_slug IS NOT NULL AND length(trim(profile_slug)) > 0;

COMMENT ON COLUMN public.users.profile_slug IS '멤버 공개 핸들 (소문자·숫자·_)';
COMMENT ON COLUMN public.users.profile_bio IS '멤버 프로필 소개';
