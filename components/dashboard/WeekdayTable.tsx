// components/dashboard/WeekdayTable.tsx
import type { WeekdayRow } from "@/lib/types";
import { cn, fmtPct, fmtSignedUsd } from "@/lib/utils";

export default function WeekdayTable({ rows }: { rows: WeekdayRow[] }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">
          Weekday Performance
        </h3>
        <p className="text-xs text-slate-500">
          How you trade across the days of the week
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-[color:var(--border-panel)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 text-left font-medium">Day</th>
              <th className="px-4 py-3 text-right font-medium">Trades</th>
              <th className="px-4 py-3 text-left font-medium">Win Rate</th>
              <th className="px-4 py-3 text-right font-medium">Net P&L</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const positive = r.netPnl > 0;
              const negative = r.netPnl < 0;
              return (
                <tr
                  key={r.day}
                  className="border-t border-[color:var(--border-panel)]"
                >
                  <td className="px-4 py-3 text-slate-300">{r.day}</td>
                  <td className="px-4 py-3 text-right text-slate-300 tnum">
                    {r.trades}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-900/60">
                        <div
                          className="h-full bg-[color:var(--accent-profit)]"
                          style={{ width: `${r.winRate}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 tnum">
                        {fmtPct(r.winRate, 1)}
                      </span>
                    </div>
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-semibold tnum",
                      positive && "text-[color:var(--accent-profit)]",
                      negative && "text-[color:var(--accent-loss)]",
                      !positive && !negative && "text-slate-400"
                    )}
                  >
                    {fmtSignedUsd(r.netPnl)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
