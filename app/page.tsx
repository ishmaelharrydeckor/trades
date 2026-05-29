// app/page.tsx
import { supabase } from "@/lib/supabase";
import type {
  AccountSettings,
  AccountTransaction,
  Trade,
} from "@/lib/types";
import { DEFAULT_ACCOUNT_SETTINGS } from "@/lib/types";
import DashboardShell from "@/components/dashboard/DashboardShell";

// Revalidate every 30s so the dashboard stays fresh even on cached requests.
export const revalidate = 30;

async function fetchTrades(): Promise<Trade[]> {
  const { data, error } = await supabase
    .from("trades")
    .select(
      "ticket_id, close_time, asset_class, ticker, direction, lots, net_pnl, outcome, open_time, entry_price, stop_loss, take_profit, commission, swap, r_multiple, risk_amount, tags, notes, mindset, screenshot_url"
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
    console.error("Failed to load account transactions:", error.message);
    return [];
  }
  return (data ?? []) as AccountTransaction[];
}

async function fetchSettings(): Promise<AccountSettings> {
  const { data, error } = await supabase
    .from("account_settings")
    .select("id, strategy_parts, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    // Table may not exist yet on first deploy — fall back to defaults.
    return DEFAULT_ACCOUNT_SETTINGS;
  }
  return data as AccountSettings;
}

export default async function Page() {
  const [trades, transactions, settings] = await Promise.all([
    fetchTrades(),
    fetchTransactions(),
    fetchSettings(),
  ]);
  return (
    <main className="mx-auto w-full max-w-[1440px] overflow-x-hidden px-4 py-6 md:px-8 md:py-10">
      <DashboardShell
        trades={trades}
        transactions={transactions}
        settings={settings}
      />
    </main>
  );
}
