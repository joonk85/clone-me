-- 멤버 알림: 신규 마스터 알림 (`Settings` 페이지 `notify_new_master`)
-- 컬럼이 없으면 앱은 마케팅·이메일만 저장하고 안내 문구를 표시합니다.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS notify_new_master boolean DEFAULT true;

COMMENT ON COLUMN public.users.notify_new_master IS '신규 마스터 알림 (멤버 설정)';
