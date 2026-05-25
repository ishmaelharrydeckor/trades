// lib/csv.ts
import type { Trade } from "./types";

const HEADERS: (keyof Trade)[] = [
  "ticket_id",
  "close_time",
  "open_time",
  "asset_class",
  "ticker",
  "direction",
  "lots",
  "net_pnl",
  "outcome",
  "entry_price",
  "stop_loss",
  "take_profit",
  "commission",
  "swap",
  "r_multiple",
];

// RFC 4180 quoting: if a value contains a comma, quote, or newline, wrap it
// in quotes and double any internal quotes.
function escape(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function tradesToCsv(trades: Trade[]): string {
  const lines: string[] = [HEADERS.join(",")];
  for (const t of trades) {
    const row = HEADERS.map((h) => escape(t[h] as unknown));
    lines.push(row.join(","));
  }
  return lines.join("\r\n");
}

export function csvFilename(prefix = "trades"): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hm = `${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
  return `${prefix}-${ymd}-${hm}.csv`;
}
