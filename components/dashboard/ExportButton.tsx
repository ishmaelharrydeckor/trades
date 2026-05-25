// components/dashboard/ExportButton.tsx
"use client";

import { Download } from "lucide-react";
import type { Trade } from "@/lib/types";
import { tradesToCsv, csvFilename } from "@/lib/csv";

export default function ExportButton({ trades }: { trades: Trade[] }) {
  const handleExport = () => {
    if (trades.length === 0) return;
    const csv = tradesToCsv(trades);
    // BOM prefix so Excel opens UTF-8 cleanly
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = csvFilename();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const disabled = trades.length === 0;

  return (
    <button
      onClick={handleExport}
      disabled={disabled}
      title={
        disabled
          ? "No trades to export"
          : `Export ${trades.length.toLocaleString()} trade${trades.length === 1 ? "" : "s"} to CSV`
      }
      className="flex items-center gap-2 rounded-lg border border-[color:var(--border-panel)] bg-slate-900/40 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Export CSV</span>
    </button>
  );
}
