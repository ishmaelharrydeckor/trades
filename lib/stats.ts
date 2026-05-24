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
  DurationBucket,
  RMultipleBucket,
  DailyStatsSummary,
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
      totalBreakeven: 0,
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
  let totalBreakeven = 0;
  let largestWin = 0;
  let worstLoss = 0;

  for (const t of trades) {
    totalVolume += t.lots;
    if (t.net_pnl >= 0) grossProfit += t.net_pnl;
    else grossLoss += t.net_pnl;

    if (t.outcome === "WIN") totalWins += 1;
    else if (t.outcome === "LOSS") totalLosses += 1;
    else totalBreakeven += 1; // BREAKEVEN

    if (t.net_pnl > 0 && t.net_pnl > largestWin) largestWin = t.net_pnl;
    if (t.net_pnl < 0 && t.net_pnl < worstLoss) worstLoss = t.net_pnl;
  }

  const totalTrades = trades.length;
  const netPnl = grossProfit + grossLoss;

  // Win rate excludes breakeven trades from the denominator — matches industry
  // standard and what prop-firm dashboards (GFT etc.) display.
  const decisive = totalWins + totalLosses;
  const winRate = decisive > 0 ? (totalWins / decisive) * 100 : 0;

  const profitFactor = safeDiv(grossProfit, Math.abs(grossLoss));
  const avgWinner = safeDiv(grossProfit, totalWins);
  const avgLoser = safeDiv(grossLoss, totalLosses);
  const { maxWin, maxLoss } = computeStreaks(trades);

  return {
    netPnl,
    winRate,
    profitFactor,
    totalVolume,
    totalTrades,
    totalWins,
    totalLosses,
    totalBreakeven,
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
    } else if (t.outcome === "LOSS") {
      curLoss += 1;
      curWin = 0;
      if (curLoss > maxLoss) maxLoss = curLoss;
    } else {
      // BREAKEVEN: doesn't extend or break either streak — skip it.
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
    const losses = list.filter((t) => t.outcome === "LOSS").length;
    const decisive = wins + losses;
    const volume = list.reduce((s, t) => s + t.lots, 0);
    const netPnl = list.reduce((s, t) => s + t.net_pnl, 0);
    rows.push({
      asset_class: asset_class as AssetClassRow["asset_class"],
      trades: list.length,
      volume,
      netPnl,
      winRate: decisive > 0 ? (wins / decisive) * 100 : 0,
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
    const losses = list.filter((t) => t.outcome === "LOSS").length;
    const decisive = wins + losses;
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
      winRate: decisive > 0 ? (wins / decisive) * 100 : 0,
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
    const losses = list.filter((t) => t.outcome === "LOSS").length;
    const decisive = wins + losses;
    const netPnl = list.reduce((s, t) => s + t.net_pnl, 0);
    return {
      day: WEEKDAY_NAMES[dow],
      trades: list.length,
      winRate: decisive > 0 ? (wins / decisive) * 100 : 0,
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
    const losses = list.filter((t) => t.outcome === "LOSS").length;
    const decisive = wins + losses;
    const netPnl = list.reduce((s, t) => s + t.net_pnl, 0);
    return {
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      trades: list.length,
      winRate: decisive > 0 ? (wins / decisive) * 100 : 0,
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
    const losses = list.filter((t) => t.outcome === "LOSS").length;
    const decisive = wins + losses;
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
      winRate: decisive > 0 ? (wins / decisive) * 100 : 0,
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

// ---------- duration aggregation ----------
// Buckets trades by hold time (close_time - open_time). Skips trades without open_time.

const DURATION_BUCKETS: { label: string; maxSec: number }[] = [
  { label: "Under 1 min", maxSec: 60 },
  { label: "1m to 10m", maxSec: 600 },
  { label: "10m to 1h", maxSec: 3600 },
  { label: "1h to 4h", maxSec: 14400 },
  { label: "4h to 24h", maxSec: 86400 },
  { label: "24h to 3d", maxSec: 259200 },
  { label: "3d to 1w", maxSec: 604800 },
  { label: "1w to 1m", maxSec: 2592000 },
  { label: "1 month+", maxSec: Infinity },
];

export function aggregateByDuration(trades: Trade[]): DurationBucket[] {
  const buckets: DurationBucket[] = DURATION_BUCKETS.map((b) => ({
    label: b.label,
    trades: 0,
    netPnl: 0,
  }));
  let noneTrades = 0;
  let noneNetPnl = 0;

  for (const t of trades) {
    if (!t.open_time) {
      noneTrades += 1;
      noneNetPnl += t.net_pnl;
      continue;
    }
    const durSec =
      (new Date(t.close_time).getTime() - new Date(t.open_time).getTime()) /
      1000;
    if (durSec < 0) {
      // bad timestamps; treat as None
      noneTrades += 1;
      noneNetPnl += t.net_pnl;
      continue;
    }
    const idx = DURATION_BUCKETS.findIndex((b) => durSec < b.maxSec);
    const target = idx === -1 ? buckets.length - 1 : idx;
    buckets[target].trades += 1;
    buckets[target].netPnl += t.net_pnl;
  }

  if (noneTrades > 0) {
    buckets.push({ label: "None", trades: noneTrades, netPnl: noneNetPnl });
  }
  return buckets;
}

// ---------- r-multiple aggregation ----------
// Buckets trades by realized R. Uses r_multiple field if present; otherwise "None".
// Negative buckets are (lower, upper] and positive buckets are [lower, upper),
// so -1.0 lands in "−1 to −1.99R" (not "−0.01 to −0.99R").

const R_LABELS = [
  "−4R or less",       // 0:  r ≤ -4
  "−3 to −3.99R",      // 1:  -4 < r ≤ -3
  "−2 to −2.99R",      // 2:  -3 < r ≤ -2
  "−1 to −1.99R",      // 3:  -2 < r ≤ -1
  "−0.01 to −0.99R",   // 4:  -1 < r <  0
  "0 to 0.99R",        // 5:   0 ≤ r <  1
  "1 to 1.99R",        // 6:   1 ≤ r <  2
  "2 to 2.99R",        // 7:   2 ≤ r <  3
  "3 to 3.99R",        // 8:   3 ≤ r <  4
  "4R or more",        // 9:   r ≥ 4
];

function rBucketIndex(r: number): number {
  if (r <= -4) return 0;
  if (r <= -3) return 1;
  if (r <= -2) return 2;
  if (r <= -1) return 3;
  if (r < 0) return 4;
  if (r < 1) return 5;
  if (r < 2) return 6;
  if (r < 3) return 7;
  if (r < 4) return 8;
  return 9;
}

export function aggregateByRMultiple(trades: Trade[]): RMultipleBucket[] {
  const buckets: RMultipleBucket[] = R_LABELS.map((label) => ({
    label,
    trades: 0,
    netPnl: 0,
  }));
  let noneTrades = 0;
  let noneNetPnl = 0;

  for (const t of trades) {
    if (t.r_multiple === null || t.r_multiple === undefined) {
      noneTrades += 1;
      noneNetPnl += t.net_pnl;
      continue;
    }
    const idx = rBucketIndex(t.r_multiple);
    buckets[idx].trades += 1;
    buckets[idx].netPnl += t.net_pnl;
  }

  if (noneTrades > 0) {
    buckets.push({ label: "None", trades: noneTrades, netPnl: noneNetPnl });
  }
  return buckets;
}

// ---------- day-level streaks ----------
// A "winning day" has net > 0 for the day; a "losing day" has net < 0.
// Streaks are chronological runs of consecutive winning or losing days.

function computeDayStreaks(daily: DailyAggregate[]): {
  maxWinDayStreak: number;
  maxLossDayStreak: number;
} {
  const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date));
  let maxWin = 0;
  let maxLoss = 0;
  let curWin = 0;
  let curLoss = 0;

  for (const d of sorted) {
    if (d.net > 0) {
      curWin += 1;
      curLoss = 0;
      if (curWin > maxWin) maxWin = curWin;
    } else if (d.net < 0) {
      curLoss += 1;
      curWin = 0;
      if (curLoss > maxLoss) maxLoss = curLoss;
    } else {
      // zero day: doesn't extend either streak but doesn't break them either.
      // The conservative choice is to reset both. Pick reset here.
      curWin = 0;
      curLoss = 0;
    }
  }
  return { maxWinDayStreak: maxWin, maxLossDayStreak: maxLoss };
}

// ---------- monthly aggregation ----------

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelFromKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function bestWorstMonth(trades: Trade[]): {
  bestKey: string;
  bestPnl: number;
  worstKey: string;
  worstPnl: number;
} {
  const map = new Map<string, number>();
  for (const t of trades) {
    const k = monthKey(t.close_time);
    map.set(k, (map.get(k) ?? 0) + t.net_pnl);
  }
  if (map.size === 0) {
    return { bestKey: "", bestPnl: 0, worstKey: "", worstPnl: 0 };
  }
  let bestKey = "";
  let bestPnl = -Infinity;
  let worstKey = "";
  let worstPnl = Infinity;
  for (const [k, v] of map) {
    if (v > bestPnl) {
      bestPnl = v;
      bestKey = k;
    }
    if (v < worstPnl) {
      worstPnl = v;
      worstKey = k;
    }
  }
  return { bestKey, bestPnl, worstKey, worstPnl };
}

// ---------- daily stats summary (the big GFT-style grid) ----------

export function computeDailyStats(trades: Trade[]): DailyStatsSummary {
  const kpi = computeKpis(trades);
  const expectancy = computeExpectancy(kpi);

  // Per-day aggregation
  const dailyMap = aggregateByDay(trades);
  const dailyArr = Array.from(dailyMap.values());

  let winningDays = 0;
  let losingDays = 0;
  let sumWinningDayPnl = 0;
  let sumLosingDayPnl = 0;
  let bestDay = 0;
  let worstDay = 0;
  for (const d of dailyArr) {
    if (d.net > 0) {
      winningDays += 1;
      sumWinningDayPnl += d.net;
    } else if (d.net < 0) {
      losingDays += 1;
      sumLosingDayPnl += d.net;
    }
    if (d.net > bestDay) bestDay = d.net;
    if (d.net < worstDay) worstDay = d.net;
  }
  const totalTradingDays = dailyArr.length;
  const avgDailyPnl = totalTradingDays > 0 ? kpi.netPnl / totalTradingDays : 0;
  const avgDailyVolume =
    totalTradingDays > 0 ? kpi.totalVolume / totalTradingDays : 0;

  const { maxWinDayStreak, maxLossDayStreak } = computeDayStreaks(dailyArr);

  // Costs from optional fields
  let totalCommissions = 0;
  let totalSwap = 0;
  for (const t of trades) {
    if (typeof t.commission === "number") totalCommissions += t.commission;
    if (typeof t.swap === "number") totalSwap += t.swap;
  }

  const { bestKey, bestPnl, worstKey, worstPnl } = bestWorstMonth(trades);
  const durations = computeDurationStats(trades);
  const consistency = computeConsistency(trades);

  return {
    totalPnl: kpi.netPnl,
    avgDailyPnl,
    avgTradePnl: kpi.totalTrades > 0 ? kpi.netPnl / kpi.totalTrades : 0,
    expectancy,
    largestProfit: kpi.largestWin,
    largestLoss: kpi.worstLoss,
    avgWinner: kpi.avgWinner,
    avgLoser: kpi.avgLoser,
    avgWinningDay: winningDays > 0 ? sumWinningDayPnl / winningDays : 0,
    avgLosingDay: losingDays > 0 ? sumLosingDayPnl / losingDays : 0,
    bestDay,
    worstDay,
    avgDailyVolume,
    totalVolume: kpi.totalVolume,
    totalCommissions,
    totalSwap,
    profitFactor: kpi.profitFactor,
    totalTradingDays,
    winningDays,
    losingDays,
    maxWinStreak: kpi.maxWinStreak,
    maxLossStreak: kpi.maxLossStreak,
    maxWinDayStreak,
    maxLossDayStreak,
    bestMonthLabel: bestKey ? monthLabelFromKey(bestKey) : "—",
    bestMonthPnl: bestKey ? bestPnl : 0,
    worstMonthLabel: worstKey ? monthLabelFromKey(worstKey) : "—",
    worstMonthPnl: worstKey ? worstPnl : 0,
    avgWinDurationSec: durations.avgWinDurationSec,
    avgLossDurationSec: durations.avgLossDurationSec,
    consistencyPct: consistency,
    totalBreakeven: kpi.totalBreakeven,
    totalTrades: kpi.totalTrades,
  };
}

// ---------- duration stats (need open_time) ----------

export function computeDurationStats(trades: Trade[]): {
  avgWinDurationSec: number;
  avgLossDurationSec: number;
} {
  let winSum = 0, winCount = 0;
  let lossSum = 0, lossCount = 0;

  for (const t of trades) {
    if (!t.open_time) continue;
    const dur =
      (new Date(t.close_time).getTime() - new Date(t.open_time).getTime()) /
      1000;
    if (dur < 0) continue;
    if (t.outcome === "WIN") {
      winSum += dur;
      winCount += 1;
    } else if (t.outcome === "LOSS") {
      lossSum += dur;
      lossCount += 1;
    }
  }

  return {
    avgWinDurationSec: winCount > 0 ? winSum / winCount : 0,
    avgLossDurationSec: lossCount > 0 ? lossSum / lossCount : 0,
  };
}

// ---------- consistency ----------
// Prop-firm style: best winning-day P&L ÷ total winning-day P&L.
// 0–100% range. Lower = more consistent. Most prop firms cap at 30–50%.

export function computeConsistency(trades: Trade[]): number {
  const daily = aggregateByDay(trades);
  const winningDays = Array.from(daily.values()).filter((d) => d.net > 0);
  if (winningDays.length === 0) return 0;
  const bestDay = Math.max(...winningDays.map((d) => d.net));
  const totalWinningPnl = winningDays.reduce((s, d) => s + d.net, 0);
  return totalWinningPnl > 0 ? (bestDay / totalWinningPnl) * 100 : 0;
}

// ---------- pair daily distribution ----------
// Returns one row per weekday with one numeric key per top ticker.
// Shape suits a Recharts grouped bar chart directly.

export function aggregatePairByDay(
  trades: Trade[],
  topN = 5
): { tickers: string[]; rows: import("./types").PairDayRow[] } {
  // 1. Pick the top N tickers by absolute P&L (excludes "no signal" ones)
  const totals = new Map<string, number>();
  for (const t of trades) {
    totals.set(t.ticker, (totals.get(t.ticker) ?? 0) + Math.abs(t.net_pnl));
  }
  const tickers = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([t]) => t);

  // 2. Build rows: weekday × tickers
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const order = [1, 2, 3, 4, 5, 6, 0]; // JS getDay maps: 1=Mon..0=Sun

  const rows = order.map((dow, idx) => {
    const row: import("./types").PairDayRow = { day: dayLabels[idx] };
    for (const ticker of tickers) {
      const net = trades
        .filter(
          (t) =>
            t.ticker === ticker &&
            new Date(t.close_time).getDay() === dow
        )
        .reduce((s, t) => s + t.net_pnl, 0);
      row[ticker] = Math.round(net * 100) / 100;
    }
    return row;
  });

  return { tickers, rows };
}
