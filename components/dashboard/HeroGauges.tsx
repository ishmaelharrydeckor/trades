// components/dashboard/HeroGauges.tsx
"use client";

import type { KpiSummary } from "@/lib/types";
import { fmtPct, fmtSignedUsd } from "@/lib/utils";
import Gauge from "./Gauge";

interface Props {
  kpi: KpiSummary;
  expectancy: number;
}

export default function HeroGauges({ kpi, expectancy }: Props) {
  // Profit factor maxes out visually at 3x — beyond that the arc just stays full.
  const pfRatio = Math.min(kpi.profitFactor / 3, 1);

  // Expectancy gauge is signed; convert to a 0..1 by sigmoid-ish scaling.
  // Center at zero, full arc at ±100 per trade.
  const expectancyRatio =
    expectancy >= 0
      ? Math.min(expectancy / 100, 1)
      : Math.min(Math.abs(expectancy) / 100, 1);

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      <Gauge
        label="Trade Win Rate"
        value={fmtPct(kpi.winRate)}
        ratio={kpi.winRate / 100}
        tone="profit"
        splitLeft={{ label: `${kpi.totalWins} W`, value: kpi.totalWins }}
        splitRight={{ label: `${kpi.totalLosses} L`, value: kpi.totalLosses }}
      />
      <Gauge
        label="Profit Factor"
        value={kpi.profitFactor.toFixed(2)}
        ratio={pfRatio}
        tone={kpi.profitFactor >= 1 ? "profit" : "loss"}
        splitLeft={{
          label: fmtSignedUsd(kpi.grossProfit),
          value: kpi.grossProfit,
        }}
        splitRight={{
          label: fmtSignedUsd(kpi.grossLoss),
          value: Math.abs(kpi.grossLoss),
        }}
      />
      <Gauge
        label="Expectancy / Trade"
        value={fmtSignedUsd(expectancy)}
        ratio={expectancyRatio}
        tone={expectancy >= 0 ? "profit" : "loss"}
        splitLeft={{ label: fmtSignedUsd(kpi.avgWinner), value: kpi.avgWinner }}
        splitRight={{
          label: fmtSignedUsd(kpi.avgLoser),
          value: Math.abs(kpi.avgLoser),
        }}
      />
    </div>
  );
}
