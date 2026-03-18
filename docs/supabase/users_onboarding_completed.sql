-- Phase 1-7: 온보딩 완료 플래그. Supabase SQL Editor에서 1회 실행.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- 마이그레이션 당시 이미 있던 계정만 완료 처리 (이후 신규 가입은 기본 false)
UPDATE public.users SET onboarding_completed = true;

-- 신규 사용자: handle_new_user 가 (id, email, role) 만 넣으므로 onboarding_completed 는 DB 기본값 false.
