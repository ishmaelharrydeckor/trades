// components/dashboard/SessionPanel.tsx
import type { SessionRow } from "@/lib/types";
import { cn, fmtPct, fmtSignedUsd } from "@/lib/utils";
import { Globe2, Sunrise, Sun, Moon } from "lucide-react";

const ICONS = {
  London: Sun,
  NY: Sunrise,
  Asian: Moon,
  Outside: Globe2,
} as const;

const ACCENT = {
  London: "text-amber-300 bg-amber-500/10",
  NY: "text-blue-300 bg-blue-500/10",
  Asian: "text-purple-300 bg-purple-500/10",
  Outside: "text-slate-300 bg-slate-500/10",
} as const;

export default function SessionPanel({ rows }: { rows: SessionRow[] }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">
          Performance by Session
        </h3>
        <p className="text-xs text-slate-500">
          Trades bucketed by close-time UTC · Asian 00–07 · London 07–13 · NY 13–22
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {rows.map((r) => {
          const Icon = ICONS[r.session];
          const positive = r.netPnl > 0;
          const negative = r.netPnl < 0;
          return (
            <div
              key={r.session}
              className="rounded-xl border border-[color:var(--border-panel)] bg-slate-900/40 p-4"
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium",
                    ACCENT[r.session]
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {r.session}
                </span>
                <span className="text-xs text-slate-500 tnum">
                  {r.trades} trades
                </span>
              </div>
              <div
                className={cn(
                  "mt-3 text-xl font-semibold tnum",
                  positive && "text-[color:var(--accent-profit)]",
                  negative && "text-[color:var(--accent-loss)]",
                  !positive && !negative && "text-slate-400"
                )}
              >
                {fmtSignedUsd(r.netPnl)}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Win rate{" "}
                <span className="font-medium text-slate-300 tnum">
                  {fmtPct(r.winRate, 1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
