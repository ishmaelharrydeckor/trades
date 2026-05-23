// components/dashboard/EquityCurveChart.tsx
"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EquityPoint } from "@/lib/types";
import { fmtSignedUsd, fmtUsdCompact } from "@/lib/utils";

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: EquityPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const date = new Date(p.time).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="rounded-lg border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)]/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="text-slate-500">{date}</div>
      <div className="mt-1 flex items-center gap-3">
        <span className="text-slate-400">Equity</span>
        <span className="font-semibold text-white tnum">
          {fmtSignedUsd(p.equity)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-slate-400">Trade P&L</span>
        <span
          className="font-semibold tnum"
          style={{
            color: p.pnl >= 0 ? "var(--accent-profit)" : "var(--accent-loss)",
          }}
        >
          {fmtSignedUsd(p.pnl)}
        </span>
      </div>
    </div>
  );
}

export default function EquityCurveChart({ data }: { data: EquityPoint[] }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Equity Curve</h2>
          <p className="text-xs text-slate-500">Cumulative P&L over time</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full bg-[color:var(--accent-equity)]" />
          Net Equity
        </div>
      </div>
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) =>
                new Date(v).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
              minTickGap={32}
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
              content={<CustomTooltip />}
              cursor={{ stroke: "#3b82f6", strokeOpacity: 0.3, strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#equityFill)"
              activeDot={{ r: 5, stroke: "#0b0f19", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
