-- migrations/006_ai_insights.sql
-- Stores AI-generated trading insights so the dashboard can read the
-- latest one without re-calling the model on every page load.

CREATE TABLE IF NOT EXISTS public.ai_insights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_label    TEXT NOT NULL,
  summary         TEXT NOT NULL,
  observations    JSONB NOT NULL,         -- [{title, detail, sentiment, category}]
  stats_snapshot  JSONB,                  -- compact aggregates fed to the model
  model           TEXT NOT NULL,
  input_tokens    INT,
  output_tokens   INT
);

CREATE INDEX IF NOT EXISTS ai_insights_generated_idx
  ON public.ai_insights (generated_at DESC);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON public.ai_insights;
DROP POLICY IF EXISTS "Allow service_role full write" ON public.ai_insights;

CREATE POLICY "Public Read Access"
  ON public.ai_insights
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow service_role full write"
  ON public.ai_insights
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
