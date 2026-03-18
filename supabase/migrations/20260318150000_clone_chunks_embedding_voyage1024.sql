-- voyage-3(Anthropic embeddings) 기본 차원 1024 전제 (기존 vector(1536)와 호환 불가)
-- 적용 시 기존 clone_chunks 행 전부 삭제됨 → 마스터는 자료 재처리 필요
DROP INDEX IF EXISTS public.clone_chunks_embedding_hnsw;
DELETE FROM public.clone_chunks;
ALTER TABLE public.clone_chunks DROP COLUMN IF EXISTS embedding;
ALTER TABLE public.clone_chunks ADD COLUMN embedding vector(1024);
CREATE INDEX clone_chunks_embedding_hnsw ON public.clone_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
