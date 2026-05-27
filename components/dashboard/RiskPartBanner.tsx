// components/dashboard/RiskPartBanner.tsx
// Reminds the user of their 10-part risk allocation strategy.

"use client";

import { Target } from "lucide-react";
import type { AccountState } from "@/lib/types";
import { fmtUsd } from "@/lib/utils";

export default function RiskPartBanner({ state }: { state: AccountState }) {
  if (!state.hasStartingBalance) return null;

  const riskPct = (1 / state.strategyParts) * 100;

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-blue-500/[0.06] p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blue-500/15 p-2 text-blue-300">
          <Target className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-200">
            {state.strategyParts}-part risk strategy
          </h3>
          <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
            Current capital split into {state.strategyParts} equal parts.
            Recommended risk per trade: <span className="font-semibold text-white">{fmtUsd(state.riskPerPart)}</span> ({riskPct.toFixed(1)}% of equity).
          </p>
        </div>
        <div className="hidden text-right md:block">
          <div className="text-[10px] uppercase tracking-wider text-[color:var(--text-secondary)]">
            Risk / Part
          </div>
          <div className="text-2xl font-bold tabular-nums text-blue-200">
            {fmtUsd(state.riskPerPart)}
          </div>
        </div>
      </div>
    </div>
  );
}
