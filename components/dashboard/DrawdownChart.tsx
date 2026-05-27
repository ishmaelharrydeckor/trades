// components/dashboard/DrawdownChart.tsx
// Equity over time with a peak ceiling and shaded drawdown region underneath.

"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DrawdownPoint } from "@/lib/types";
import { fmtUsd, fmtUsdCompact } from "@/lib/utils";

export default function DrawdownChart({
  series,
}: {
  series: DrawdownPoint[];
}) {
  const data = useMemo(
    () =>
      series.map((p) => ({
        time: p.time,
        label: new Date(p.time).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        equity: Number(p.equity.toFixed(2)),
        peak: Number(p.peak.toFixed(2)),
        drawdown: Number(-p.drawdown.toFixed(2)), // negative for visual
        drawdownPct: Number(p.drawdownPct.toFixed(2)),
      })),
    [series]
  );

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
        <h3 className="text-base font-semibold">Drawdown</h3>
        <p className="text-xs text-[color:var(--text-secondary)]">
          Equity peak vs. current with drawdown region below
        </p>
        <div className="mt-6 flex h-64 items-center justify-center rounded-xl border border-dashed border-[color:var(--border-panel)] text-sm text-[color:var(--text-secondary)]">
          Add a starting balance to begin tracking drawdown.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold">Drawdown</h3>
        <p className="text-xs text-[color:var(--text-secondary)]">
          Equity vs. running peak — distance below the peak is your live drawdown
        </p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.35} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
            />
            <YAxis
              yAxisId="equity"
              tickFormatter={(v: number) => fmtUsdCompact(v)}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
              width={64}
            />
            <Tooltip
              cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeOpacity: 0.5 }}
              contentStyle={{
                backgroundColor: "#131b2e",
                border: "1px solid #1e293b",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(value: number, name: string) => {
                if (name === "Drawdown %")
                  return [`${Math.abs(value).toFixed(2)}%`, name];
                return [fmtUsd(value), name];
              }}
            />
            <Area
              yAxisId="equity"
              type="monotone"
              dataKey="peak"
              name="Peak"
              stroke="#22c55e"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              fill="transparent"
              dot={false}
              isAnimationActive={false}
            />
            <Area
              yAxisId="equity"
              type="monotone"
              dataKey="equity"
              name="Equity"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#equityFill)"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="equity"
              type="monotone"
              dataKey="drawdownPct"
              name="Drawdown %"
              stroke="transparent"
              dot={false}
              isAnimationActive={false}
              legendType="none"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
