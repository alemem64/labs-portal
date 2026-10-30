-- 방문 분석 이벤트 (phase/03_analytics)
-- 적용: npm run d1:schema (scripts/apply-d1-schema.sh, 로컬 실행)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,             -- ISO8601 UTC
  session_id TEXT,              -- 페이지 로드당 난수 (쿠키 아님, 새로고침마다 새 값)
  event TEXT NOT NULL,          -- pageview | card_click
  card_id TEXT,                 -- card_click일 때만
  elapsed_ms INTEGER,           -- 페이지 로드 후 경과 ms (체류시간 분석용)
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  lang TEXT,                    -- ko | en
  viewport_w INTEGER,
  country TEXT                  -- Cloudflare가 판별한 국가 코드
);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events (ts);
CREATE INDEX IF NOT EXISTS idx_events_event ON events (event);
