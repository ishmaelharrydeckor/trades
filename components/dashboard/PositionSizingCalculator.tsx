// components/dashboard/PositionSizingCalculator.tsx
// Given the symbol, entry price, and stop loss, computes the lot size that
// risks exactly one part of equity (per the user's strategy).
//
// Math:
//   risk_budget        = current_equity / strategy_parts
//   price_distance     = |entry - stop_loss|
//   loss_per_lot       = price_distance × value_per_lot_per_unit_move
//   suggested_lots     = risk_budget / loss_per_lot
//
// value_per_lot_per_unit_move = "$ loss per 1.0 price move per 1.0 lot"
//   XAUUSDM (gold mini, ~10oz/lot): 10
//   BTCUSDM (1 BTC/lot, typical):    1
//   ETHUSDM (1 ETH/lot, typical):    1
// User can override; values are also learned from history when risk_amount
// data is available.

"use client";

import { useMemo, useState } from "react";
import { Calculator, ArrowRight, AlertTriangle } from "lucide-react";
import type { Trade } from "@/lib/types";
import { cn, fmtUsd } from "@/lib/utils";

// Known contract values for common symbols traded on this account.
// Value = $ at risk per 1.0 price move per 1.0 lot.
const KNOWN_CONTRACT_VALUES: Record<string, number> = {
  XAUUSDM: 10,
  XAUUSD: 100,
  BTCUSDM: 1,
  BTCUSD: 1,
  ETHUSDM: 1,
  ETHUSD: 1,
  EURUSD: 100000,
  GBPUSD: 100000,
};

function defaultContractValue(symbol: string): number {
  const upper = symbol.toUpperCase().trim();
  return KNOWN_CONTRACT_VALUES[upper] ?? 10;
}

function roundLots(lots: number, step = 0.01): number {
  return Math.max(0, Math.floor(lots / step) * step);
}

export default function PositionSizingCalculator({
  currentEquity,
  strategyParts,
  trades,
}: {
  currentEquity: number;
  strategyParts: number;
  trades: Trade[];
}) {
  // Symbols the user has traded recently, for the dropdown.
  const knownSymbols = useMemo(() => {
    const set = new Set<string>();
    for (const t of trades) if (t.ticker) set.add(t.ticker.toUpperCase());
    return Array.from(set).sort();
  }, [trades]);

  const defaultSymbol = knownSymbols[0] ?? "XAUUSDM";
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [contractValue, setContractValue] = useState(
    String(defaultContractValue(defaultSymbol))
  );
  const [riskOverride, setRiskOverride] = useState("");

  const recommendedRisk =
    strategyParts > 0 ? currentEquity / strategyParts : 0;
  const riskBudget =
    riskOverride.trim() !== "" && Number.isFinite(Number(riskOverride))
      ? Number(riskOverride)
      : recommendedRisk;

  const entryN = Number(entry);
  const stopN = Number(stop);
  const cv = Number(contractValue);
  const priceDistance = Math.abs(entryN - stopN);
  const lossPerLot = priceDistance * cv;
  const direction =
    Number.isFinite(entryN) && Number.isFinite(stopN) && entry !== "" && stop !== ""
      ? entryN > stopN
        ? "LONG"
        : entryN < stopN
          ? "SHORT"
          : null
      : null;

  const valid =
    Number.isFinite(entryN) &&
    Number.isFinite(stopN) &&
    entry !== "" &&
    stop !== "" &&
    direction !== null &&
    Number.isFinite(cv) &&
    cv > 0 &&
    lossPerLot > 0 &&
    Number.isFinite(riskBudget) &&
    riskBudget > 0;

  const rawLots = valid ? riskBudget / lossPerLot : 0;
  const lots = valid ? roundLots(rawLots, 0.01) : 0;
  const actualRisk = lots * lossPerLot;
  const equityPct =
    currentEquity > 0 ? (actualRisk / currentEquity) * 100 : 0;

  function handleSymbolChange(next: string) {
    setSymbol(next);
    setContractValue(String(defaultContractValue(next)));
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4 flex items-start gap-2">
        <Calculator className="mt-0.5 h-4 w-4 text-blue-400" />
        <div>
          <h3 className="text-base font-semibold">Position Sizing Calculator</h3>
          <p className="text-xs text-[color:var(--text-secondary)]">
            Enter your entry, stop loss, and asset — get the lot size that fits
            your {strategyParts}-part allowance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-3">
          <Field label="Symbol">
            <div className="flex gap-2">
              <input
                list="known-symbols-list"
                value={symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className={inputClass}
                placeholder="e.g. XAUUSDM"
              />
              <datalist id="known-symbols-list">
                {knownSymbols.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Entry price">
              <input
                type="number"
                step="any"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                className={inputClass}
                placeholder="0.00"
              />
            </Field>
            <Field label="Stop loss">
              <input
                type="number"
                step="any"
                value={stop}
                onChange={(e) => setStop(e.target.value)}
                className={inputClass}
                placeholder="0.00"
              />
            </Field>
          </div>

          <Field
            label="$ per 1.0 price move per 1.0 lot"
            hint="Auto-set from common contract sizes. Override if your broker differs."
          >
            <input
              type="number"
              step="any"
              value={contractValue}
              onChange={(e) => setContractValue(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field
            label="Risk budget"
            hint={`Default = equity ÷ ${strategyParts} = ${fmtUsd(recommendedRisk)}. Leave blank to use default.`}
          >
            <input
              type="number"
              step="any"
              value={riskOverride}
              onChange={(e) => setRiskOverride(e.target.value)}
              className={inputClass}
              placeholder={fmtUsd(recommendedRisk)}
            />
          </Field>
        </div>

        {/* Output */}
        <div className="flex flex-col">
          <div
            className={cn(
              "flex h-full flex-col justify-center rounded-xl border p-4",
              valid
                ? "border-blue-500/30 bg-blue-500/[0.04]"
                : "border-dashed border-[color:var(--border-panel)] bg-black/10"
            )}
          >
            {valid ? (
              <>
                <div className="text-[10px] uppercase tracking-wider text-blue-300/70">
                  Recommended position
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums text-white">
                    {lots.toFixed(2)}
                  </span>
                  <span className="text-sm text-[color:var(--text-secondary)]">
                    lots {direction}
                  </span>
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  <Row
                    label="Price distance"
                    value={`${priceDistance.toFixed(5)}`}
                  />
                  <Row label="Loss per 1.0 lot" value={fmtUsd(lossPerLot)} />
                  <Row label="Risk budget" value={fmtUsd(riskBudget)} />
                  <div className="border-t border-[color:var(--border-panel)] pt-1.5">
                    <Row
                      label={`Actual risk at ${lots.toFixed(2)} lots`}
                      value={fmtUsd(actualRisk)}
                      bold
                    />
                    <Row
                      label="% of equity"
                      value={`${equityPct.toFixed(2)}%`}
                    />
                  </div>
                </div>
                {actualRisk > recommendedRisk * 1.05 && riskOverride === "" && (
                  <div className="mt-3 flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-300">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    Rounded position exceeds allowance. Consider 0.{(Math.floor(rawLots * 100)).toString().padStart(2, "0").slice(-2)} lots and accept the lower risk.
                  </div>
                )}
                {lots === 0 && rawLots > 0 && (
                  <div className="mt-3 flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-300">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    Sized below 0.01 lots. Either widen risk budget, tighten SL, or skip the trade.
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-sm text-[color:var(--text-secondary)]">
                <ArrowRight className="mx-auto mb-2 h-5 w-5" />
                Enter entry + stop loss to compute lot size.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-[color:var(--border-panel)] bg-black/20 px-2.5 py-1.5 text-sm tabular-nums outline-none focus:border-blue-500/50";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-[color:var(--text-secondary)]">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {hint && (
        <p className="mt-0.5 text-[10px] text-[color:var(--text-secondary)]">
          {hint}
        </p>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-[color:var(--text-secondary)]">{label}</span>
      <span
        className={cn(
          "tabular-nums",
          bold ? "font-semibold text-white" : "text-slate-300"
        )}
      >
        {value}
      </span>
    </div>
  );
}
