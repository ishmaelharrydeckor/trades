// lib/stats.ts
// Pure functions that derive every dashboard KPI from a Trade[] stream.
// Sorted chronologically before any sequence-dependent calculation.

import type {
  Trade,
  KpiSummary,
  EquityPoint,
  DailyAggregate,
  AssetClassRow,
  SymbolRow,
  SessionRow,
  WeekdayRow,
  HourRow,
  DirectionRow,
  SessionName,
} from "./types";

// ---------- helpers ----------

const byCloseTimeAsc = (a: Trade, b: Trade) =>
  new Date(a.close_time).getTime() - new Date(b.close_time).getTime();

const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d);

const toDateKey = (iso: string) => {
  // Local date bucketing — keeps the calendar aligned with the trader's day.
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// ---------- top-level KPIs ----------

export function computeKpis(trades: Trade[]): KpiSummary {
  if (trades.length === 0) {
    return {
      netPnl: 0,
      winRate: 0,
      profitFactor: 0,
      totalVolume: 0,
      totalTrades: 0,
      totalWins: 0,
      totalLosses: 0,
      grossProfit: 0,
      grossLoss: 0,
      avgWinner: 0,
      avgLoser: 0,
      largestWin: 0,
      worstLoss: 0,
      maxWinStreak: 0,
      maxLossStreak: 0,
    };
  }

  let grossProfit = 0;
  let grossLoss = 0;
  let totalVolume = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let largestWin = 0; // stays 0 if no winners exist
  let worstLoss = 0;  // stays 0 if no losers exist

  for (const t of trades) {
    totalVolume += t.lots;
    if (t.net_pnl >= 0) grossProfit += t.net_pnl;
    else grossLoss += t.net_pnl; // negative accumulator

    if (t.outcome === "WIN") totalWins += 1;
    else totalLosses += 1;

    // Only track largestWin among positive P&L trades.
    if (t.net_pnl > 0 && t.net_pnl > largestWin) largestWin = t.net_pnl;
    // Only track worstLoss among negative P&L trades.
    if (t.net_pnl < 0 && t.net_pnl < worstLoss) worstLoss = t.net_pnl;
  }

  const totalTrades = trades.length;
  const netPnl = grossProfit + grossLoss;
  const winRate = (totalWins / totalTrades) * 100;
  const profitFactor = safeDiv(grossProfit, Math.abs(grossLoss));
  const avgWinner = safeDiv(grossProfit, totalWins);
  const avgLoser = safeDiv(grossLoss, totalLosses); // negative
  const { maxWin, maxLoss } = computeStreaks(trades);

  return {
    netPnl,
    winRate,
    profitFactor,
    totalVolume,
    totalTrades,
    totalWins,
    totalLosses,
    grossProfit,
    grossLoss,
    avgWinner,
    avgLoser,
    largestWin,
    worstLoss,
    maxWinStreak: maxWin,
    maxLossStreak: maxLoss,
  };
}

// ---------- streaks ----------
// Chronological traversal: rolling counters reset on outcome switch.

export function computeStreaks(trades: Trade[]) {
  const sorted = [...trades].sort(byCloseTimeAsc);
  let maxWin = 0;
  let maxLoss = 0;
  let curWin = 0;
  let curLoss = 0;

  for (const t of sorted) {
    if (t.outcome === "WIN") {
      curWin += 1;
      curLoss = 0;
      if (curWin > maxWin) maxWin = curWin;
    } else {
      curLoss += 1;
      curWin = 0;
      if (curLoss > maxLoss) maxLoss = curLoss;
    }
  }

  return { maxWin, maxLoss };
}

// ---------- equity curve ----------
// Returns running cumulative P&L points indexed by close_time.

export function buildEquityCurve(trades: Trade[]): EquityPoint[] {
  const sorted = [...trades].sort(byCloseTimeAsc);
  const out: EquityPoint[] = [];
  let running = 0;
  for (const t of sorted) {
    running += t.net_pnl;
    out.push({
      time: t.close_time,
      equity: running,
      pnl: t.net_pnl,
      ticket_id: t.ticket_id,
    });
  }
  return out;
}

// ---------- calendar buckets ----------

export function aggregateByDay(trades: Trade[]): Map<string, DailyAggregate> {
  const map = new Map<string, DailyAggregate>();
  for (const t of trades) {
    const key = toDateKey(t.close_time);
    const cur = map.get(key) ?? { date: key, net: 0, trades: 0 };
    cur.net += t.net_pnl;
    cur.trades += 1;
    map.set(key, cur);
  }
  return map;
}

// ---------- asset breakdowns ----------

export function aggregateByAssetClass(trades: Trade[]): AssetClassRow[] {
  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    const arr = groups.get(t.asset_class) ?? [];
    arr.push(t);
    groups.set(t.asset_class, arr);
  }

  const rows: AssetClassRow[] = [];
  for (const [asset_class, list] of groups) {
    const wins = list.filter((t) => t.outcome === "WIN").length;
    const volume = list.reduce((s, t) => s + t.lots, 0);
    const netPnl = list.reduce((s, t) => s + t.net_pnl, 0);
    rows.push({
      asset_class: asset_class as AssetClassRow["asset_class"],
      trades: list.length,
      volume,
      netPnl,
      winRate: (wins / list.length) * 100,
    });
  }
  return rows.sort((a, b) => b.netPnl - a.netPnl);
}

export function aggregateBySymbol(trades: Trade[], limit = 8): SymbolRow[] {
  const map = new Map<string, SymbolRow>();
  for (const t of trades) {
    const cur = map.get(t.ticker) ?? { ticker: t.ticker, netPnl: 0, trades: 0 };
    cur.netPnl += t.net_pnl;
    cur.trades += 1;
    map.set(t.ticker, cur);
  }
  return Array.from(map.values())
    .sort((a, b) => b.netPnl - a.netPnl)
    .slice(0, limit);
}

// ---------- recent executions ----------

export function recentTrades(trades: Trade[], limit = 20): Trade[] {
  return [...trades]
    .sort(
      (a, b) =>
        new Date(b.close_time).getTime() - new Date(a.close_time).getTime()
    )
    .slice(0, limit);
}

// ---------- session aggregation ----------
// Forex sessions bucketed by close_time hour in UTC.
// Approximate windows — adjust if your strategy uses different cutoffs.

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function classifySession(iso: string): SessionName {
  const h = new Date(iso).getUTCHours();
  if (h >= 0 && h < 7) return "Asian";
  if (h >= 7 && h < 13) return "London";
  if (h >= 13 && h < 22) return "NY";
  return "Outside";
}

export function aggregateBySession(trades: Trade[]): SessionRow[] {
  const sessions: SessionName[] = ["London", "NY", "Asian", "Outside"];
  const groups = new Map<SessionName, Trade[]>(
    sessions.map((s) => [s, []])
  );

  for (const t of trades) {
    const s = classifySession(t.close_time);
    groups.get(s)!.push(t);
  }

  return sessions.map((session) => {
    const list = groups.get(session)!;
    const wins = list.filter((t) => t.outcome === "WIN").length;
    const netPnl = list.reduce((s, t) => s + t.net_pnl, 0);
    const grossProfit = list
      .filter((t) => t.net_pnl >= 0)
      .reduce((s, t) => s + t.net_pnl, 0);
    const grossLoss = list
      .filter((t) => t.net_pnl < 0)
      .reduce((s, t) => s + t.net_pnl, 0);
    return {
      session,
      trades: list.length,
      winRate: list.length > 0 ? (wins / list.length) * 100 : 0,
      netPnl,
      grossProfit,
      grossLoss,
    };
  });
}

// ---------- weekday aggregation ----------

export function aggregateByWeekday(trades: Trade[]): WeekdayRow[] {
  // 0 = Sunday in JS; we re-order to Monday-first for display.
  const buckets: Trade[][] = Array.from({ length: 7 }, () => []);
  for (const t of trades) {
    const dow = new Date(t.close_time).getDay();
    buckets[dow].push(t);
  }

  const order = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
  return order.map((dow) => {
    const list = buckets[dow];
    const wins = list.filter((t) => t.outcome === "WIN").length;
    const netPnl = list.reduce((s, t) => s + t.net_pnl, 0);
    return {
      day: WEEKDAY_NAMES[dow],
      trades: list.length,
      winRate: list.length > 0 ? (wins / list.length) * 100 : 0,
      netPnl,
    };
  });
}

// ---------- hourly aggregation ----------
// 24-hour breakdown by UTC close hour.

export function aggregateByHour(trades: Trade[]): HourRow[] {
  const buckets: Trade[][] = Array.from({ length: 24 }, () => []);
  for (const t of trades) {
    const h = new Date(t.close_time).getUTCHours();
    buckets[h].push(t);
  }

  return buckets.map((list, hour) => {
    const wins = list.filter((t) => t.outcome === "WIN").length;
    const netPnl = list.reduce((s, t) => s + t.net_pnl, 0);
    return {
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      trades: list.length,
      winRate: list.length > 0 ? (wins / list.length) * 100 : 0,
      netPnl,
    };
  });
}

// ---------- long vs short ----------

export function aggregateByDirection(trades: Trade[]): DirectionRow[] {
  const dirs: ("BUY" | "SELL")[] = ["BUY", "SELL"];
  return dirs.map((direction) => {
    const list = trades.filter((t) => t.direction === direction);
    const wins = list.filter((t) => t.outcome === "WIN").length;
    const losses = list.length - wins;
    const grossProfit = list
      .filter((t) => t.net_pnl >= 0)
      .reduce((s, t) => s + t.net_pnl, 0);
    const grossLoss = list
      .filter((t) => t.net_pnl < 0)
      .reduce((s, t) => s + t.net_pnl, 0);
    const netPnl = grossProfit + grossLoss;
    return {
      direction,
      trades: list.length,
      wins,
      losses,
      winRate: list.length > 0 ? (wins / list.length) * 100 : 0,
      netPnl,
      grossProfit,
      grossLoss,
      avgWinner: wins > 0 ? grossProfit / wins : 0,
      avgLoser: losses > 0 ? grossLoss / losses : 0,
    };
  });
}

// ---------- expectancy ----------
// Expected $ value per trade taken: (Win% × AvgWin) - (Loss% × |AvgLoss|)

export function computeExpectancy(kpi: KpiSummary): number {
  if (kpi.totalTrades === 0) return 0;
  const winProb = kpi.totalWins / kpi.totalTrades;
  const lossProb = kpi.totalLosses / kpi.totalTrades;
  return winProb * kpi.avgWinner - lossProb * Math.abs(kpi.avgLoser);
}
