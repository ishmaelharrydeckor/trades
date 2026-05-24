// components/dashboard/DurationDistribution.tsx
"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DurationBucket } from "@/lib/types";
import { fmtSignedUsd, fmtUsdCompact } from "@/lib/utils";

interface Props {
  data: DurationBucket[];
}

const tooltipStyle = {
  background: "#131b2e",
  border: "1px solid #1e293b",
  borderRadius: 8,
  fontSize: 12,
};

export default function DurationDistribution({ data }: Props) {
  const hasOpenTimeData = data.some(
    (b) => b.label !== "None" && b.trades > 0
  );

  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">
          Intraday Duration
        </h3>
        <p className="text-xs text-slate-500">
          {hasOpenTimeData
            ? "Trade count and P&L grouped by hold time"
            : "Awaiting trades with open_time data from your MT5 EA"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Trade count distribution */}
        <div>
          <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">
            Trade Distribution
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: "rgba(245,158,11,0.06)" }}
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "#94a3b8" }}
                  formatter={(value: number) => [value, "Trades"]}
                />
                <Bar
                  dataKey="trades"
                  fill="#f59e0b"
                  fillOpacity={0.8}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* P&L performance */}
        <div>
          <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">
            Performance (Net P&L)
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => fmtUsdCompact(v as number)}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: "rgba(59,130,246,0.06)" }}
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "#94a3b8" }}
                  formatter={(value: number) => [
                    fmtSignedUsd(value),
                    "Net P&L",
                  ]}
                />
                <Bar dataKey="netPnl" radius={[0, 4, 4, 0]}>
                  {data.map((row) => (
                    <Cell
                      key={row.label}
                      fill={row.netPnl >= 0 ? "#22c55e" : "#ef4444"}
                      fillOpacity={row.trades === 0 ? 0.2 : 0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
