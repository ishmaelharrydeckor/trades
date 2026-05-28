// components/dashboard/OpenPositionsPanel.tsx
// Live feed of currently-open positions. Polls /api/positions every 8s.

"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  Radio,
  Clock,
  Target,
  Shield,
} from "lucide-react";
import type { OpenPosition } from "@/lib/types";
import { cn, fmtUsd } from "@/lib/utils";

const POLL_MS = 8000;

function timeInTrade(openIso: string): string {
  const ms = Date.now() - new Date(openIso).getTime();
  if (ms < 0) return "0m";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

export default function OpenPositionsPanel() {
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let alive = true;

    async function poll() {
      try {
        const res = await fetch("/api/positions", { cache: "no-store" });
        const json = await res.json();
        if (!alive) return;
        setPositions(Array.isArray(json.positions) ? json.positions : []);
        setLastUpdate(new Date());
      } catch {
        // network blip — keep last known state
      } finally {
        if (alive) setLoaded(true);
      }
    }

    poll();
    timer.current = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const totalFloating = positions.reduce((s, p) => s + Number(p.floating_pnl), 0);

  // Empty state: a slim bar so it doesn't take up space when nothing's open.
  if (loaded && positions.length === 0) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm text-[color:var(--text-secondary)]">
          <Radio className="h-3.5 w-3.5" />
          No open positions
        </div>
        {lastUpdate && (
          <span className="text-[10px] text-[color:var(--text-secondary)]">
            live · updated {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] px-4 py-2.5 text-sm text-[color:var(--text-secondary)]">
        <Radio className="h-3.5 w-3.5 animate-pulse" />
        Checking for open positions…
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <h3 className="text-base font-semibold">
            Open Positions ({positions.length})
          </h3>
        </div>
        <div className="text-right">
          <div
            className={cn(
              "text-lg font-bold tabular-nums",
              totalFloating > 0 && "text-[color:var(--accent-profit)]",
              totalFloating < 0 && "text-[color:var(--accent-loss)]"
            )}
          >
            {fmtUsd(totalFloating)}
          </div>
          <div className="text-[10px] text-[color:var(--text-secondary)]">
            floating P&L
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {positions.map((p) => {
          const floating = Number(p.floating_pnl);
          const positive = floating > 0;
          const negative = floating < 0;

          // Distance to SL/TP in price terms
          const slDist =
            p.stop_loss != null
              ? Math.abs(Number(p.current_price) - Number(p.stop_loss))
              : null;
          const tpDist =
            p.take_profit != null
              ? Math.abs(Number(p.take_profit) - Number(p.current_price))
              : null;

          return (
            <div
              key={p.ticket_id}
              className={cn(
                "rounded-xl border p-3",
                positive && "border-emerald-500/20 bg-emerald-500/[0.04]",
                negative && "border-red-500/20 bg-red-500/[0.04]",
                !positive && !negative && "border-[color:var(--border-panel)] bg-black/10"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                      p.direction === "BUY"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-red-500/10 text-red-300"
                    )}
                  >
                    {p.direction === "BUY" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    {p.direction}
                  </span>
                  <span className="text-sm font-semibold">{p.symbol}</span>
                  <span className="text-xs text-[color:var(--text-secondary)]">
                    {Number(p.lots).toFixed(2)} lots
                  </span>
                </div>
                <div
                  className={cn(
                    "text-base font-bold tabular-nums",
                    positive && "text-[color:var(--accent-profit)]",
                    negative && "text-[color:var(--accent-loss)]"
                  )}
                >
                  {fmtUsd(floating)}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[color:var(--text-secondary)]">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeInTrade(p.open_time)}
                </span>
                <span>
                  Entry {Number(p.open_price).toFixed(5)} → Now{" "}
                  {Number(p.current_price).toFixed(5)}
                </span>
                {p.stop_loss != null && (
                  <span className="inline-flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    SL {Number(p.stop_loss).toFixed(5)}
                    {slDist != null && (
                      <span className="opacity-60">
                        ({slDist.toFixed(5)} away)
                      </span>
                    )}
                  </span>
                )}
                {p.take_profit != null && (
                  <span className="inline-flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    TP {Number(p.take_profit).toFixed(5)}
                    {tpDist != null && (
                      <span className="opacity-60">
                        ({tpDist.toFixed(5)} away)
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {lastUpdate && (
        <div className="mt-3 text-right text-[10px] text-[color:var(--text-secondary)]">
          live · updated {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
