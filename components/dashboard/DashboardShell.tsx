// components/dashboard/DashboardShell.tsx
"use client";

import { useMemo, useState } from "react";
import { Activity, CalendarDays, BarChart3, Sparkles, LineChart, Wallet } from "lucide-react";
import type { AccountSettings, AccountTransaction, Trade } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  computeRange,
  filterTradesByRange,
  type DateRangeKey,
} from "@/lib/dateRange";
import OverviewTab from "./OverviewTab";
import CalendarTab from "./CalendarTab";
import AssetAnalysisTab from "./AssetAnalysisTab";
import AnalyticsTab from "./AnalyticsTab";
import AccountTab from "./AccountTab";
import DateRangeFilter from "./DateRangeFilter";
import ExportButton from "./ExportButton";

type TabKey = "overview" | "analytics" | "account" | "calendar" | "assets";

const TABS: { key: TabKey; label: string; icon: typeof Activity }[] = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "analytics", label: "Analytics", icon: LineChart },
  { key: "account", label: "Account", icon: Wallet },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "assets", label: "Assets & Volume", icon: BarChart3 },
];

// Tabs where the date-range filter applies. Calendar has its own month nav;
// Account reflects real cumulative capital state, so both ignore the filter.
const FILTERABLE: TabKey[] = ["overview", "analytics", "assets"];

export default function DashboardShell({
  trades,
  transactions,
  settings,
}: {
  trades: Trade[];
  transactions: AccountTransaction[];
  settings: AccountSettings;
}) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [rangeKey, setRangeKey] = useState<DateRangeKey>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const range = useMemo(
    () => computeRange(rangeKey, customStart, customEnd),
    [rangeKey, customStart, customEnd]
  );

  const filteredTrades = useMemo(
    () => filterTradesByRange(trades, range),
    [trades, range]
  );

  const showFilter = FILTERABLE.includes(tab);
  // Trades fed to the active tab: filtered for analytics tabs, full otherwise.
  const tabTrades = showFilter ? filteredTrades : trades;

  function handleRangeChange(key: DateRangeKey, start?: string, end?: string) {
    setRangeKey(key);
    if (start !== undefined) setCustomStart(start);
    if (end !== undefined) setCustomEnd(end);
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Institutional Trading Journal</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Portfolio Performance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time MT5 ingestion · {trades.length.toLocaleString()} executions on record
          </p>
        </div>

        <div className="flex items-center gap-3">
          <nav className="flex gap-1 rounded-xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-1">
            {TABS.map((t) => {
              const active = tab === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-slate-800/80 text-white shadow-inner shadow-black/40"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>
          <ExportButton trades={showFilter ? filteredTrades : trades} />
        </div>
      </header>

      {/* Date range filter — only on analytics tabs */}
      {showFilter && (
        <DateRangeFilter
          value={rangeKey}
          customStart={customStart}
          customEnd={customEnd}
          onChange={handleRangeChange}
          tradeCount={filteredTrades.length}
        />
      )}

      <div>
        {tab === "overview" && <OverviewTab trades={tabTrades} transactions={transactions} settings={settings} />}
        {tab === "analytics" && <AnalyticsTab trades={tabTrades} />}
        {tab === "account" && <AccountTab trades={trades} transactions={transactions} settings={settings} />}
        {tab === "calendar" && <CalendarTab trades={trades} />}
        {tab === "assets" && <AssetAnalysisTab trades={tabTrades} />}
      </div>
    </div>
  );
}
