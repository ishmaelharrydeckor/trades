// components/dashboard/CalendarTab.tsx
"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Trade } from "@/lib/types";
import { aggregateByDay } from "@/lib/stats";
import { cn, fmtSignedUsd } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthLabel(d: Date) {
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function dateKey(y: number, m: number, day: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarTab({ trades }: { trades: Trade[] }) {
  const daily = useMemo(() => aggregateByDay(trades), [trades]);

  // Anchor on the most recent trade if it exists, else today.
  const initial = useMemo(() => {
    if (trades.length === 0) return new Date();
    const latest = trades.reduce((acc, t) =>
      new Date(t.close_time) > new Date(acc.close_time) ? t : acc
    );
    return new Date(latest.close_time);
  }, [trades]);

  const [cursor, setCursor] = useState(
    new Date(initial.getFullYear(), initial.getMonth(), 1)
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  // Monday-first grid offset.
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const leadingBlanks = (firstDow + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monthly aggregate
  const monthSummary = useMemo(() => {
    let net = 0;
    let trading = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const agg = daily.get(dateKey(year, month, d));
      if (agg) {
        net += agg.net;
        trading += 1;
      }
    }
    return { net, trading };
  }, [daily, year, month, daysInMonth]);

  const goPrev = () => setCursor(new Date(year, month - 1, 1));
  const goNext = () => setCursor(new Date(year, month + 1, 1));

  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {monthLabel(cursor)}
          </h2>
          <p className="text-xs text-slate-500">
            {monthSummary.trading} trading days ·{" "}
            <span
              className={cn(
                "font-medium tnum",
                monthSummary.net > 0
                  ? "text-[color:var(--accent-profit)]"
                  : monthSummary.net < 0
                  ? "text-[color:var(--accent-loss)]"
                  : "text-slate-400"
              )}
            >
              {fmtSignedUsd(monthSummary.net)} net
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="rounded-lg border border-[color:var(--border-panel)] bg-slate-900/40 p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCursor(new Date(year, month, 1))}
            className="rounded-lg border border-[color:var(--border-panel)] bg-slate-900/40 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Today
          </button>
          <button
            onClick={goNext}
            className="rounded-lg border border-[color:var(--border-panel)] bg-slate-900/40 p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div
            key={`blank-${i}`}
            className="aspect-[4/3] rounded-xl border border-dashed border-[color:var(--border-panel)]/40"
          />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const agg = daily.get(dateKey(year, month, day));
          const positive = (agg?.net ?? 0) > 0;
          const negative = (agg?.net ?? 0) < 0;

          return (
            <div
              key={day}
              className={cn(
                "relative flex aspect-[4/3] flex-col justify-between rounded-xl border p-2.5 transition-all md:p-3",
                "border-[color:var(--border-panel)]",
                positive &&
                  "bg-[color:var(--accent-profit-glow)]/70 border-emerald-700/40 shadow-[inset_0_0_30px_rgba(34,197,94,0.15)]",
                negative &&
                  "bg-[color:var(--accent-loss-glow)]/70 border-red-700/40 shadow-[inset_0_0_30px_rgba(239,68,68,0.15)]",
                !agg && "bg-slate-900/30"
              )}
            >
              <div
                className={cn(
                  "text-xs font-semibold",
                  positive && "text-[color:var(--accent-profit)]",
                  negative && "text-[color:var(--accent-loss)]",
                  !agg && "text-slate-500"
                )}
              >
                {day}
              </div>
              {agg && (
                <div className="space-y-0.5">
                  <div
                    className={cn(
                      "text-xs font-semibold tnum md:text-sm",
                      positive && "text-[color:var(--accent-profit)]",
                      negative && "text-[color:var(--accent-loss)]"
                    )}
                  >
                    {fmtSignedUsd(agg.net)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {agg.trades} trade{agg.trades !== 1 ? "s" : ""}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-[color:var(--accent-profit-glow)] ring-1 ring-emerald-700/40" />
          Net Profit
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-[color:var(--accent-loss-glow)] ring-1 ring-red-700/40" />
          Net Loss
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-slate-900/40 ring-1 ring-[color:var(--border-panel)]" />
          No Activity
        </div>
      </div>
    </div>
  );
}
