# Forex & Indices Trading Journal

Institutional-grade trading journal for MetaTrader 5 — real-time ingestion, equity curve, performance calendar, and asset breakdowns. Built with Next.js App Router, Supabase, Recharts, and Tailwind.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** with a custom institutional dark palette
- **Recharts** for the equity curve & symbol-ranking visuals
- **Supabase** (PostgreSQL) for the `trades` table
- **lucide-react** for icons

## Project layout

```
.
├── app/
│   ├── api/sync/route.ts      # MT5 webhook → Supabase upsert (Edge)
│   ├── globals.css            # Design tokens (CSS variables)
│   ├── layout.tsx
│   └── page.tsx               # Reads `trades`, renders dashboard
├── components/dashboard/
│   ├── DashboardShell.tsx     # Tabbed shell
│   ├── OverviewTab.tsx        # KPI bar + equity curve + win/loss
│   ├── CalendarTab.tsx        # Month grid with P&L heat
│   ├── AssetAnalysisTab.tsx   # Matrix + symbol bars + recent table
│   ├── KpiCard.tsx
│   ├── EquityCurveChart.tsx
│   ├── WinLossPanels.tsx
│   ├── AssetMatrix.tsx
│   ├── TopSymbolsChart.tsx
│   └── RecentTradesTable.tsx
└── lib/
    ├── types.ts               # Trade + KPI types
    ├── supabase.ts            # Anon (read) + service (write) clients
    ├── stats.ts               # Pure metrics engine (testable)
    └── utils.ts               # Formatters + cn()
```

## Setup

```bash
pnpm install         # or npm / yarn / bun
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, and MT5_WEBHOOK_SECRET
pnpm dev
```

## Database schema

Create the `trades` table in your Supabase project:

```sql
create table if not exists public.trades (
  ticket_id    text primary key,
  close_time   timestamptz not null,
  asset_class  text not null check (asset_class in ('FOREX','INDICES')),
  ticker       text not null,
  direction    text not null check (direction in ('BUY','SELL')),
  lots         numeric not null,
  net_pnl      numeric not null,
  outcome      text not null check (outcome in ('WIN','LOSS'))
);

create index if not exists trades_close_time_idx on public.trades (close_time desc);
create index if not exists trades_ticker_idx on public.trades (ticker);
```

For the public dashboard reads, allow anon SELECT (you can restrict later with RLS):

```sql
alter table public.trades enable row level security;
create policy "anon read" on public.trades for select using (true);
```

## MT5 webhook contract

The Expert Advisor on your MT5 terminal should POST to `/api/sync` whenever a position closes.

**Headers**
```
Content-Type: application/json
x-mt5-secret: <MT5_WEBHOOK_SECRET>
```

**Body**
```json
{
  "ticket": "23445981",
  "time": "2026-05-23T11:42:31Z",
  "symbol": "EURUSD",
  "direction": "BUY",
  "volume": 0.50,
  "pnl": 142.85,
  "outcome": "WIN"
}
```

The endpoint normalizes `EURUSD` → `EUR/USD`, infers `asset_class` (NAS100/US30/SPX500/GER40/UK100/JPN225/AUS200/HK50/XAU*/XAG* → `INDICES`, otherwise `FOREX`), and upserts on `ticket_id` — so the EA can retry safely.

## Metrics formulas (lib/stats.ts)

| KPI | Definition |
|---|---|
| Net Portfolio P&L | Σ `net_pnl` |
| Win Rate | count(WIN) ÷ total × 100 |
| Profit Factor | Σ positive P&L ÷ \|Σ negative P&L\| |
| Avg Winner / Loser | grossProfit ÷ wins · grossLoss ÷ losses |
| Max Streak | chronological traversal, reset on outcome flip |
| Equity Curve | sort by `close_time` asc, running sum of `net_pnl` |

All helpers are pure — drop them into a test runner without touching React.

<!-- nudge 2026-05-27T05:18:00.2257547+00:00 -->
