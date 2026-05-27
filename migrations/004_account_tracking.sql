-- migrations/004_account_tracking.sql
-- Capital and cashflow tracking: lets the dashboard compute equity curve
-- and drawdown against a real starting balance + deposits/withdrawals.

CREATE TABLE IF NOT EXISTS public.account_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kind         TEXT NOT NULL CHECK (kind IN (
                 'STARTING_BALANCE',  -- one-time, the seed capital
                 'DEPOSIT',           -- money added later
                 'WITHDRAWAL',        -- money removed (amount stored positive; math handles sign)
                 'ADJUSTMENT'         -- manual correction (signed amount allowed)
               )),
  amount       NUMERIC NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS account_tx_occurred_idx
  ON public.account_transactions (occurred_at);

-- Match the existing public-read posture used on the trades table.
ALTER TABLE public.account_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON public.account_transactions;
DROP POLICY IF EXISTS "Allow service_role full write" ON public.account_transactions;

CREATE POLICY "Public Read Access"
  ON public.account_transactions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow service_role full write"
  ON public.account_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
