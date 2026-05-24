// lib/types.ts
// Mirrors the `trades` table in Supabase.

export type AssetClass = "FOREX" | "INDICES" | "COMMODITIES";
export type Direction = "BUY" | "SELL";
export type Outcome = "WIN" | "LOSS" | "BREAKEVEN";

export interface Trade {
  ticket_id: string;
  close_time: string; // ISO timestamp with TZ
  asset_class: AssetClass;
  ticker: string;
  direction: Direction;
  lots: number;
  net_pnl: number;
  outcome: Outcome;

  // Optional — populated when the MT5 EA sends them.
  open_time?: string | null;       // ISO timestamp; enables duration analytics
  entry_price?: number | null;
  stop_loss?: number | null;
  take_profit?: number | null;
  commission?: number | null;      // usually negative
  swap?: number | null;             // usually negative
  r_multiple?: number | null;       // realized R; preferred direct from EA
}

export interface KpiSummary {
  netPnl: number;
  winRate: number;
  profitFactor: number;
  totalVolume: number;
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
  totalBreakeven: number;
  grossProfit: number;
  grossLoss: number; // stored as a negative number
  avgWinner: number;
  avgLoser: number;
  largestWin: number;
  worstLoss: number;
  maxWinStreak: number;
  maxLossStreak: number;
}

export interface EquityPoint {
  time: string;       // ISO timestamp
  equity: number;     // cumulative P&L
  pnl: number;        // this trade's P&L
  ticket_id: string;
}

export interface DailyAggregate {
  date: string;       // YYYY-MM-DD
  net: number;
  trades: number;
}

export interface AssetClassRow {
  asset_class: AssetClass;
  trades: number;
  volume: number;
  netPnl: number;
  winRate: number;
}

export interface SymbolRow {
  ticker: string;
  netPnl: number;
  trades: number;
}

export type SessionName = "London" | "NY" | "Asian" | "Outside";

export interface SessionRow {
  session: SessionName;
  trades: number;
  winRate: number;
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
}

export interface WeekdayRow {
  day: string;
  trades: number;
  winRate: number;
  netPnl: number;
}

export interface HourRow {
  hour: number;
  label: string;
  trades: number;
  winRate: number;
  netPnl: number;
}

export interface DirectionRow {
  direction: Direction;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
  avgWinner: number;
  avgLoser: number;
}

export interface DurationBucket {
  label: string;
  trades: number;
  netPnl: number;
}

export interface RMultipleBucket {
  label: string;
  trades: number;
  netPnl: number;
}

export interface DailyStatsSummary {
  // Core P&L
  totalPnl: number;
  avgDailyPnl: number;
  avgTradePnl: number;
  expectancy: number;
  // Extremes
  largestProfit: number;
  largestLoss: number;
  avgWinner: number;
  avgLoser: number;
  // Day-level
  avgWinningDay: number;
  avgLosingDay: number;
  bestDay: number;
  worstDay: number;
  // Volume / costs
  avgDailyVolume: number;
  totalVolume: number;
  totalCommissions: number;
  totalSwap: number;
  profitFactor: number;
  // Day counts
  totalTradingDays: number;
  winningDays: number;
  losingDays: number;
  // Streaks (trades)
  maxWinStreak: number;
  maxLossStreak: number;
  // Streaks (days)
  maxWinDayStreak: number;
  maxLossDayStreak: number;
  // Monthly extremes
  bestMonthLabel: string;
  bestMonthPnl: number;
  worstMonthLabel: string;
  worstMonthPnl: number;
  // Duration (needs open_time on trades)
  avgWinDurationSec: number;
  avgLossDurationSec: number;
  // Consistency
  consistencyPct: number;
  // Total
  totalBreakeven: number;
  totalTrades: number;
}

export interface PairDayRow {
  day: string; // Mon..Sun
  // tickers become dynamic keys: { day: "Mon", "EUR/USD": 120, "USDCAD": -50, ... }
  [ticker: string]: string | number;
}
