// components/dashboard/AnalyticsTab.tsx
"use client";

import { useMemo } from "react";
import type { Trade } from "@/lib/types";
import {
  computeKpis,
  computeExpectancy,
  computeDailyStats,
  aggregateBySession,
  aggregateByWeekday,
  aggregateByHour,
  aggregateByDirection,
  aggregateByDuration,
  aggregateByRMultiple,
} from "@/lib/stats";
import HeroGauges from "./HeroGauges";
import SessionPanel from "./SessionPanel";
import WeekdayTable from "./WeekdayTable";
import HourlyChart from "./HourlyChart";
import LongShortPanel from "./LongShortPanel";
import DurationDistribution from "./DurationDistribution";
import RMultipleDistribution from "./RMultipleDistribution";
import DailyStatsGrid from "./DailyStatsGrid";

export default function AnalyticsTab({ trades }: { trades: Trade[] }) {
  const kpi = useMemo(() => computeKpis(trades), [trades]);
  const expectancy = useMemo(() => computeExpectancy(kpi), [kpi]);
  const dailyStats = useMemo(() => computeDailyStats(trades), [trades]);
  const sessions = useMemo(() => aggregateBySession(trades), [trades]);
  const weekdays = useMemo(() => aggregateByWeekday(trades), [trades]);
  const hours = useMemo(() => aggregateByHour(trades), [trades]);
  const directions = useMemo(() => aggregateByDirection(trades), [trades]);
  const durations = useMemo(() => aggregateByDuration(trades), [trades]);
  const rMultiples = useMemo(() => aggregateByRMultiple(trades), [trades]);

  return (
    <div className="flex flex-col gap-6">
      <HeroGauges kpi={kpi} expectancy={expectancy} />
      <DailyStatsGrid stats={dailyStats} />
      <SessionPanel rows={sessions} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WeekdayTable rows={weekdays} />
        <HourlyChart data={hours} />
      </div>
      <DurationDistribution data={durations} />
      <RMultipleDistribution data={rMultiples} />
      <LongShortPanel rows={directions} />
    </div>
  );
}
