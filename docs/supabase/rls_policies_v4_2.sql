-- clone.me RLS 정책 (PRD v4.2 스키마 기준)
-- 전제: public.users.id = auth.users.id (가입 시 동일 UUID로 INSERT — 아래 트리거 참고)
-- Supabase SQL Editor에서 schema_full_v4_2.sql 적용 후 실행

-- ── 가입 시 public.users 동기화 (RLS 전에 실행 권장) ─────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'member')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 마스터 소유 클론 여부 (정책 가독성용) ───────────────────────────
CREATE OR REPLACE FUNCTION public.is_clone_owner(p_clone_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clones c
    JOIN public.masters m ON m.id = c.master_id
    WHERE c.id = p_clone_id AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_master_row(p_master_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.masters m
    WHERE m.id = p_master_id AND m.user_id = auth.uid()
  );
$$;

-- ===================== ENABLE RLS =====================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clone_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clone_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clone_version_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clone_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clone_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clone_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clone_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.free_trial_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_reference_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_helpful ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clone_analytics_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- ===================== users =====================
CREATE POLICY users_select_self ON public.users FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY users_update_self ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY users_insert_self ON public.users FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- ===================== masters =====================
-- 비로그인: 활성 클론이 있는 마스터만 프로필 노출용 조회
CREATE POLICY masters_anon_select ON public.masters FOR SELECT TO anon
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.clones c
      WHERE c.master_id = masters.id AND c.is_active = true
    )
  );
CREATE POLICY masters_auth_select ON public.masters FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      status = 'active'
      AND EXISTS (
        SELECT 1 FROM public.clones c
        WHERE c.master_id = masters.id AND c.is_active = true
      )
    )
  );
CREATE POLICY masters_insert ON public.masters FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY masters_update ON public.masters FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY masters_delete ON public.masters FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ===================== master_verifications =====================
CREATE POLICY mv_select ON public.master_verifications FOR SELECT TO authenticated
  USING (public.is_master_row(master_id));
CREATE POLICY mv_insert ON public.master_verifications FOR INSERT TO authenticated
  WITH CHECK (public.is_master_row(master_id));
CREATE POLICY mv_delete ON public.master_verifications FOR DELETE TO authenticated
  USING (public.is_master_row(master_id));

-- ===================== clones =====================
CREATE POLICY clones_anon_select ON public.clones FOR SELECT TO anon
  USING (is_active = true);
CREATE POLICY clones_auth_select ON public.clones FOR SELECT TO authenticated
  USING (
    is_active = true
    OR public.is_clone_owner(id)
  );
CREATE POLICY clones_insert ON public.clones FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.masters m
      WHERE m.id = master_id AND m.user_id = auth.uid()
    )
  );
CREATE POLICY clones_update ON public.clones FOR UPDATE TO authenticated
  USING (public.is_clone_owner(id))
  WITH CHECK (public.is_clone_owner(id));
CREATE POLICY clones_delete ON public.clones FOR DELETE TO authenticated
  USING (public.is_clone_owner(id));

-- ===================== clone child tables (clone_id) =====================
-- anon: 활성 클론의 공개 데이터만
CREATE POLICY cf_anon ON public.clone_files FOR SELECT TO anon
  USING (
    EXISTS (SELECT 1 FROM public.clones c WHERE c.id = clone_files.clone_id AND c.is_active = true)
  );
CREATE POLICY cf_owner_all ON public.clone_files FOR ALL TO authenticated
  USING (public.is_clone_owner(clone_id))
  WITH CHECK (public.is_clone_owner(clone_id));

CREATE POLICY cc_anon_deny ON public.clone_chunks FOR SELECT TO anon USING (false);
CREATE POLICY cc_owner ON public.clone_chunks FOR ALL TO authenticated
  USING (public.is_clone_owner(clone_id))
  WITH CHECK (public.is_clone_owner(clone_id));

CREATE POLICY cvh_anon ON public.clone_version_history FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.clones c WHERE c.id = clone_version_history.clone_id AND c.is_active));
CREATE POLICY cvh_owner ON public.clone_version_history FOR ALL TO authenticated
  USING (public.is_clone_owner(clone_id))
  WITH CHECK (public.is_clone_owner(clone_id));

CREATE POLICY fa_anon ON public.fixed_answers FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.clones c WHERE c.id = fixed_answers.clone_id AND c.is_active));
CREATE POLICY fa_owner ON public.fixed_answers FOR ALL TO authenticated
  USING (public.is_clone_owner(clone_id))
  WITH CHECK (public.is_clone_owner(clone_id));

CREATE POLICY dqa_anon ON public.demo_qa FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.clones c WHERE c.id = demo_qa.clone_id AND c.is_active));
CREATE POLICY dqa_auth ON public.demo_qa FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clones c WHERE c.id = demo_qa.clone_id AND (c.is_active OR public.is_clone_owner(c.id))));
CREATE POLICY dqa_owner ON public.demo_qa FOR INSERT TO authenticated
  WITH CHECK (public.is_clone_owner(clone_id));
CREATE POLICY dqa_owner_u ON public.demo_qa FOR UPDATE TO authenticated
  USING (public.is_clone_owner(clone_id)) WITH CHECK (public.is_clone_owner(clone_id));
CREATE POLICY dqa_owner_d ON public.demo_qa FOR DELETE TO authenticated
  USING (public.is_clone_owner(clone_id));

CREATE POLICY cp_anon ON public.clone_products FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.clones c WHERE c.id = clone_products.clone_id AND c.is_active));
CREATE POLICY cp_owner ON public.clone_products FOR ALL TO authenticated
  USING (public.is_clone_owner(clone_id))
  WITH CHECK (public.is_clone_owner(clone_id));

CREATE POLICY cu_anon ON public.clone_updates FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.clones c WHERE c.id = clone_updates.clone_id AND c.is_active));
CREATE POLICY cu_owner ON public.clone_updates FOR ALL TO authenticated
  USING (public.is_clone_owner(clone_id))
  WITH CHECK (public.is_clone_owner(clone_id));

CREATE POLICY sq_owner ON public.survey_questions FOR ALL TO authenticated
  USING (public.is_clone_owner(clone_id))
  WITH CHECK (public.is_clone_owner(clone_id));
CREATE POLICY sq_select_subscriber ON public.survey_questions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clones c WHERE c.id = survey_questions.clone_id AND c.is_active));

CREATE POLICY sr_own ON public.survey_responses FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY sr_master_read ON public.survey_responses FOR SELECT TO authenticated
  USING (public.is_clone_owner(clone_id));

CREATE POLICY cn_anon ON public.clone_notices FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.clones c WHERE c.id = clone_notices.clone_id AND c.is_active));
CREATE POLICY cn_owner ON public.clone_notices FOR ALL TO authenticated
  USING (public.is_clone_owner(clone_id))
  WITH CHECK (public.is_clone_owner(clone_id));

CREATE POLICY ml_owner ON public.marketing_links FOR ALL TO authenticated
  USING (public.is_clone_owner(clone_id))
  WITH CHECK (public.is_clone_owner(clone_id));

-- ===================== subscriptions & usage =====================
CREATE POLICY csub_own ON public.clone_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY csub_insert ON public.clone_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY csub_update ON public.clone_subscriptions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY ftu_own ON public.free_trial_usage FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY mu_own ON public.monthly_usage FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ===================== tokens (조회만 클라이언트, 변경은 서버 권장) =====================
CREATE POLICY tb_select ON public.token_balances FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY bt_select ON public.bonus_tokens FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY tt_select ON public.token_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY ps_own ON public.pass_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY ps_insert ON public.pass_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY ps_update ON public.pass_subscriptions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ===================== conversations & messages =====================
CREATE POLICY conv_own ON public.conversations FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY conv_master_read ON public.conversations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clones c
      WHERE c.id = conversations.clone_id AND public.is_clone_owner(c.id)
    )
  );

CREATE POLICY msg_own ON public.messages FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations cv
      WHERE cv.id = messages.conversation_id AND cv.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations cv
      WHERE cv.id = messages.conversation_id AND cv.user_id = auth.uid()
    )
  );
CREATE POLICY msg_master_read ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations cv
      JOIN public.clones c ON c.id = cv.clone_id
      WHERE cv.id = messages.conversation_id AND public.is_clone_owner(c.id)
    )
  );

CREATE POLICY ms_src_own ON public.message_sources FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations cv ON cv.id = m.conversation_id
      WHERE m.id = message_sources.message_id AND cv.user_id = auth.uid()
    )
  );
CREATE POLICY ms_src_master ON public.message_sources FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations cv ON cv.id = m.conversation_id
      JOIN public.clones c ON c.id = cv.clone_id
      WHERE m.id = message_sources.message_id AND public.is_clone_owner(c.id)
    )
  );

CREATE POLICY frs_owner ON public.file_reference_stats FOR SELECT TO authenticated
  USING (public.is_clone_owner(clone_id));

-- ===================== feedbacks =====================
CREATE POLICY fb_anon ON public.feedbacks FOR SELECT TO anon
  USING (
    EXISTS (SELECT 1 FROM public.clones c WHERE c.id = feedbacks.clone_id AND c.is_active)
  );
CREATE POLICY fb_auth_select ON public.feedbacks FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_clone_owner(clone_id)
    OR EXISTS (SELECT 1 FROM public.clones c WHERE c.id = feedbacks.clone_id AND c.is_active)
  );
CREATE POLICY fb_insert ON public.feedbacks FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY fb_master_update ON public.feedbacks FOR UPDATE TO authenticated
  USING (public.is_clone_owner(clone_id))
  WITH CHECK (public.is_clone_owner(clone_id));

CREATE POLICY fh_anon_select ON public.feedback_helpful FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.feedbacks f
      JOIN public.clones c ON c.id = f.clone_id
      WHERE f.id = feedback_helpful.feedback_id AND c.is_active = true
    )
  );
CREATE POLICY fh_all ON public.feedback_helpful FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY fh_read ON public.feedback_helpful FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.feedbacks f
      WHERE f.id = feedback_helpful.feedback_id
      AND (
        public.is_clone_owner(f.clone_id)
        OR EXISTS (SELECT 1 FROM public.clones c WHERE c.id = f.clone_id AND c.is_active)
      )
    )
  );

-- ===================== reports =====================
CREATE POLICY rep_insert ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY rep_own ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

-- ===================== analytics & settlements =====================
CREATE POLICY cam_owner ON public.clone_analytics_monthly FOR SELECT TO authenticated
  USING (public.is_clone_owner(clone_id));
CREATE POLICY stl_owner ON public.settlements FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.masters m
      WHERE m.id = settlements.master_id AND m.user_id = auth.uid()
    )
  );
