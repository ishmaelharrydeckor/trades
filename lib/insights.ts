// lib/insights.ts
// Builds a compact statistics snapshot to feed to the AI model.

import type { AccountTransaction, Trade } from "./types";
import {
  computeKpis,
  computeStreaks,
  aggregateBySymbol,
  aggregateByWeekday,
  aggregateBySession,
  aggregateByDirection,
  aggregateByTag,
  aggregateByMindset,
} from "./stats";
import {
  computeAccountState,
  computeEquitySeries,
  computeDrawdownSeries,
  computeDrawdownStats,
  computeRiskCompliance,
} from "./account";

export interface InsightObservation {
  title: string;
  detail: string;
  sentiment: "positive" | "negative" | "neutral";
  category: "discipline" | "edge" | "risk" | "timing" | "psychology";
}

export interface InsightsPayload {
  summary: string;
  observations: InsightObservation[];
}

export interface StoredInsight {
  id: string;
  generated_at: string;
  period_label: string;
  summary: string;
  observations: InsightObservation[];
  stats_snapshot?: unknown;
  model: string;
  input_tokens?: number | null;
  output_tokens?: number | null;
}

export interface InsightStats {
  period_label: string;
  total_trades: number;
  net_pnl: number;
  win_rate_pct: number;
  profit_factor: number;
  avg_win: number;
  avg_loss: number;
  largest_win: number;
  worst_loss: number;
  max_consecutive_wins: number;
  max_consecutive_losses: number;
  by_weekday: Array<{ day: string; trades: number; net: number; win_rate_pct: number }>;
  by_session: Array<{ session: string; trades: number; net: number; win_rate_pct: number }>;
  by_direction: Array<{ direction: string; trades: number; net: number; win_rate_pct: number }>;
  by_symbol_top: Array<{ symbol: string; trades: number; net: number }>;
  by_symbol_bottom: Array<{ symbol: string; trades: number; net: number }>;
  by_mindset?: Array<{ mindset: string; trades: number; net: number; win_rate_pct: number }>;
  by_tag_top?: Array<{ tag: string; trades: number; net: number; win_rate_pct: number }>;
  account?: {
    starting_balance: number;
    current_balance: number;
    lifetime_return_pct: number;
    max_drawdown_pct: number;
    current_drawdown_pct: number;
  };
  risk_compliance?: {
    tracked_trades: number;
    compliance_rate_pct: number;
    over_count: number;
    avg_risk_pct: number;
    max_risk_pct: number;
    allowed_pct: number;
  };
}

export function buildInsightStats(
  trades: Trade[],
  transactions: AccountTransaction[]
): InsightStats {
  const kpi = computeKpis(trades);
  const streaks = computeStreaks(trades);

  const weekday = aggregateByWeekday(trades).map((r) => ({
    day: r.day,
    trades: r.trades,
    net: round2(r.netPnl),
    win_rate_pct: round1(r.winRate),
  }));

  const session = aggregateBySession(trades).map((r) => ({
    session: r.session,
    trades: r.trades,
    net: round2(r.netPnl),
    win_rate_pct: round1(r.winRate),
  }));

  const direction = aggregateByDirection(trades).map((r) => ({
    direction: r.direction,
    trades: r.trades,
    net: round2(r.netPnl),
    win_rate_pct: round1(r.winRate),
  }));

  const symbols = aggregateBySymbol(trades, 20);
  const by_symbol_top = symbols
    .slice()
    .sort((a, b) => b.netPnl - a.netPnl)
    .slice(0, 3)
    .map((r) => ({ symbol: r.ticker, trades: r.trades, net: round2(r.netPnl) }));
  const by_symbol_bottom = symbols
    .slice()
    .sort((a, b) => a.netPnl - b.netPnl)
    .slice(0, 3)
    .map((r) => ({ symbol: r.ticker, trades: r.trades, net: round2(r.netPnl) }));

  const tagRows = aggregateByTag(trades);
  const by_tag_top =
    tagRows.length > 0
      ? tagRows
          .slice()
          .sort((a, b) => b.netPnl - a.netPnl)
          .slice(0, 5)
          .map((r) => ({
            tag: r.key,
            trades: r.trades,
            net: round2(r.netPnl),
            win_rate_pct: round1(r.winRate),
          }))
      : undefined;

  const mindsetRows = aggregateByMindset(trades);
  const by_mindset =
    mindsetRows.length > 0
      ? mindsetRows.map((r) => ({
          mindset: r.key,
          trades: r.trades,
          net: round2(r.netPnl),
          win_rate_pct: round1(r.winRate),
        }))
      : undefined;

  // Account-level stats (only if a starting balance is set)
  let account: InsightStats["account"];
  let risk_compliance: InsightStats["risk_compliance"];
  if (transactions.length > 0) {
    const state = computeAccountState(transactions, trades);
    if (state.hasStartingBalance) {
      const baseline = state.startingBalance + state.netCashFlow;
      const lifetimeReturnPct =
        state.startingBalance > 0
          ? ((state.currentBalance - baseline) / state.startingBalance) * 100
          : 0;
      const series = computeEquitySeries(transactions, trades);
      const dd = computeDrawdownSeries(series);
      const ddStats = computeDrawdownStats(dd);
      account = {
        starting_balance: round2(state.startingBalance),
        current_balance: round2(state.currentBalance),
        lifetime_return_pct: round2(lifetimeReturnPct),
        max_drawdown_pct: round2(ddStats.maxDrawdownPct),
        current_drawdown_pct: round2(ddStats.currentDrawdownPct),
      };
      const rc = computeRiskCompliance(trades, transactions, state.strategyParts);
      if (rc.trackedTrades > 0) {
        risk_compliance = {
          tracked_trades: rc.trackedTrades,
          compliance_rate_pct: round1(rc.complianceRate),
          over_count: rc.overCount,
          avg_risk_pct: round2(rc.avgRiskPct),
          max_risk_pct: round2(rc.maxRiskPct),
          allowed_pct: round1(rc.allowedPct),
        };
      }
    }
  }

  return {
    period_label: "All time",
    total_trades: kpi.totalTrades,
    net_pnl: round2(kpi.netPnl),
    win_rate_pct: round1(kpi.winRate),
    profit_factor: round2(kpi.profitFactor),
    avg_win: round2(kpi.avgWinner),
    avg_loss: round2(kpi.avgLoser),
    largest_win: round2(kpi.largestWin),
    worst_loss: round2(kpi.worstLoss),
    max_consecutive_wins: streaks.maxWin,
    max_consecutive_losses: streaks.maxLoss,
    by_weekday: weekday,
    by_session: session,
    by_direction: direction,
    by_symbol_top,
    by_symbol_bottom,
    by_mindset,
    by_tag_top,
    account,
    risk_compliance,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
