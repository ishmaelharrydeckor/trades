// lib/account.ts
// Pure functions for computing account state, equity curve, and drawdown.
// Separated from stats.ts to keep the trading-metrics module clean.

import type {
  AccountState,
  AccountTransaction,
  DrawdownPoint,
  DrawdownStats,
  AccountEquityPoint,
  Trade,
} from "./types";

const DEFAULT_STRATEGY_PARTS = 10;

/**
 * Net contribution of a transaction to the running balance.
 * Withdrawals are stored as positive amounts (e.g. amount=500 means $500 was withdrawn),
 * and the sign is applied here.
 */
export function netDelta(tx: AccountTransaction): number {
  switch (tx.kind) {
    case "WITHDRAWAL":
      return -Math.abs(Number(tx.amount));
    case "ADJUSTMENT":
      return Number(tx.amount); // signed
    case "DEPOSIT":
    case "STARTING_BALANCE":
      return Math.abs(Number(tx.amount));
  }
}

export function computeAccountState(
  transactions: AccountTransaction[],
  trades: Trade[],
  opts: { asOf?: Date; strategyParts?: number } = {}
): AccountState {
  const cutoff = opts.asOf?.getTime() ?? Number.POSITIVE_INFINITY;
  const strategyParts = opts.strategyParts ?? DEFAULT_STRATEGY_PARTS;

  let startingBalance = 0;
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let totalAdjustments = 0;
  let hasStartingBalance = false;

  for (const tx of transactions) {
    if (new Date(tx.occurred_at).getTime() > cutoff) continue;
    const amt = Math.abs(Number(tx.amount));
    if (tx.kind === "STARTING_BALANCE") {
      startingBalance += amt;
      hasStartingBalance = true;
    } else if (tx.kind === "DEPOSIT") {
      totalDeposits += amt;
    } else if (tx.kind === "WITHDRAWAL") {
      totalWithdrawals += amt;
    } else if (tx.kind === "ADJUSTMENT") {
      totalAdjustments += Number(tx.amount); // signed
    }
  }

  let totalPnl = 0;
  for (const t of trades) {
    if (new Date(t.close_time).getTime() > cutoff) continue;
    totalPnl += Number(t.net_pnl);
  }

  const netCashFlow = totalDeposits - totalWithdrawals + totalAdjustments;
  const currentBalance = startingBalance + netCashFlow + totalPnl;
  const riskPerPart = currentBalance > 0 ? currentBalance / strategyParts : 0;

  return {
    startingBalance,
    totalDeposits,
    totalWithdrawals,
    totalAdjustments,
    totalPnl,
    netCashFlow,
    currentBalance,
    hasStartingBalance,
    riskPerPart,
    strategyParts,
  };
}

/**
 * Merge transactions and trades into a single chronological equity timeline.
 * Each point shows the running balance after the event is applied.
 */
export function computeEquitySeries(
  transactions: AccountTransaction[],
  trades: Trade[]
): AccountEquityPoint[] {
  type Event = { time: string; delta: number; kind: "trade" | "transaction" };
  const events: Event[] = [];

  for (const tx of transactions) {
    events.push({
      time: tx.occurred_at,
      delta: netDelta(tx),
      kind: "transaction",
    });
  }
  for (const t of trades) {
    events.push({
      time: t.close_time,
      delta: Number(t.net_pnl),
      kind: "trade",
    });
  }

  events.sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  let equity = 0;
  return events.map((e) => {
    equity += e.delta;
    return { time: e.time, equity, delta: e.delta, kind: e.kind };
  });
}

/**
 * Convert an equity series into a drawdown series.
 * Drawdown is measured against the running all-time peak.
 */
export function computeDrawdownSeries(equity: AccountEquityPoint[]): DrawdownPoint[] {
  if (equity.length === 0) return [];
  let peak = equity[0].equity;
  const out: DrawdownPoint[] = [];
  for (const p of equity) {
    if (p.equity > peak) peak = p.equity;
    const dd = Math.max(0, peak - p.equity);
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
    out.push({
      time: p.time,
      equity: p.equity,
      peak,
      drawdown: dd,
      drawdownPct: ddPct,
    });
  }
  return out;
}

export function computeDrawdownStats(
  drawdownSeries: DrawdownPoint[]
): DrawdownStats {
  if (drawdownSeries.length === 0) {
    return {
      maxDrawdown: 0,
      maxDrawdownPct: 0,
      maxDrawdownAt: null,
      currentDrawdown: 0,
      currentDrawdownPct: 0,
      peakEquity: 0,
      peakEquityAt: null,
      daysInCurrentDrawdown: 0,
      averageDrawdown: 0,
      recoveryDays: null,
    };
  }

  let maxDd = 0;
  let maxDdPct = 0;
  let maxDdAt: string | null = null;
  let peakEquity = drawdownSeries[0].peak;
  let peakEquityAt: string | null = drawdownSeries[0].time;
  let lastPeakTime = drawdownSeries[0].time;
  let ddSum = 0;
  let ddCount = 0;

  for (const p of drawdownSeries) {
    if (p.drawdown > maxDd) {
      maxDd = p.drawdown;
      maxDdPct = p.drawdownPct;
      maxDdAt = p.time;
    }
    if (p.peak > peakEquity) {
      peakEquity = p.peak;
      peakEquityAt = p.time;
      lastPeakTime = p.time;
    }
    if (p.drawdown > 0) {
      ddSum += p.drawdown;
      ddCount++;
    }
  }

  const last = drawdownSeries[drawdownSeries.length - 1];
  const currentDrawdown = last.drawdown;
  const currentDrawdownPct = last.drawdownPct;

  const daysInCurrentDrawdown = currentDrawdown > 0
    ? Math.max(
        0,
        Math.floor(
          (new Date(last.time).getTime() - new Date(lastPeakTime).getTime()) /
            86400000
        )
      )
    : 0;

  return {
    maxDrawdown: maxDd,
    maxDrawdownPct: maxDdPct,
    maxDrawdownAt: maxDdAt,
    currentDrawdown,
    currentDrawdownPct,
    peakEquity,
    peakEquityAt,
    daysInCurrentDrawdown,
    averageDrawdown: ddCount > 0 ? ddSum / ddCount : 0,
    recoveryDays: currentDrawdown === 0 ? daysInCurrentDrawdown : null,
  };
}
