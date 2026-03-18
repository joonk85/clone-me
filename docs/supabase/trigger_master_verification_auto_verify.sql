-- 이력/자격 증빙 제출 시 마스터 자동 인증 (✓ 배지)
-- master_verifications 에 career 또는 certificate 가 approved 로 INSERT 되면 masters.is_verified = true

CREATE OR REPLACE FUNCTION public.tr_master_verification_auto_verify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND NEW.type IN ('career', 'certificate') THEN
    UPDATE public.masters
    SET
      is_verified = true,
      verification_level = GREATEST(COALESCE(verification_level, 0), 1),
      updated_at = now()
    WHERE id = NEW.master_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_master_verifications_auto_verify ON public.master_verifications;
CREATE TRIGGER tr_master_verifications_auto_verify
  AFTER INSERT ON public.master_verifications
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND NEW.type IN ('career', 'certificate'))
  EXECUTE FUNCTION public.tr_master_verification_auto_verify();

-- 관리자가 pending → approved 로 바꿀 때도 반영하려면 아래 주석 해제
-- DROP TRIGGER IF EXISTS tr_master_verifications_auto_verify_upd ON public.master_verifications;
-- CREATE TRIGGER tr_master_verifications_auto_verify_upd
--   AFTER UPDATE OF status ON public.master_verifications
--   FOR EACH ROW
--   WHEN (NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' AND NEW.type IN ('career', 'certificate'))
--   EXECUTE FUNCTION public.tr_master_verification_auto_verify();
