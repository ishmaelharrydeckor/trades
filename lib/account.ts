// lib/account.ts
// Pure functions for computing account state, equity curve, and drawdown.
// Separated from stats.ts to keep the trading-metrics module clean.

import type {
  AccountState,
  AccountTransaction,
  DrawdownPoint,
  DrawdownStats,
  AccountEquityPoint,
  RiskComplianceRow,
  RiskComplianceSummary,
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

// ============================================================
// Risk compliance — does each trade respect the N-part rule?
// ============================================================

const RISK_TOLERANCE = 1.1; // allow up to 10% over the allowance before flagging

/**
 * For each trade with a known risk_amount, compute the equity that existed
 * just before that trade and compare the dollar risk to equity / parts.
 */
export function computeRiskCompliance(
  trades: Trade[],
  transactions: AccountTransaction[],
  parts = 10
): RiskComplianceSummary {
  // Build a chronological timeline of transactions + trades, tracking the
  // running balance so we know the equity available before each trade.
  type Ev =
    | { time: number; kind: "tx"; delta: number }
    | { time: number; kind: "trade"; trade: Trade };

  const events: Ev[] = [];
  for (const tx of transactions) {
    events.push({
      time: new Date(tx.occurred_at).getTime(),
      kind: "tx",
      delta: netDelta(tx),
    });
  }
  for (const t of trades) {
    events.push({
      time: new Date(t.close_time).getTime(),
      kind: "trade",
      trade: t,
    });
  }
  events.sort((a, b) => a.time - b.time);

  const allowedPct = parts > 0 ? 100 / parts : 0;
  const rows: RiskComplianceRow[] = [];
  let untracked = 0;
  let running = 0;

  for (const ev of events) {
    if (ev.kind === "tx") {
      running += ev.delta;
      continue;
    }
    const t = ev.trade;
    const equityBefore = running;
    // apply trade P&L to running balance after capturing equityBefore
    running += Number(t.net_pnl);

    const risk = t.risk_amount;
    if (risk == null || !Number.isFinite(Number(risk)) || Number(risk) <= 0) {
      untracked++;
      continue;
    }
    const riskAmount = Number(risk);
    const allowedRisk = equityBefore > 0 ? equityBefore / parts : 0;
    const riskPct = equityBefore > 0 ? (riskAmount / equityBefore) * 100 : 0;
    const isCompliant =
      allowedRisk > 0 ? riskAmount <= allowedRisk * RISK_TOLERANCE : false;

    rows.push({
      ticket_id: t.ticket_id,
      ticker: t.ticker,
      close_time: t.close_time,
      riskAmount,
      equityBefore,
      allowedRisk,
      riskPct,
      isCompliant,
      overBy: riskAmount - allowedRisk,
    });
  }

  const trackedTrades = rows.length;
  const compliantCount = rows.filter((r) => r.isCompliant).length;
  const overCount = trackedTrades - compliantCount;
  const complianceRate =
    trackedTrades > 0 ? (compliantCount / trackedTrades) * 100 : 0;
  const avgRiskPct =
    trackedTrades > 0
      ? rows.reduce((s, r) => s + r.riskPct, 0) / trackedTrades
      : 0;
  const maxRiskPct = rows.reduce((m, r) => Math.max(m, r.riskPct), 0);

  const violations = rows
    .filter((r) => !r.isCompliant)
    .sort((a, b) => b.overBy - a.overBy);

  return {
    trackedTrades,
    untrackedTrades: untracked,
    compliantCount,
    overCount,
    complianceRate,
    avgRiskPct,
    maxRiskPct,
    allowedPct,
    parts,
    violations,
  };
}
