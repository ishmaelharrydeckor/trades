// lib/types.ts
// Mirrors the `trades` table in Supabase.

export type AssetClass = "FOREX" | "INDICES" | "COMMODITIES" | "CRYPTO";
export type Direction = "BUY" | "SELL";
export type Outcome = "WIN" | "LOSS" | "BREAKEVEN";
export type Mindset =
  | "DISCIPLINED"
  | "CONFIDENT"
  | "PATIENT"
  | "FOMO"
  | "REVENGE"
  | "HESITANT";

export const MINDSETS: Mindset[] = [
  "DISCIPLINED",
  "CONFIDENT",
  "PATIENT",
  "FOMO",
  "REVENGE",
  "HESITANT",
];

export const SUGGESTED_TAGS: string[] = [
  "Breakout",
  "Order Block",
  "Trend Continuation",
  "News Fade",
  "Scalp",
  "Swing",
  "Reversal",
  "Range",
  "Pullback",
  "FVG",
];

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
  risk_amount?: number | null;      // dollar amount at risk if SL had hit

  // Optional — manually enriched by the trader via the edit modal.
  tags?: string[] | null;
  notes?: string | null;
  mindset?: Mindset | null;
  screenshot_url?: string | null;
}

export interface EnrichmentRow {
  /** Tag name or mindset bucket label */
  key: string;
  trades: number;
  netPnl: number;
  winRate: number; // 0..100, excluding BE
  avgPnl: number;
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
  // Durations in seconds (0 when no open_time data is available)
  avgTradeDurationSec: number;
  avgWinDurationSec: number;
  avgLossDurationSec: number;
  // Consistency: bestDay / totalPnl × 100 (lower = more consistent)
  consistencyPct: number;
  consistencyBestDay: number;
  // Risk/Reward: avgWinner / |avgLoser|
  riskRewardRatio: number;
  // Totals
  totalBreakeven: number;
  totalTrades: number;
}

export interface PairDayRow {
  day: string; // Mon..Sun
  // tickers become dynamic keys: { day: "Mon", "EUR/USD": 120, "USDCAD": -50, ... }
  [ticker: string]: string | number;
}

export interface PairDayMatrix {
  tickers: string[];
  rows: PairDayRow[];
}

// ============================================================
// Account tracking — capital, deposits, withdrawals, drawdown.
// ============================================================

export type TransactionKind =
  | "STARTING_BALANCE"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "ADJUSTMENT";

export const TRANSACTION_KINDS: TransactionKind[] = [
  "STARTING_BALANCE",
  "DEPOSIT",
  "WITHDRAWAL",
  "ADJUSTMENT",
];

export interface AccountTransaction {
  id: string;
  occurred_at: string;     // ISO timestamp
  kind: TransactionKind;
  amount: number;          // always positive except for ADJUSTMENT (which can be signed)
  note?: string | null;
  created_at: string;
}

/**
 * Snapshot of the account at a given point in time.
 * `currentBalance` is the sum of starting balance + deposits + adjustments
 * - withdrawals + closed-trade P&L.
 */
export interface AccountState {
  startingBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalAdjustments: number;
  totalPnl: number;
  netCashFlow: number;     // deposits - withdrawals + adjustments
  currentBalance: number;
  hasStartingBalance: boolean;
  riskPerPart: number;     // currentBalance / strategyParts
  strategyParts: number;   // default 10 — split capital into N equal risk units
}

export interface AccountEquityPoint {
  time: string;            // ISO timestamp
  equity: number;          // cumulative balance at this point
  delta: number;           // change at this point
  kind: "trade" | "transaction";
}

export interface DrawdownPoint {
  time: string;
  equity: number;
  peak: number;
  drawdown: number;        // peak - equity (always >= 0)
  drawdownPct: number;     // 0..100
}

export interface DrawdownStats {
  maxDrawdown: number;
  maxDrawdownPct: number;
  maxDrawdownAt: string | null;     // when the trough occurred
  currentDrawdown: number;
  currentDrawdownPct: number;
  peakEquity: number;
  peakEquityAt: string | null;
  daysInCurrentDrawdown: number;
  averageDrawdown: number;          // mean of all non-zero drawdowns
  recoveryDays: number | null;      // null if currently in drawdown
}

// ============================================================
// Risk compliance — actual risk per trade vs the N-part allowance.
// ============================================================

export interface RiskComplianceRow {
  ticket_id: string;
  ticker: string;
  close_time: string;
  riskAmount: number;      // dollars risked on this trade
  equityBefore: number;    // account equity just before this trade
  allowedRisk: number;     // equityBefore / parts
  riskPct: number;         // riskAmount / equityBefore * 100
  isCompliant: boolean;
  overBy: number;          // riskAmount - allowedRisk (>0 means oversized)
}

export interface RiskComplianceSummary {
  trackedTrades: number;   // trades that have a risk_amount
  untrackedTrades: number; // trades missing risk_amount (pre-EA-v3.21)
  compliantCount: number;
  overCount: number;
  complianceRate: number;  // 0..100
  avgRiskPct: number;
  maxRiskPct: number;
  allowedPct: number;      // 100 / parts
  parts: number;
  violations: RiskComplianceRow[]; // oversized trades, worst first
}
