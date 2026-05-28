"use client";

// components/dashboard/RecentTradesTable.tsx
// Rows are clickable — opens the enrichment modal.
// Tags and mindset are click-to-filter: click a chip/emoji to filter the table.

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, FileText, Image as ImageIcon, X } from "lucide-react";
import type { Trade, Mindset } from "@/lib/types";
import { cn, fmtDateTime, fmtNumber, fmtSignedUsd } from "@/lib/utils";
import TradeEditModal from "./TradeEditModal";

const MINDSET_EMOJI: Record<Mindset, string> = {
  DISCIPLINED: "✅",
  CONFIDENT: "💪",
  PATIENT: "🧘",
  FOMO: "😰",
  REVENGE: "😤",
  HESITANT: "😕",
};

const MINDSET_LABEL: Record<Mindset, string> = {
  DISCIPLINED: "Disciplined",
  CONFIDENT: "Confident",
  PATIENT: "Patient",
  FOMO: "FOMO",
  REVENGE: "Revenge",
  HESITANT: "Hesitant",
};

export default function RecentTradesTable({ trades }: { trades: Trade[] }) {
  const [editing, setEditing] = useState<Trade | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterMindset, setFilterMindset] = useState<Mindset | null>(null);

  const knownTags = useMemo(() => {
    const set = new Set<string>();
    for (const t of trades) {
      if (!t.tags) continue;
      for (const tag of t.tags) if (tag) set.add(tag);
    }
    return Array.from(set).sort();
  }, [trades]);

  const visible = useMemo(() => {
    return trades.filter((t) => {
      if (filterTag && !(t.tags ?? []).includes(filterTag)) return false;
      if (filterMindset && t.mindset !== filterMindset) return false;
      return true;
    });
  }, [trades, filterTag, filterMindset]);

  const hasFilter = filterTag !== null || filterMindset !== null;

  function clearFilters() {
    setFilterTag(null);
    setFilterMindset(null);
  }

  return (
    <>
      <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">
              Recent Executions
            </h3>
            <p className="text-xs text-slate-500">
              {hasFilter
                ? `${visible.length} of ${trades.length} shown · click a row to enrich`
                : `Last ${trades.length} closed positions · click any row to add tags, mindset, and notes`}
            </p>
          </div>

          {hasFilter && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-500">
                Filtering:
              </span>
              {filterTag && (
                <button
                  type="button"
                  onClick={() => setFilterTag(null)}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-300 hover:bg-blue-500/25"
                >
                  {filterTag}
                  <X className="h-3 w-3" />
                </button>
              )}
              {filterMindset && (
                <button
                  type="button"
                  onClick={() => setFilterMindset(null)}
                  className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-white hover:bg-white/20"
                >
                  {MINDSET_EMOJI[filterMindset]} {MINDSET_LABEL[filterMindset]}
                  <X className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-slate-400 underline-offset-2 hover:text-white hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-500">
                <th className="px-3 py-3 text-left font-medium">Closed</th>
                <th className="px-3 py-3 text-left font-medium">Ticker</th>
                <th className="px-3 py-3 text-left font-medium">Direction</th>
                <th className="px-3 py-3 text-left font-medium">Context</th>
                <th className="px-3 py-3 text-right font-medium">Lots</th>
                <th className="px-3 py-3 text-right font-medium">P&L</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-6 text-center text-sm text-slate-500"
                    colSpan={6}
                  >
                    {hasFilter
                      ? "No trades match this filter."
                      : "No executions yet — webhook standing by."}
                  </td>
                </tr>
              )}
              {visible.map((t) => {
                const positive = t.net_pnl > 0;
                const negative = t.net_pnl < 0;
                const hasTags = t.tags && t.tags.length > 0;
                const hasNotes = t.notes && t.notes.trim().length > 0;
                const hasShot = t.screenshot_url && t.screenshot_url.length > 0;
                return (
                  <tr
                    key={t.ticket_id}
                    onClick={() => setEditing(t)}
                    className={cn(
                      "cursor-pointer border-t border-[color:var(--border-panel)] transition-colors",
                      positive &&
                        "bg-emerald-500/[0.03] hover:bg-emerald-500/[0.08]",
                      negative && "bg-red-500/[0.03] hover:bg-red-500/[0.08]",
                      !positive && !negative && "hover:bg-white/[0.03]"
                    )}
                  >
                    <td className="px-3 py-3 text-slate-400 tnum">
                      {fmtDateTime(t.close_time)}
                    </td>
                    <td className="px-3 py-3 font-medium text-white">
                      {t.ticker}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                          t.direction === "BUY"
                            ? "bg-emerald-500/10 text-[color:var(--accent-profit)]"
                            : "bg-red-500/10 text-[color:var(--accent-loss)]"
                        )}
                      >
                        {t.direction === "BUY" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {t.mindset && (
                          <button
                            type="button"
                            title={`Filter by ${t.mindset}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilterMindset(t.mindset as Mindset);
                            }}
                            className="text-base leading-none transition hover:scale-125"
                          >
                            {MINDSET_EMOJI[t.mindset as Mindset] ?? "•"}
                          </button>
                        )}
                        {hasTags &&
                          (t.tags as string[]).slice(0, 3).map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              title={`Filter by ${tag}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilterTag(tag);
                              }}
                              className="rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-300 transition hover:bg-blue-500/30"
                            >
                              {tag}
                            </button>
                          ))}
                        {hasTags && (t.tags as string[]).length > 3 && (
                          <span className="text-[10px] text-slate-500">
                            +{(t.tags as string[]).length - 3}
                          </span>
                        )}
                        {hasNotes && (
                          <FileText
                            className="h-3.5 w-3.5 text-slate-500"
                            aria-label="Has notes"
                          />
                        )}
                        {hasShot && (
                          <ImageIcon
                            className="h-3.5 w-3.5 text-slate-500"
                            aria-label="Has screenshot"
                          />
                        )}
                        {!hasTags && !hasNotes && !hasShot && !t.mindset && (
                          <span className="text-[10px] text-slate-600">
                            — click to enrich
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-300 tnum">
                      {fmtNumber(t.lots)}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-3 text-right font-semibold tnum",
                        positive && "text-[color:var(--accent-profit)]",
                        negative && "text-[color:var(--accent-loss)]",
                        !positive && !negative && "text-slate-300"
                      )}
                    >
                      {fmtSignedUsd(t.net_pnl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <TradeEditModal
          trade={editing}
          onClose={() => setEditing(null)}
          knownTags={knownTags}
        />
      )}
    </>
  );
}
