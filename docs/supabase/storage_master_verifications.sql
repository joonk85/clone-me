-- 마스터 인증 서류 업로드용 버킷 (경로 추측 어렵게 UUID 파일명 권장)
-- Public URL 로 file_url 저장 (민감 서류는 운영에서 비공개 버킷+서명 URL 로 전환 권장)

INSERT INTO storage.buckets (id, name, public)
VALUES ('master-verifications', 'master-verifications', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS mv_doc_select ON storage.objects;
DROP POLICY IF EXISTS mv_doc_insert ON storage.objects;
DROP POLICY IF EXISTS mv_doc_update ON storage.objects;
DROP POLICY IF EXISTS mv_doc_delete ON storage.objects;

-- 소유 마스터만 해당 master_id 폴더에 업로드
CREATE POLICY mv_doc_select ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'master-verifications');

CREATE POLICY mv_doc_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'master-verifications'
    AND EXISTS (
      SELECT 1 FROM public.masters m
      WHERE m.id::text = (storage.foldername(name))[1]
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY mv_doc_update ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'master-verifications'
    AND EXISTS (
      SELECT 1 FROM public.masters m
      WHERE m.id::text = (storage.foldername(name))[1]
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY mv_doc_delete ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'master-verifications'
    AND EXISTS (
      SELECT 1 FROM public.masters m
      WHERE m.id::text = (storage.foldername(name))[1]
        AND m.user_id = auth.uid()
    )
  );
