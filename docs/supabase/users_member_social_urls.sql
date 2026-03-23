-- 멤버 프로필 SNS (선택). 적용 후 MemberProfile 저장 시 사용됩니다.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS social_youtube_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS social_instagram_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS social_linkedin_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS social_website_url text;

COMMENT ON COLUMN public.users.social_youtube_url IS '멤버 프로필 YouTube URL';
COMMENT ON COLUMN public.users.social_instagram_url IS '멤버 프로필 Instagram URL';
COMMENT ON COLUMN public.users.social_linkedin_url IS '멤버 프로필 LinkedIn URL';
COMMENT ON COLUMN public.users.social_website_url IS '멤버 개인 웹사이트 URL';
