// components/dashboard/RiskCompliancePanel.tsx
// Shows how well the trader sticks to their N-part risk rule.

"use client";

import { useMemo } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import type { AccountTransaction, Trade } from "@/lib/types";
import { computeRiskCompliance } from "@/lib/account";
import { cn, fmtUsd } from "@/lib/utils";

export default function RiskCompliancePanel({
  trades,
  transactions,
  parts = 10,
}: {
  trades: Trade[];
  transactions: AccountTransaction[];
  parts?: number;
}) {
  const r = useMemo(
    () => computeRiskCompliance(trades, transactions, parts),
    [trades, transactions, parts]
  );

  const rateColor =
    r.complianceRate >= 90
      ? "text-[color:var(--accent-profit)]"
      : r.complianceRate >= 70
        ? "text-amber-300"
        : "text-[color:var(--accent-loss)]";

  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold">Risk Compliance</h3>
          <p className="text-xs text-[color:var(--text-secondary)]">
            Actual risk per trade vs your {parts}-part allowance ({r.allowedPct.toFixed(1)}% of equity)
          </p>
        </div>
      </div>

      {r.trackedTrades === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[color:var(--border-panel)] py-10 text-center">
          <ShieldAlert className="mb-2 h-6 w-6 text-[color:var(--text-secondary)]" />
          <p className="text-sm text-[color:var(--text-secondary)]">
            No risk data yet.
          </p>
          <p className="mt-1 max-w-sm text-xs text-[color:var(--text-secondary)]">
            Close a trade with a stop loss set, using EA v3.21+. The EA computes
            the dollar risk and the dashboard checks it against your allowance.
          </p>
          {r.untrackedTrades > 0 && (
            <p className="mt-2 text-[11px] text-[color:var(--text-secondary)]">
              {r.untrackedTrades} existing{" "}
              {r.untrackedTrades === 1 ? "trade has" : "trades have"} no risk data
              (placed before the EA update).
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Headline compliance rate */}
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
            <div className="flex items-center gap-3 rounded-xl border border-[color:var(--border-panel)] bg-black/10 px-5 py-4">
              {r.complianceRate >= 90 ? (
                <ShieldCheck className="h-8 w-8 text-[color:var(--accent-profit)]" />
              ) : (
                <ShieldAlert className="h-8 w-8 text-amber-300" />
              )}
              <div>
                <div className={cn("text-3xl font-bold tabular-nums", rateColor)}>
                  {r.complianceRate.toFixed(0)}%
                </div>
                <div className="text-[11px] uppercase tracking-wider text-[color:var(--text-secondary)]">
                  Compliant
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="Within Rule" value={String(r.compliantCount)} tone="profit" />
              <MiniStat label="Oversized" value={String(r.overCount)} tone={r.overCount > 0 ? "loss" : undefined} />
              <MiniStat label="Avg Risk" value={`${r.avgRiskPct.toFixed(1)}%`} />
              <MiniStat label="Max Risk" value={`${r.maxRiskPct.toFixed(1)}%`} tone={r.maxRiskPct > r.allowedPct ? "loss" : undefined} />
            </div>
          </div>

          {/* Violations list */}
          {r.violations.length > 0 ? (
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                Oversized positions ({r.violations.length})
              </div>
              <div className="space-y-1.5">
                {r.violations.slice(0, 8).map((v) => (
                  <div
                    key={v.ticket_id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--accent-loss)]/20 bg-[color:var(--accent-loss)]/[0.05] px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-sm font-medium">{v.ticker}</span>
                      <span className="text-[11px] text-[color:var(--text-secondary)]">
                        {new Date(v.close_time).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs tabular-nums">
                      <span className="text-[color:var(--text-secondary)]">
                        risked <span className="font-semibold text-white">{fmtUsd(v.riskAmount)}</span>
                      </span>
                      <span className="text-[color:var(--text-secondary)]">
                        allowed {fmtUsd(v.allowedRisk)}
                      </span>
                      <span className="font-semibold text-[color:var(--accent-loss)]">
                        +{fmtUsd(v.overBy)} over
                      </span>
                      <span className="rounded bg-[color:var(--accent-loss)]/15 px-1.5 py-0.5 font-semibold text-[color:var(--accent-loss)]">
                        {v.riskPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-[color:var(--accent-profit)]/20 bg-[color:var(--accent-profit)]/[0.05] px-3 py-2.5 text-sm text-[color:var(--accent-profit)]">
              <ShieldCheck className="h-4 w-4" />
              Every tracked trade respected your {parts}-part allowance. Disciplined sizing.
            </div>
          )}

          {r.untrackedTrades > 0 && (
            <p className="mt-3 text-[11px] text-[color:var(--text-secondary)]">
              {r.untrackedTrades} older{" "}
              {r.untrackedTrades === 1 ? "trade" : "trades"} excluded (no risk data
              from before the EA update).
            </p>
          )}
        </>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "profit" | "loss";
}) {
  return (
    <div className="rounded-lg border border-[color:var(--border-panel)] bg-black/10 p-3">
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--text-secondary)]">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums",
          tone === "profit" && "text-[color:var(--accent-profit)]",
          tone === "loss" && "text-[color:var(--accent-loss)]"
        )}
      >
        {value}
      </div>
    </div>
  );
}
