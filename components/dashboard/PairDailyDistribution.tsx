// components/dashboard/PairDailyDistribution.tsx
"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PairDayRow } from "@/lib/types";
import { fmtSignedUsd, fmtUsdCompact } from "@/lib/utils";

interface Props {
  tickers: string[];
  rows: PairDayRow[];
}

const LINE_COLORS = [
  "#3b82f6", "#f59e0b", "#22c55e", "#ef4444",
  "#a855f7", "#06b6d4", "#ec4899", "#84cc16",
];

const tooltipStyle = {
  background: "#131b2e",
  border: "1px solid #1e293b",
  borderRadius: 8,
  fontSize: 12,
};

export default function PairDailyDistribution({ tickers, rows }: Props) {
  const hasData = tickers.length > 0;

  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">
          Pair Daily Distribution
        </h3>
        <p className="text-xs text-slate-500">
          {hasData
            ? `Net P&L for your top ${tickers.length} ticker${tickers.length === 1 ? "" : "s"} across the week`
            : "Awaiting trade data"}
        </p>
      </div>

      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={64}
              tickFormatter={(v) => fmtUsdCompact(v as number)}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(value: number, name: string) => [fmtSignedUsd(value), name]}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
            {tickers.map((ticker, idx) => (
              <Line
                key={ticker}
                type="monotone"
                dataKey={ticker}
                stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, stroke: "#0b0f19", strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
