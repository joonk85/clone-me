-- clone.me Phase 1-3: pgvector 확장 (RAG 임베딩 검색용)
-- Supabase Dashboard → SQL Editor 에서 실행하거나: supabase db push

CREATE EXTENSION IF NOT EXISTS vector;

COMMENT ON EXTENSION vector IS 'clone.me RAG — clone_chunks.embedding 등';
