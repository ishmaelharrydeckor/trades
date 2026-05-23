// components/dashboard/RecentTradesTable.tsx
import { ArrowDown, ArrowUp } from "lucide-react";
import type { Trade } from "@/lib/types";
import { cn, fmtDateTime, fmtNumber, fmtSignedUsd } from "@/lib/utils";

export default function RecentTradesTable({ trades }: { trades: Trade[] }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">
            Recent Executions
          </h3>
          <p className="text-xs text-slate-500">
            Last {trades.length} closed positions
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-3 text-left font-medium">Closed</th>
              <th className="px-3 py-3 text-left font-medium">Ticker</th>
              <th className="px-3 py-3 text-left font-medium">Direction</th>
              <th className="px-3 py-3 text-right font-medium">Lots</th>
              <th className="px-3 py-3 text-right font-medium">P&L</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-sm text-slate-500"
                  colSpan={5}
                >
                  No executions yet — webhook standing by.
                </td>
              </tr>
            )}
            {trades.map((t) => {
              const positive = t.net_pnl > 0;
              const negative = t.net_pnl < 0;
              return (
                <tr
                  key={t.ticket_id}
                  className={cn(
                    "border-t border-[color:var(--border-panel)] transition-colors",
                    positive && "bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]",
                    negative && "bg-red-500/[0.03] hover:bg-red-500/[0.06]"
                  )}
                >
                  <td className="px-3 py-3 text-slate-400 tnum">
                    {fmtDateTime(t.close_time)}
                  </td>
                  <td className="px-3 py-3 font-medium text-white">
                    {t.ticker}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                        t.direction === "BUY"
                          ? "bg-emerald-500/10 text-[color:var(--accent-profit)]"
                          : "bg-red-500/10 text-[color:var(--accent-loss)]"
                      )}
                    >
                      {t.direction === "BUY" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      {t.direction}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-slate-300 tnum">
                    {fmtNumber(t.lots)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-3 text-right font-semibold tnum",
                      positive && "text-[color:var(--accent-profit)]",
                      negative && "text-[color:var(--accent-loss)]",
                      !positive && !negative && "text-slate-300"
                    )}
                  >
                    {fmtSignedUsd(t.net_pnl)}
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
