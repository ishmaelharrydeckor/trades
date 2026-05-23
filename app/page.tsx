// app/page.tsx
import { supabase } from "@/lib/supabase";
import type { Trade } from "@/lib/types";
import DashboardShell from "@/components/dashboard/DashboardShell";

// Revalidate every 30s so the dashboard stays fresh even on cached requests.
export const revalidate = 30;

async function fetchTrades(): Promise<Trade[]> {
  const { data, error } = await supabase
    .from("trades")
    .select(
      "ticket_id, close_time, asset_class, ticker, direction, lots, net_pnl, outcome"
    )
    .order("close_time", { ascending: true });

  if (error) {
    console.error("Failed to load trades:", error.message);
    return [];
  }
  return (data ?? []) as Trade[];
}

export default async function Page() {
  const trades = await fetchTrades();
  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-10">
      <DashboardShell trades={trades} />
    </main>
  );
}
