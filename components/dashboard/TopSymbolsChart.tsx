// components/dashboard/TopSymbolsChart.tsx
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
import type { SymbolRow } from "@/lib/types";
import { fmtSignedUsd, fmtUsdCompact } from "@/lib/utils";

export default function TopSymbolsChart({ data }: { data: SymbolRow[] }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">
          Symbol Performance Ranking
        </h3>
        <p className="text-xs text-slate-500">
          Net P&L per ticker — capital growth contribution
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
              dataKey="ticker"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
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
              formatter={(value: number) => [fmtSignedUsd(value), "Net P&L"]}
            />
            <Bar dataKey="netPnl" radius={[6, 6, 0, 0]}>
              {data.map((row) => (
                <Cell
                  key={row.ticker}
                  fill={row.netPnl >= 0 ? "#22c55e" : "#ef4444"}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
