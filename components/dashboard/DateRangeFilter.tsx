// components/dashboard/DateRangeFilter.tsx

"use client";

import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  RANGE_PRESETS,
  type DateRangeKey,
} from "@/lib/dateRange";
import { cn } from "@/lib/utils";

export default function DateRangeFilter({
  value,
  customStart,
  customEnd,
  onChange,
  tradeCount,
}: {
  value: DateRangeKey;
  customStart: string;
  customEnd: string;
  onChange: (key: DateRangeKey, start?: string, end?: string) => void;
  tradeCount: number;
}) {
  const [showCustom, setShowCustom] = useState(value === "custom");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-1">
        {RANGE_PRESETS.map((p) => {
          const active = value === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                if (p.key === "custom") {
                  setShowCustom(true);
                  onChange("custom", customStart, customEnd);
                } else {
                  setShowCustom(false);
                  onChange(p.key);
                }
              }}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                active
                  ? "bg-[color:var(--accent-equity)] text-white"
                  : "text-[color:var(--text-secondary)] hover:bg-white/5 hover:text-white"
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {showCustom && (
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] px-2 py-1">
          <CalendarIcon className="h-3.5 w-3.5 text-[color:var(--text-secondary)]" />
          <input
            type="date"
            value={customStart}
            onChange={(e) => onChange("custom", e.target.value, customEnd)}
            className="bg-transparent text-xs outline-none"
          />
          <span className="text-xs text-[color:var(--text-secondary)]">→</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onChange("custom", customStart, e.target.value)}
            className="bg-transparent text-xs outline-none"
          />
        </div>
      )}

      <span className="text-xs text-[color:var(--text-secondary)]">
        {tradeCount} {tradeCount === 1 ? "trade" : "trades"} in range
      </span>
    </div>
  );
}
