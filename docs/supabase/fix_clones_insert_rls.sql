-- clones INSERT 시
-- "new row violates row-level security policy for table \"clones\""
-- 오류가 날 때 실행하는 복구 스크립트
--
-- 사용법: Supabase SQL Editor에서 전체 실행

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.masters TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clones TO authenticated;

ALTER TABLE public.masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clones ENABLE ROW LEVEL SECURITY;

-- 안전한 소유자 판별 함수
CREATE OR REPLACE FUNCTION public.is_master_row(p_master_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.masters m
    WHERE m.id = p_master_id
      AND m.user_id = auth.uid()
  );
$$;

-- 기존 정책 이름이 달라도 충돌 없이 재생성하기 위해 대표 이름들을 정리
DROP POLICY IF EXISTS masters_select ON public.masters;
DROP POLICY IF EXISTS masters_insert ON public.masters;
DROP POLICY IF EXISTS masters_update ON public.masters;
DROP POLICY IF EXISTS masters_delete ON public.masters;
DROP POLICY IF EXISTS clones_auth_select ON public.clones;
DROP POLICY IF EXISTS clones_insert ON public.clones;
DROP POLICY IF EXISTS clones_update ON public.clones;
DROP POLICY IF EXISTS clones_delete ON public.clones;

CREATE POLICY masters_select ON public.masters
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY masters_insert ON public.masters
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY masters_update ON public.masters
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY masters_delete ON public.masters
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY clones_auth_select ON public.clones
  FOR SELECT TO authenticated
  USING (
    is_active = true
    OR public.is_master_row(master_id)
  );

CREATE POLICY clones_insert ON public.clones
  FOR INSERT TO authenticated
  WITH CHECK (public.is_master_row(master_id));

CREATE POLICY clones_update ON public.clones
  FOR UPDATE TO authenticated
  USING (public.is_master_row(master_id))
  WITH CHECK (public.is_master_row(master_id));

CREATE POLICY clones_delete ON public.clones
  FOR DELETE TO authenticated
  USING (public.is_master_row(master_id));
