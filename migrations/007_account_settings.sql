-- migrations/007_account_settings.sql
-- Single-row settings table. Easy to extend with more columns later.

CREATE TABLE IF NOT EXISTS public.account_settings (
  id              INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  strategy_parts  INT NOT NULL DEFAULT 10
                  CHECK (strategy_parts BETWEEN 2 AND 100),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the default row if missing.
INSERT INTO public.account_settings (id, strategy_parts)
VALUES (1, 10)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.account_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON public.account_settings;
DROP POLICY IF EXISTS "Allow service_role full write" ON public.account_settings;

CREATE POLICY "Public Read Access"
  ON public.account_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow service_role full write"
  ON public.account_settings
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
