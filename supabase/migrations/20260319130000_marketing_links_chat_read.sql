-- 채팅 화면에서 활성 클론의 마케팅 링크 조회 (멤버·비로그인 열람)
CREATE POLICY ml_public_select ON public.marketing_links FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.clones c
      WHERE c.id = marketing_links.clone_id AND c.is_active = true
    )
  );

CREATE POLICY ml_member_select ON public.marketing_links FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clones c
      WHERE c.id = marketing_links.clone_id AND c.is_active = true
    )
  );
