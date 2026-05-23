// lib/types.ts
// Mirrors the `trades` table in Supabase.

export type AssetClass = "FOREX" | "INDICES";
export type Direction = "BUY" | "SELL";
export type Outcome = "WIN" | "LOSS";

export interface Trade {
  ticket_id: string;
  close_time: string; // ISO timestamp with TZ
  asset_class: AssetClass;
  ticker: string;
  direction: Direction;
  lots: number;
  net_pnl: number;
  outcome: Outcome;
}

export interface KpiSummary {
  netPnl: number;
  winRate: number;
  profitFactor: number;
  totalVolume: number;
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
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
