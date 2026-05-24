-- migrations/002_add_trade_details.sql
-- Adds analytics columns to the trades table.
-- All new columns are NULLABLE so existing rows remain valid.
-- Safe to re-run: every ADD COLUMN uses IF NOT EXISTS.

ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS open_time    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS entry_price  NUMERIC,
  ADD COLUMN IF NOT EXISTS stop_loss    NUMERIC,
  ADD COLUMN IF NOT EXISTS take_profit  NUMERIC,
  ADD COLUMN IF NOT EXISTS commission   NUMERIC,
  ADD COLUMN IF NOT EXISTS swap         NUMERIC,
  ADD COLUMN IF NOT EXISTS r_multiple   NUMERIC;

-- Helpful indexes for the new analytics queries
CREATE INDEX IF NOT EXISTS trades_open_time_idx   ON public.trades (open_time);
CREATE INDEX IF NOT EXISTS trades_r_multiple_idx  ON public.trades (r_multiple);
