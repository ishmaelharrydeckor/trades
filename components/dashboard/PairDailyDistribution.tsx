// components/dashboard/PairDailyDistribution.tsx
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PairDayRow } from "@/lib/types";
import { fmtSignedUsd, fmtUsdCompact } from "@/lib/utils";

interface Props {
  data: PairDayRow[];
  tickers: string[];
}

// A distinct palette for up to 5 tickers
const PALETTE = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899"];

export default function PairDailyDistribution({ data, tickers }: Props) {
  if (tickers.length === 0) {
    return (
      <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
        <h3 className="text-base font-semibold text-white">
          Pair Daily Distribution
        </h3>
        <p className="mt-2 text-xs text-slate-500">No trades yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">
          Pair Daily Distribution
        </h3>
        <p className="text-xs text-slate-500">
          Net P&L per top {tickers.length} pair{tickers.length > 1 ? "s" : ""},
          grouped by day of week
        </p>
      </div>
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />
            <XAxis
              dataKey="day"
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
              formatter={(value: number) => fmtSignedUsd(value)}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
              iconType="circle"
              iconSize={8}
            />
            {tickers.map((ticker, i) => (
              <Bar
                key={ticker}
                dataKey={ticker}
                fill={PALETTE[i % PALETTE.length]}
                radius={[4, 4, 0, 0]}
                fillOpacity={0.85}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
