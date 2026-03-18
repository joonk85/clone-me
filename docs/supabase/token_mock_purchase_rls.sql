-- Mock 토큰 충전 (/my/tokens 테스트 결제)용 클라이언트 정책
-- Supabase SQL Editor에서 한 번 실행. 운영 전 서버(Webhook)만 허용하도록 좁히는 것을 권장.

-- token_balances: 본인 행 생성·잔액 갱신
CREATE POLICY tb_insert_own ON public.token_balances FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY tb_update_own ON public.token_balances FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- token_transactions: 본인 충전·사용 기록 삽입 (Mock/추후 서버와 동일 스키마)
CREATE POLICY tt_insert_own ON public.token_transactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
