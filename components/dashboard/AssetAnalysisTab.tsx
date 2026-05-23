// components/dashboard/AssetAnalysisTab.tsx
"use client";

import { useMemo } from "react";
import type { Trade } from "@/lib/types";
import {
  aggregateByAssetClass,
  aggregateBySymbol,
  recentTrades,
} from "@/lib/stats";
import AssetMatrix from "./AssetMatrix";
import TopSymbolsChart from "./TopSymbolsChart";
import RecentTradesTable from "./RecentTradesTable";

export default function AssetAnalysisTab({ trades }: { trades: Trade[] }) {
  const assetRows = useMemo(() => aggregateByAssetClass(trades), [trades]);
  const symbolRows = useMemo(() => aggregateBySymbol(trades, 8), [trades]);
  const recent = useMemo(() => recentTrades(trades, 20), [trades]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AssetMatrix rows={assetRows} />
        <TopSymbolsChart data={symbolRows} />
      </div>
      <RecentTradesTable trades={recent} />
    </div>
  );
}
