-- migrations/003_trade_enrichment.sql
-- Adds manual trade enrichment fields: setup tags, screenshot URL, mindset, free notes.
-- All columns are nullable so existing trades remain valid.

ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS tags            TEXT[],
  ADD COLUMN IF NOT EXISTS notes           TEXT,
  ADD COLUMN IF NOT EXISTS mindset         TEXT,
  ADD COLUMN IF NOT EXISTS screenshot_url  TEXT;

-- Validate mindset values at the database level so typos can't sneak in via the API.
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_mindset_check;
ALTER TABLE public.trades ADD CONSTRAINT trades_mindset_check
  CHECK (mindset IS NULL OR mindset IN (
    'DISCIPLINED',
    'CONFIDENT',
    'PATIENT',
    'FOMO',
    'REVENGE',
    'HESITANT'
  ));

-- GIN index for fast tag filtering (e.g. WHERE tags && ARRAY['Breakout'])
CREATE INDEX IF NOT EXISTS trades_tags_idx     ON public.trades USING gin (tags);
CREATE INDEX IF NOT EXISTS trades_mindset_idx  ON public.trades (mindset);
