// components/dashboard/DashboardShell.tsx
"use client";

import { useState } from "react";
import { Activity, CalendarDays, BarChart3, Sparkles, LineChart, Wallet } from "lucide-react";
import type { AccountTransaction, Trade } from "@/lib/types";
import { cn } from "@/lib/utils";
import OverviewTab from "./OverviewTab";
import CalendarTab from "./CalendarTab";
import AssetAnalysisTab from "./AssetAnalysisTab";
import AnalyticsTab from "./AnalyticsTab";
import AccountTab from "./AccountTab";
import ExportButton from "./ExportButton";

type TabKey = "overview" | "analytics" | "account" | "calendar" | "assets";

const TABS: { key: TabKey; label: string; icon: typeof Activity }[] = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "analytics", label: "Analytics", icon: LineChart },
  { key: "account", label: "Account", icon: Wallet },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "assets", label: "Assets & Volume", icon: BarChart3 },
];

export default function DashboardShell({
  trades,
  transactions,
}: {
  trades: Trade[];
  transactions: AccountTransaction[];
}) {
  const [tab, setTab] = useState<TabKey>("overview");

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
          <ExportButton trades={trades} />
        </div>
      </header>

      <div>
        {tab === "overview" && <OverviewTab trades={trades} transactions={transactions} />}
        {tab === "analytics" && <AnalyticsTab trades={trades} />}
        {tab === "account" && <AccountTab trades={trades} transactions={transactions} />}
        {tab === "calendar" && <CalendarTab trades={trades} />}
        {tab === "assets" && <AssetAnalysisTab trades={trades} />}
      </div>
    </div>
  );
}
