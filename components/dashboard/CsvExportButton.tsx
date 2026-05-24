// components/dashboard/CsvExportButton.tsx
"use client";

import { Download } from "lucide-react";
import type { Trade } from "@/lib/types";

const COLUMNS: (keyof Trade)[] = [
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
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Escape if contains comma, quote, or newline
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildCsv(trades: Trade[]): string {
  const header = COLUMNS.join(",");
  const rows = trades.map((t) =>
    COLUMNS.map((col) => csvCell(t[col])).join(",")
  );
  return [header, ...rows].join("\n");
}

export default function CsvExportButton({ trades }: { trades: Trade[] }) {
  function handleClick() {
    if (trades.length === 0) return;
    const csv = buildCsv(trades);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trades-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const disabled = trades.length === 0;

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="flex items-center gap-2 rounded-lg border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      title={
        disabled
          ? "No trades to export"
          : `Export ${trades.length.toLocaleString()} trades to CSV`
      }
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Export CSV</span>
    </button>
  );
}
