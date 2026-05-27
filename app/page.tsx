// app/page.tsx
import { supabase } from "@/lib/supabase";
import type { AccountTransaction, Trade } from "@/lib/types";
import DashboardShell from "@/components/dashboard/DashboardShell";

// Revalidate every 30s so the dashboard stays fresh even on cached requests.
export const revalidate = 30;

async function fetchTrades(): Promise<Trade[]> {
  const { data, error } = await supabase
    .from("trades")
    .select(
      "ticket_id, close_time, asset_class, ticker, direction, lots, net_pnl, outcome, open_time, entry_price, stop_loss, take_profit, commission, swap, r_multiple, tags, notes, mindset, screenshot_url"
    )
    .order("close_time", { ascending: true });

  if (error) {
    console.error("Failed to load trades:", error.message);
    return [];
  }
  return (data ?? []) as Trade[];
}

async function fetchTransactions(): Promise<AccountTransaction[]> {
  const { data, error } = await supabase
    .from("account_transactions")
    .select("id, occurred_at, kind, amount, note, created_at")
    .order("occurred_at", { ascending: true });

  if (error) {
    // Table may not exist yet on first deploy; fail soft so the rest of the
    // dashboard still renders. The Account tab handles the empty state.
    console.error("Failed to load account transactions:", error.message);
    return [];
  }
  return (data ?? []) as AccountTransaction[];
}

export default async function Page() {
  const [trades, transactions] = await Promise.all([
    fetchTrades(),
    fetchTransactions(),
  ]);
  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-10">
      <DashboardShell trades={trades} transactions={transactions} />
    </main>
  );
}
