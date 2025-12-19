-- game_sessions 테이블 생성
-- 게임 시작 시 세션을 저장하고, 점수 제출 시 검증에 사용

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_seed BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,  -- 점수 제출 시 기록 (중복 사용 방지)
  expires_at TIMESTAMPTZ NOT NULL  -- 생성 후 3분 (90초 게임 + 여유)
);

-- 인덱스 추가 (만료된 세션 정리용)
CREATE INDEX IF NOT EXISTS idx_game_sessions_expires_at ON game_sessions(expires_at);

-- 만료된 세션 자동 정리 (선택사항 - cron job으로 실행)
-- DELETE FROM game_sessions WHERE expires_at < NOW();

-- RLS 비활성화 (Edge Functions에서 service_role로 접근)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- 아무도 직접 접근 못하게 (Edge Functions만 service_role로 접근)
CREATE POLICY "No direct access" ON game_sessions FOR ALL USING (false);
