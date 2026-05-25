// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

export function fmtUsd(n: number): string {
  return usd.format(n);
}

export function fmtUsdCompact(n: number): string {
  return usdCompact.format(n);
}

export function fmtPct(n: number, digits = 2): string {
  return `${n.toFixed(digits)}%`;
}

export function fmtNumber(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtSignedUsd(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${usd.format(Math.abs(n))}`;
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format a duration in seconds as "Xd Yh", "Xh Ym", "Xm Ys", or "Xs". */
export function fmtDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  if (s < 86400)
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
}

/** Convert a trade array to CSV text. Wraps every field in quotes for safety. */
const CSV_COLS = [
  "ticket_id",
  "close_time",
  "open_time",
  "asset_class",
  "ticker",
  "direction",
  "lots",
  "net_pnl",
  "outcome",
  "commission",
  "swap",
  "entry_price",
  "stop_loss",
  "take_profit",
  "r_multiple",
] as const;

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '""';
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function tradesToCsv(trades: Array<Record<string, unknown>>): string {
  const header = CSV_COLS.join(",");
  const lines = trades.map((t) =>
    CSV_COLS.map((col) => csvEscape(t[col])).join(",")
  );
  return [header, ...lines].join("\n");
}

/** Trigger a browser download of CSV text. Works only in the browser. */
export function downloadCsv(filename: string, csvText: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
