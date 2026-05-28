-- migrations/005_open_positions.sql
-- Live snapshot of currently-open positions, pushed by the MT5 EA.
-- The EA POSTs a full snapshot; the backend replaces stale rows so the
-- table always reflects what's open right now.

CREATE TABLE IF NOT EXISTS public.open_positions (
  ticket_id      TEXT PRIMARY KEY,
  symbol         TEXT NOT NULL,
  direction      TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
  lots           NUMERIC NOT NULL,
  open_time      TIMESTAMPTZ NOT NULL,
  open_price     NUMERIC NOT NULL,
  current_price  NUMERIC NOT NULL,
  stop_loss      NUMERIC,
  take_profit    NUMERIC,
  floating_pnl   NUMERIC NOT NULL,
  swap           NUMERIC,
  synced_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS open_positions_synced_idx
  ON public.open_positions (synced_at);

ALTER TABLE public.open_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON public.open_positions;
DROP POLICY IF EXISTS "Allow service_role full write" ON public.open_positions;

CREATE POLICY "Public Read Access"
  ON public.open_positions
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow service_role full write"
  ON public.open_positions
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
