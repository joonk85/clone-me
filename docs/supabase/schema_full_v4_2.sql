-- clone.me DB 스키마 전체 (PRD v4.2)
-- Supabase Dashboard → SQL Editor → 전체 붙여넣기 → Run
-- 주의: 이미 일부 테이블이 있으면 오류 납니다. 빈 프로젝트 또는 DROP 후 실행.

CREATE EXTENSION IF NOT EXISTS vector;

-- ── 유저 (앱 프로필 — auth.users 와 별도, 트리거로 동기화 가능) ──
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text DEFAULT 'member',
  has_master_profile boolean DEFAULT false,
  nickname text,
  avatar_url text,
  interests text[],
  notify_marketing boolean DEFAULT false,
  notify_email boolean DEFAULT true,
  notify_chat boolean DEFAULT true,
  notify_feedback boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.masters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users ON DELETE CASCADE UNIQUE,
  name text,
  title text,
  bio text,
  signature text,
  color text DEFAULT '#63d9ff',
  slug text UNIQUE,
  is_anonymous boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  is_affiliate boolean DEFAULT false,
  verification_level int DEFAULT 0,
  tags text[],
  links jsonb DEFAULT '{}',
  bank_account jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.master_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid REFERENCES public.masters ON DELETE CASCADE,
  type text CHECK (type IN ('identity','education','career','certificate')),
  file_url text NOT NULL,
  status text DEFAULT 'approved' CHECK (status IN ('pending','reviewing','approved','rejected')),
  reject_reason text,
  reviewed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.clones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid REFERENCES public.masters ON DELETE CASCADE,
  name text NOT NULL,
  subtitle text,
  color text DEFAULT '#63d9ff',
  av text,
  token_price int DEFAULT 1 CHECK (token_price >= 1),
  discount int DEFAULT 0 CHECK (discount BETWEEN 0 AND 80),
  discount_end date,
  is_active boolean DEFAULT false,
  is_anonymous boolean DEFAULT false,
  version text DEFAULT 'v1',
  welcome_msg text,
  ctx_prompt text,
  mkt_freq text DEFAULT 'medium' CHECK (mkt_freq IN ('low','medium','high')),
  quality_no_answer boolean DEFAULT true,
  quality_tone_style boolean DEFAULT true,
  quality_citation boolean DEFAULT true,
  security_delete_after_training boolean DEFAULT false,
  security_anonymize_conversations boolean DEFAULT true,
  security_block_third_party boolean DEFAULT true,
  security_retain_versions boolean DEFAULT true,
  survey_enabled boolean DEFAULT false,
  survey_reward_tokens int DEFAULT 0,
  quality_score int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.clone_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  name text NOT NULL,
  size text,
  type text CHECK (type IN ('PDF','DOCX','TXT','SRT','NOTION')),
  material_category text CHECK (material_category IN ('A','B','C','D','E')),
  file_url text,
  words int DEFAULT 0,
  chunk_count int DEFAULT 0,
  version text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.clone_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  file_id uuid REFERENCES public.clone_files ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content text NOT NULL,
  embedding vector(1024),
  file_name text,
  file_type text,
  page_number int,
  section_title text,
  timestamp_start text,
  timestamp_end text,
  material_category text,
  created_at timestamptz DEFAULT now()
);

-- 벡터 인덱스 (HNSW 실패 시 아래 2줄 주석 처리 후, 청크 적재 뒤 ivfflat 실행)
-- ivfflat 예: CREATE INDEX clone_chunks_embedding_ivf ON public.clone_chunks
--   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX clone_chunks_embedding_hnsw ON public.clone_chunks
  USING hnsw (embedding vector_cosine_ops);

-- 임베딩 차원: voyage-3(Anthropic) 출력 차원에 맞출 것 — 기본 1024 마이그레이션 참고 (/api/process-file)

CREATE TABLE public.clone_version_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  version text NOT NULL,
  note text,
  file_count int DEFAULT 0,
  chunk_count int DEFAULT 0,
  quality_score int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.fixed_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.demo_qa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  is_pinned boolean DEFAULT false,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.clone_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  name text NOT NULL,
  price text,
  url text,
  description text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.clone_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.survey_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  question text NOT NULL,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  user_id uuid REFERENCES public.users ON DELETE CASCADE,
  gender text,
  age text,
  job text,
  answers jsonb DEFAULT '[]',
  completed_at timestamptz DEFAULT now(),
  UNIQUE(clone_id, user_id)
);

CREATE TABLE public.clone_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  type text DEFAULT '일반',
  title text NOT NULL,
  body text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.marketing_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  topic text NOT NULL,
  product text NOT NULL,
  url text,
  price text,
  linked_file_id uuid REFERENCES public.clone_files(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.clone_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users ON DELETE CASCADE,
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  price_paid int NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  started_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX clone_subscriptions_active_unique
  ON public.clone_subscriptions(user_id, clone_id)
  WHERE status = 'active';

CREATE TABLE public.free_trial_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users ON DELETE CASCADE,
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  used_count int DEFAULT 0,
  survey_completed boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, clone_id)
);

CREATE TABLE public.monthly_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users ON DELETE CASCADE,
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  period text NOT NULL,
  count int DEFAULT 0,
  cap int DEFAULT 200,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, clone_id, period)
);

CREATE TABLE public.token_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users ON DELETE CASCADE UNIQUE,
  purchased_balance int DEFAULT 0 CHECK (purchased_balance >= 0),
  pass_balance int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.bonus_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users ON DELETE CASCADE,
  amount int NOT NULL CHECK (amount > 0),
  remaining int NOT NULL CHECK (remaining >= 0),
  reason text CHECK (reason IN ('signup','survey','event')),
  clone_id uuid REFERENCES public.clones,
  expires_at timestamptz NOT NULL,
  is_expired boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users ON DELETE CASCADE,
  amount int NOT NULL,
  token_type text CHECK (token_type IN ('purchased','bonus','pass')),
  type text CHECK (type IN (
    'purchase','usage',
    'bonus_signup','bonus_survey','bonus_event','bonus_expired',
    'pass_monthly','refund'
  )),
  clone_id uuid REFERENCES public.clones,
  bonus_token_id uuid REFERENCES public.bonus_tokens,
  token_price int,
  actual_price int,
  platform_subsidy int DEFAULT 0,
  description text,
  balance_after_purchased int,
  balance_after_bonus int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.pass_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  started_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  monthly_tokens int DEFAULT 100,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users ON DELETE CASCADE,
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  is_test boolean DEFAULT false,
  is_converted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations ON DELETE CASCADE,
  role text CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  tokens_charged int DEFAULT 0,
  token_type_used text CHECK (token_type_used IN ('purchased','bonus','pass','free_trial')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.message_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.messages ON DELETE CASCADE,
  chunk_id uuid REFERENCES public.clone_chunks ON DELETE CASCADE,
  similarity_score numeric(5,4),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.file_reference_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES public.clone_files ON DELETE CASCADE,
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  period text NOT NULL,
  reference_count int DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(file_id, clone_id, period)
);

CREATE TABLE public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users ON DELETE CASCADE,
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations,
  rating int CHECK (rating BETWEEN 1 AND 5),
  message text,
  reply text,
  replied_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.feedback_helpful (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid REFERENCES public.feedbacks ON DELETE CASCADE,
  user_id uuid REFERENCES public.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(feedback_id, user_id)
);

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES public.users ON DELETE CASCADE,
  clone_id uuid REFERENCES public.clones,
  message_id uuid REFERENCES public.messages,
  reason text CHECK (reason IN ('부적절한_내용','허위_정보','스팸','기타')),
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.clone_analytics_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid REFERENCES public.clones ON DELETE CASCADE,
  period text NOT NULL,
  subs int DEFAULT 0,
  new_subs int DEFAULT 0,
  churn int DEFAULT 0,
  convos int DEFAULT 0,
  revenue int DEFAULT 0,
  avg_rating numeric(3,2) DEFAULT 0,
  top_question text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(clone_id, period)
);

CREATE TABLE public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid REFERENCES public.masters ON DELETE CASCADE,
  period text NOT NULL,
  total_tokens int DEFAULT 0,
  gross_amount int DEFAULT 0,
  platform_fee int DEFAULT 0,
  platform_subsidy int DEFAULT 0,
  net_amount int DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);
