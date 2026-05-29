// components/dashboard/InsightsPanel.tsx
// Shows the latest AI-generated insight with a regenerate button.

"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Shield,
  Target,
  Brain,
  Clock,
  Zap,
} from "lucide-react";
import type { InsightObservation, StoredInsight } from "@/lib/insights";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<InsightObservation["category"], typeof Sparkles> = {
  discipline: Shield,
  edge: Target,
  risk: AlertTriangle,
  timing: Clock,
  psychology: Brain,
};

const SENTIMENT_STYLES: Record<
  InsightObservation["sentiment"],
  { border: string; bg: string; iconColor: string; Icon: typeof CheckCircle2 }
> = {
  positive: {
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/[0.04]",
    iconColor: "text-emerald-300",
    Icon: CheckCircle2,
  },
  negative: {
    border: "border-red-500/25",
    bg: "bg-red-500/[0.04]",
    iconColor: "text-red-300",
    Icon: AlertTriangle,
  },
  neutral: {
    border: "border-[color:var(--border-panel)]",
    bg: "bg-black/10",
    iconColor: "text-slate-400",
    Icon: Minus,
  },
};

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function InsightsPanel() {
  const [insight, setInsight] = useState<StoredInsight | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchLatest() {
    try {
      const r = await fetch("/api/insights", { cache: "no-store" });
      const j = await r.json();
      if (j.insight) setInsight(j.insight as StoredInsight);
    } catch {
      // ignore
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    fetchLatest();
  }, []);

  async function generate(force = false) {
    setGenerating(true);
    setError(null);
    try {
      const r = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.detail || j.error || "Generation failed.");
      } else if (j.insight) {
        setInsight(j.insight as StoredInsight);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-blue-400" />
          <div>
            <h3 className="text-base font-semibold">AI Insights</h3>
            <p className="text-xs text-[color:var(--text-secondary)]">
              {insight
                ? `${insight.period_label} · generated ${formatRelative(insight.generated_at)} · ${insight.model.split("-").slice(0, 3).join("-")}`
                : "Specific, data-driven observations from your trading history"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => generate(insight !== null)}
          disabled={generating}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--border-panel)] px-3 py-1.5 text-xs font-medium transition",
            generating
              ? "cursor-wait opacity-50"
              : "hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-white"
          )}
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", generating && "animate-spin")}
          />
          {insight ? "Regenerate" : "Generate insights"}
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.05] px-3 py-2 text-xs text-amber-300">
          {error}
        </div>
      )}

      {!loaded && (
        <div className="flex items-center gap-2 text-sm text-[color:var(--text-secondary)]">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Loading…
        </div>
      )}

      {loaded && !insight && !generating && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[color:var(--border-panel)] py-8 text-center">
          <Zap className="mb-2 h-6 w-6 text-[color:var(--text-secondary)]" />
          <p className="text-sm text-[color:var(--text-secondary)]">
            No insights generated yet.
          </p>
          <p className="mt-1 max-w-sm text-xs text-[color:var(--text-secondary)]">
            Click <span className="text-white">Generate insights</span> to have
            the model review your aggregate statistics and surface specific
            observations.
          </p>
        </div>
      )}

      {generating && !insight && (
        <div className="flex items-center justify-center py-8 text-sm text-[color:var(--text-secondary)]">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Analyzing your trading data…
        </div>
      )}

      {insight && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="rounded-xl border border-blue-500/25 bg-blue-500/[0.05] px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-blue-300/70">
              Verdict
            </div>
            <p className="mt-1 text-sm text-white">{insight.summary}</p>
          </div>

          {/* Observations */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {insight.observations.map((o, i) => {
              const style = SENTIMENT_STYLES[o.sentiment] ?? SENTIMENT_STYLES.neutral;
              const CatIcon = CATEGORY_ICON[o.category] ?? Sparkles;
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl border p-3.5",
                    style.border,
                    style.bg
                  )}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <style.Icon
                        className={cn("h-3.5 w-3.5 shrink-0", style.iconColor)}
                      />
                      <h4 className="text-sm font-semibold text-white">
                        {o.title}
                      </h4>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--text-secondary)]">
                      <CatIcon className="h-2.5 w-2.5" />
                      {o.category}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">
                    {o.detail}
                  </p>
                </div>
              );
            })}
          </div>

          {(insight.input_tokens != null || insight.output_tokens != null) && (
            <div className="text-right text-[10px] text-[color:var(--text-secondary)]">
              {insight.input_tokens ?? 0} in · {insight.output_tokens ?? 0} out
            </div>
          )}
        </div>
      )}
    </div>
  );
}
