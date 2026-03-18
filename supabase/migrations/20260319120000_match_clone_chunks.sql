-- RAG: 질문 임베딩으로 clone_chunks 코사인 유사도 TOP-K (서버 service_role 전용 호출 권장)
CREATE OR REPLACE FUNCTION public.match_clone_chunks(
  p_clone_id uuid,
  p_query_embedding vector(1024),
  p_match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  file_name text,
  file_type text,
  page_number int,
  section_title text,
  timestamp_start text,
  timestamp_end text,
  file_id uuid,
  similarity double precision
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    c.id,
    c.content,
    c.file_name,
    c.file_type,
    c.page_number,
    c.section_title,
    c.timestamp_start,
    c.timestamp_end,
    c.file_id,
    (1 - (c.embedding <=> p_query_embedding))::double precision AS similarity
  FROM public.clone_chunks c
  WHERE c.clone_id = p_clone_id
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> p_query_embedding
  LIMIT GREATEST(1, LEAST(p_match_count, 20));
$$;

GRANT EXECUTE ON FUNCTION public.match_clone_chunks(uuid, vector(1024), int) TO service_role;

-- file_reference_stats 원자적 증가 (api/chat)
CREATE OR REPLACE FUNCTION public.increment_file_reference_stat(
  p_file_id uuid,
  p_clone_id uuid,
  p_period text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.file_reference_stats (file_id, clone_id, period, reference_count, updated_at)
  VALUES (p_file_id, p_clone_id, p_period, 1, now())
  ON CONFLICT (file_id, clone_id, period)
  DO UPDATE SET
    reference_count = public.file_reference_stats.reference_count + 1,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_file_reference_stat(uuid, uuid, text) TO service_role;
