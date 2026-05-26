// components/dashboard/TradeEditModal.tsx
// Opens when a trade row is clicked. Shows read-only trade summary +
// editable enrichment fields (tags, mindset, screenshot URL, notes).

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Save,
  Link as LinkIcon,
  ImageIcon,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { MINDSETS, SUGGESTED_TAGS, type Mindset, type Trade } from "@/lib/types";
import { cn, fmtUsd, fmtDuration } from "@/lib/utils";
import { MindsetBadge, TagChip, MINDSET_LABELS } from "./TagChip";

/**
 * TradingView share URLs look like https://www.tradingview.com/x/ABcd1234/
 * The matching image lives at https://s3.tradingview.com/snapshots/{first_char_lower}/{id}.png
 */
function normalizeChartUrl(raw: string): string {
  if (!raw) return raw;
  const m = raw.match(/tradingview\.com\/x\/([A-Za-z0-9]+)/);
  if (m) {
    const id = m[1];
    const prefix = id[0].toLowerCase();
    return `https://s3.tradingview.com/snapshots/${prefix}/${id}.png`;
  }
  return raw;
}

interface Props {
  trade: Trade;
  onClose: () => void;
  /** Existing tags across all trades — used as suggestions */
  knownTags: string[];
}

export default function TradeEditModal({ trade, onClose, knownTags }: Props) {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>(trade.tags ?? []);
  const [mindset, setMindset] = useState<Mindset | "">(
    (trade.mindset as Mindset) ?? ""
  );
  const [screenshotUrl, setScreenshotUrl] = useState<string>(
    trade.screenshot_url ?? ""
  );
  const [notes, setNotes] = useState<string>(trade.notes ?? "");
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImg, setShowImg] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Reset image visibility whenever the URL changes
  useEffect(() => {
    setShowImg(true);
  }, [screenshotUrl]);

  const suggestions = useMemo(() => {
    const lc = tagInput.trim().toLowerCase();
    const universe = Array.from(
      new Set([...knownTags, ...SUGGESTED_TAGS].map((t) => t.trim()))
    );
    const taken = new Set(tags.map((t) => t.toLowerCase()));
    return universe
      .filter(
        (t) =>
          !taken.has(t.toLowerCase()) &&
          (lc === "" || t.toLowerCase().includes(lc))
      )
      .slice(0, 8);
  }, [tagInput, knownTags, tags]);

  function addTag(raw: string) {
    const t = raw.trim().slice(0, 40);
    if (!t) return;
    if (tags.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    if (tags.length >= 12) return;
    setTags([...tags, t]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  function handleTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const resp = await fetch(
        `/api/trades/${encodeURIComponent(trade.ticket_id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tags: tags.length ? tags : null,
            notes: notes.trim() ? notes : null,
            mindset: mindset || null,
            screenshot_url: screenshotUrl.trim() ? screenshotUrl.trim() : null,
          }),
        }
      );
      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(json?.detail || json?.error || `HTTP ${resp.status}`);
      }
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const isWin = trade.outcome === "WIN";
  const isLoss = trade.outcome === "LOSS";

  // Derive trade duration if open_time is available
  let durationSec = 0;
  if (trade.open_time) {
    const open = new Date(trade.open_time).getTime();
    const close = new Date(trade.close_time).getTime();
    if (Number.isFinite(open) && Number.isFinite(close) && close > open) {
      durationSec = Math.floor((close - open) / 1000);
    }
  }

  const previewUrl = normalizeChartUrl(screenshotUrl.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="my-8 w-full max-w-3xl rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[color:var(--border-panel)] px-6 py-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{trade.ticker}</h2>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                  trade.direction === "BUY"
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-red-500/10 text-red-300"
                )}
              >
                {trade.direction === "BUY" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trade.direction}
              </span>
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-[color:var(--text-secondary)]">
                {trade.asset_class}
              </span>
            </div>
            <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
              Ticket {trade.ticket_id} ·{" "}
              {new Date(trade.close_time).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-[color:var(--text-secondary)] transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Trade summary */}
        <div className="grid grid-cols-2 gap-4 border-b border-[color:var(--border-panel)] px-6 py-4 md:grid-cols-4">
          <SummaryCell label="Net P&L">
            <span
              className={cn(
                "text-base font-semibold",
                isWin && "text-[color:var(--accent-profit)]",
                isLoss && "text-[color:var(--accent-loss)]"
              )}
            >
              {fmtUsd(trade.net_pnl)}
            </span>
          </SummaryCell>
          <SummaryCell label="Volume">{trade.lots.toFixed(2)} lots</SummaryCell>
          {trade.entry_price != null ? (
            <SummaryCell label="Entry">{trade.entry_price}</SummaryCell>
          ) : (
            <SummaryCell label="Entry">—</SummaryCell>
          )}
          <SummaryCell label="Duration">
            {durationSec > 0 ? fmtDuration(durationSec) : "—"}
          </SummaryCell>
          {trade.stop_loss != null && (
            <SummaryCell label="Stop Loss">{trade.stop_loss}</SummaryCell>
          )}
          {trade.take_profit != null && (
            <SummaryCell label="Take Profit">{trade.take_profit}</SummaryCell>
          )}
          {trade.r_multiple != null && (
            <SummaryCell label="R-Multiple">
              {trade.r_multiple.toFixed(2)}R
            </SummaryCell>
          )}
          {trade.commission != null && (
            <SummaryCell label="Commission">
              {fmtUsd(trade.commission)}
            </SummaryCell>
          )}
        </div>

        {/* Editable fields */}
        <div className="space-y-5 px-6 py-5">
          {/* Setup Tags */}
          <Field
            label="Setup Tags"
            hint="Tag the strategy or pattern. Press Enter or comma to add."
          >
            <div className="rounded-lg border border-[color:var(--border-panel)] bg-black/20 p-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((t) => (
                  <TagChip key={t} tag={t} onRemove={() => removeTag(t)} />
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKey}
                  placeholder={tags.length === 0 ? "Add tag…" : ""}
                  className="flex-1 min-w-[120px] bg-transparent px-1 text-sm outline-none placeholder:text-[color:var(--text-secondary)]"
                />
              </div>
              {suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 border-t border-[color:var(--border-panel)] pt-2">
                  <span className="text-[10px] uppercase tracking-wider text-[color:var(--text-secondary)]">
                    Suggested:
                  </span>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addTag(s)}
                      className="text-xs text-[color:var(--text-secondary)] underline-offset-2 transition hover:text-white hover:underline"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          {/* Mindset */}
          <Field
            label="Mindset"
            hint="How were you trading? Logging this reveals patterns over time."
          >
            <div className="flex flex-wrap gap-2">
              <MindsetPill
                active={mindset === ""}
                onClick={() => setMindset("")}
                label="—"
              />
              {MINDSETS.map((m) => (
                <MindsetPill
                  key={m}
                  active={mindset === m}
                  onClick={() => setMindset(m)}
                  label={MINDSET_LABELS[m]}
                  mindset={m}
                />
              ))}
            </div>
          </Field>

          {/* Screenshot URL */}
          <Field
            label="Chart Screenshot"
            hint="Paste a TradingView share URL (tradingview.com/x/…) or any direct image URL."
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-[color:var(--border-panel)] bg-black/20 px-3 py-2">
                <LinkIcon className="h-4 w-4 shrink-0 text-[color:var(--text-secondary)]" />
                <input
                  type="url"
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  placeholder="https://www.tradingview.com/x/…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--text-secondary)]"
                />
              </div>
              {previewUrl && showImg && (
                <div className="overflow-hidden rounded-lg border border-[color:var(--border-panel)] bg-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Chart screenshot"
                    onError={() => setShowImg(false)}
                    className="block w-full"
                  />
                </div>
              )}
              {previewUrl && !showImg && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-blue-300 underline-offset-2 hover:underline"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Open chart in new tab
                </a>
              )}
            </div>
          </Field>

          {/* Notes */}
          <Field
            label="Notes"
            hint="What did you see? What worked, what didn't?"
          >
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="e.g. clean break of 1.0850 resistance, partial at 1R, trailed remainder…"
              className="w-full resize-y rounded-lg border border-[color:var(--border-panel)] bg-black/20 px-3 py-2 text-sm outline-none placeholder:text-[color:var(--text-secondary)] focus:border-[color:var(--accent-equity)]"
              maxLength={5000}
            />
            <p className="mt-1 text-right text-[10px] text-[color:var(--text-secondary)]">
              {notes.length}/5000
            </p>
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[color:var(--border-panel)] px-6 py-4">
          {error ? (
            <p className="text-xs text-[color:var(--accent-loss)]">{error}</p>
          ) : (
            <p className="text-xs text-[color:var(--text-secondary)]">
              Changes persist immediately.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-[color:var(--border-panel)] px-4 py-2 text-sm font-medium text-[color:var(--text-secondary)] transition hover:bg-white/5 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--accent-equity)] px-4 py-2 text-sm font-medium text-white shadow transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--text-secondary)]">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium">{children}</div>
    </div>
  );
}

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
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium">{label}</label>
        {hint && (
          <span className="text-[10px] text-[color:var(--text-secondary)]">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function MindsetPill({
  active,
  onClick,
  label,
  mindset,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  mindset?: Mindset;
}) {
  if (mindset && active) {
    return (
      <button type="button" onClick={onClick} className="cursor-pointer">
        <MindsetBadge mindset={mindset} />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-2 py-0.5 text-xs font-medium transition",
        active
          ? "border-white/40 bg-white/10 text-white"
          : "border-[color:var(--border-panel)] bg-transparent text-[color:var(--text-secondary)] hover:border-white/30 hover:text-white"
      )}
    >
      {label}
    </button>
  );
}
