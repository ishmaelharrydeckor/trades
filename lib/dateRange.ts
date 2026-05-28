// lib/dateRange.ts
// Date-window presets for filtering trades across the analytics tabs.

import type { Trade } from "./types";

export type DateRangeKey =
  | "today"
  | "7d"
  | "30d"
  | "mtd"
  | "ytd"
  | "all"
  | "custom";

export interface DateRange {
  key: DateRangeKey;
  start: Date | null; // null = unbounded below
  end: Date | null;   // null = unbounded above
  label: string;
}

export const RANGE_PRESETS: { key: DateRangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "mtd", label: "MTD" },
  { key: "ytd", label: "YTD" },
  { key: "all", label: "All" },
  { key: "custom", label: "Custom" },
];

export function computeRange(
  key: DateRangeKey,
  customStart?: string,
  customEnd?: string
): DateRange {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  switch (key) {
    case "today":
      return { key, start: startOfToday, end: null, label: "Today" };
    case "7d": {
      const s = new Date(startOfToday);
      s.setDate(s.getDate() - 6); // inclusive of today = 7 days
      return { key, start: s, end: null, label: "Last 7 days" };
    }
    case "30d": {
      const s = new Date(startOfToday);
      s.setDate(s.getDate() - 29);
      return { key, start: s, end: null, label: "Last 30 days" };
    }
    case "mtd":
      return {
        key,
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: null,
        label: "Month to date",
      };
    case "ytd":
      return {
        key,
        start: new Date(now.getFullYear(), 0, 1),
        end: null,
        label: "Year to date",
      };
    case "custom":
      return {
        key,
        start: customStart ? new Date(customStart + "T00:00:00") : null,
        end: customEnd ? new Date(customEnd + "T23:59:59") : null,
        label: "Custom",
      };
    case "all":
    default:
      return { key: "all", start: null, end: null, label: "All time" };
  }
}

export function filterTradesByRange(trades: Trade[], range: DateRange): Trade[] {
  if (!range.start && !range.end) return trades;
  const lo = range.start?.getTime() ?? -Infinity;
  const hi = range.end?.getTime() ?? Infinity;
  return trades.filter((t) => {
    const ts = new Date(t.close_time).getTime();
    return ts >= lo && ts <= hi;
  });
}
