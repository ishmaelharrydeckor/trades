// components/dashboard/HourlyChart.tsx
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HourRow } from "@/lib/types";
import { fmtSignedUsd, fmtUsdCompact } from "@/lib/utils";

export default function HourlyChart({ data }: { data: HourRow[] }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">
          Performance by Hour (UTC)
        </h3>
        <p className="text-xs text-slate-500">
          Net P&L by close-time hour — identifies your sharp and dull hours
        </p>
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={1}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(v) => fmtUsdCompact(v as number)}
            />
            <Tooltip
              cursor={{ fill: "rgba(59,130,246,0.06)" }}
              contentStyle={{
                background: "#131b2e",
                border: "1px solid #1e293b",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#94a3b8" }}
              labelFormatter={(label) => `${label} UTC`}
              formatter={(value: number, _name, item) => {
                const trades = (item?.payload as HourRow)?.trades ?? 0;
                return [
                  `${fmtSignedUsd(value)} · ${trades} trades`,
                  "Net P&L",
                ];
              }}
            />
            <Bar dataKey="netPnl" radius={[4, 4, 0, 0]}>
              {data.map((row) => (
                <Cell
                  key={row.hour}
                  fill={row.netPnl >= 0 ? "#22c55e" : "#ef4444"}
                  fillOpacity={row.trades === 0 ? 0.2 : 0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
