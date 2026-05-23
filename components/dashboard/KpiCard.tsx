// components/dashboard/KpiCard.tsx
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  delta?: string;
  tone?: "neutral" | "profit" | "loss" | "blue";
  icon?: LucideIcon;
  glow?: boolean;
}

const toneStyles: Record<NonNullable<Props["tone"]>, string> = {
  neutral: "text-white",
  profit: "text-[color:var(--accent-profit)]",
  loss: "text-[color:var(--accent-loss)]",
  blue: "text-[color:var(--accent-equity)]",
};

const glowStyles: Record<NonNullable<Props["tone"]>, string> = {
  neutral: "shadow-[0_0_60px_-20px_rgba(148,163,184,0.25)]",
  profit:
    "shadow-[0_0_80px_-20px_rgba(34,197,94,0.45)] ring-1 ring-emerald-500/10",
  loss: "shadow-[0_0_80px_-20px_rgba(239,68,68,0.45)] ring-1 ring-red-500/10",
  blue:
    "shadow-[0_0_80px_-20px_rgba(59,130,246,0.45)] ring-1 ring-blue-500/10",
};

export default function KpiCard({
  label,
  value,
  delta,
  tone = "neutral",
  icon: Icon,
  glow = false,
}: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5",
        glow && glowStyles[tone]
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 text-slate-600" />}
      </div>
      <div
        className={cn(
          "mt-3 text-3xl font-semibold tracking-tight tnum md:text-4xl",
          toneStyles[tone]
        )}
      >
        {value}
      </div>
      {delta && (
        <div className="mt-2 text-xs text-slate-500">
          <span className={cn("tnum", toneStyles[tone])}>{delta}</span>
        </div>
      )}
    </div>
  );
}
