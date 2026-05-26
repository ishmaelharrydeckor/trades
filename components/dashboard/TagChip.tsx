// components/dashboard/TagChip.tsx
// Visual tag/mindset chips used in tables and the edit modal.

"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mindset } from "@/lib/types";

/**
 * Stable hash → hue mapping, so the same tag always gets the same color.
 */
function hueForTag(tag: string): number {
  let h = 0;
  for (let i = 0; i < tag.length; i++) {
    h = (h * 31 + tag.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 360;
}

export function TagChip({
  tag,
  onRemove,
  size = "md",
}: {
  tag: string;
  onRemove?: () => void;
  size?: "sm" | "md";
}) {
  const hue = hueForTag(tag.toLowerCase());
  const style = {
    background: `hsl(${hue} 70% 50% / 0.12)`,
    color: `hsl(${hue} 80% 75%)`,
    border: `1px solid hsl(${hue} 70% 45% / 0.35)`,
  } as React.CSSProperties;

  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      )}
    >
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${tag}`}
          className="opacity-70 transition hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

const MINDSET_COLORS: Record<Mindset, string> = {
  DISCIPLINED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  CONFIDENT: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  PATIENT: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  HESITANT: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  FOMO: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  REVENGE: "bg-red-500/10 text-red-300 border-red-500/30",
};

const MINDSET_LABELS: Record<Mindset, string> = {
  DISCIPLINED: "Disciplined",
  CONFIDENT: "Confident",
  PATIENT: "Patient",
  HESITANT: "Hesitant",
  FOMO: "FOMO",
  REVENGE: "Revenge",
};

export function MindsetBadge({
  mindset,
  size = "md",
}: {
  mindset: Mindset;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        MINDSET_COLORS[mindset]
      )}
    >
      {MINDSET_LABELS[mindset]}
    </span>
  );
}

export { MINDSET_LABELS };
