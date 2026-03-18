-- PostgREST(브라우저 anon 키 + JWT)용 권한 — GRANT 없으면 403 Forbidden
-- RLS가 어떤 행까지 보일지 결정합니다. SQL Editor에서 1회 실행.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 기존 public 테이블 전부
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- 시퀀스가 있는 테이블용 (있을 때만 의미 있음)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 이후 생성 테이블 자동 권한 (에러 나면 아래 4줄만 주석 처리)
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;
