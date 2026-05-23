// components/dashboard/AssetMatrix.tsx
import type { AssetClassRow } from "@/lib/types";
import { cn, fmtNumber, fmtPct, fmtSignedUsd } from "@/lib/utils";

export default function AssetMatrix({ rows }: { rows: AssetClassRow[] }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">
          Performance by Asset Class
        </h3>
        <p className="text-xs text-slate-500">
          Breakdown across FOREX and INDICES exposure
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[color:var(--border-panel)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 text-left font-medium">Asset Class</th>
              <th className="px-4 py-3 text-right font-medium">Trades</th>
              <th className="px-4 py-3 text-right font-medium">Volume (lots)</th>
              <th className="px-4 py-3 text-right font-medium">Win Rate</th>
              <th className="px-4 py-3 text-right font-medium">Net P&L</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  className="px-4 py-6 text-center text-sm text-slate-500"
                  colSpan={5}
                >
                  No trades recorded yet.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const positive = r.netPnl > 0;
              const negative = r.netPnl < 0;
              return (
                <tr
                  key={r.asset_class}
                  className="border-t border-[color:var(--border-panel)]"
                >
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium",
                        r.asset_class === "FOREX"
                          ? "bg-blue-500/10 text-blue-300"
                          : "bg-purple-500/10 text-purple-300"
                      )}
                    >
                      {r.asset_class}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300 tnum">
                    {r.trades.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300 tnum">
                    {fmtNumber(r.volume)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300 tnum">
                    {fmtPct(r.winRate, 1)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-semibold tnum",
                      positive && "text-[color:var(--accent-profit)]",
                      negative && "text-[color:var(--accent-loss)]",
                      !positive && !negative && "text-slate-300"
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
