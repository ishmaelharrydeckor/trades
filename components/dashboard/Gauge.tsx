// components/dashboard/Gauge.tsx
"use client";

import { cn } from "@/lib/utils";

interface Props {
  label: string;
  /** Center value, already formatted (e.g. "87.50%" or "1.97") */
  value: string;
  /** 0..1 fill ratio for the arc */
  ratio: number;
  /** Optional split bar values shown below the gauge */
  splitLeft?: { label: string; value: number };
  splitRight?: { label: string; value: number };
  tone?: "profit" | "loss" | "blue" | "neutral";
}

const toneColor: Record<NonNullable<Props["tone"]>, string> = {
  profit: "#22c55e",
  loss: "#ef4444",
  blue: "#3b82f6",
  neutral: "#94a3b8",
};

export default function Gauge({
  label,
  value,
  ratio,
  splitLeft,
  splitRight,
  tone = "profit",
}: Props) {
  // Clamp ratio to [0, 1]
  const r = Math.max(0, Math.min(1, ratio));

  // Semicircle path math. Radius 80, center at (100, 100), arc from 180° to 360°.
  const radius = 80;
  const circumference = Math.PI * radius; // half circle perimeter
  const dashLength = circumference * r;
  const accent = toneColor[tone];

  // Split bar math
  const total = (splitLeft?.value ?? 0) + (splitRight?.value ?? 0);
  const leftPct = total > 0 ? ((splitLeft?.value ?? 0) / total) * 100 : 50;
  const rightPct = total > 0 ? ((splitRight?.value ?? 0) / total) * 100 : 50;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </div>

      <div className="mt-2 flex items-center justify-center">
        <svg
          viewBox="0 0 200 120"
          className="h-32 w-full max-w-[260px]"
          aria-hidden
        >
          {/* Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1e293b"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Filled arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={accent}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dashLength} ${circumference}`}
            style={{
              filter: `drop-shadow(0 0 12px ${accent}66)`,
            }}
          />
          {/* Center value */}
          <text
            x="100"
            y="92"
            textAnchor="middle"
            className="tnum"
            fill="#ffffff"
            fontSize="28"
            fontWeight="600"
          >
            {value}
          </text>
        </svg>
      </div>

      {(splitLeft || splitRight) && (
        <>
          <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-900/60">
            <div
              className="h-full bg-[color:var(--accent-profit)]"
              style={{ width: `${leftPct}%` }}
            />
            <div
              className="h-full bg-[color:var(--accent-loss)]"
              style={{ width: `${rightPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-[color:var(--accent-profit)] tnum">
              {splitLeft?.label}
            </span>
            <span className="text-[color:var(--accent-loss)] tnum">
              {splitRight?.label}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// Unused helper retained for future themed variants
export const _toneColor = toneColor;
