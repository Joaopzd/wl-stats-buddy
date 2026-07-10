# Overhaul: WL List, WL Detail, Settings & Main Dashboard

## 1. WL List page (`src/routes/weekend-leagues.index.tsx`)
Cleaner, more scannable, with a live preview panel.

- Replace the 3-column card grid with a **split layout**:
  - Left: compact list of WLs (dense rows: badge with WL number, custom name, W-L record, mini form dots for last 5 matches, rank chip).
  - Right (sticky, hidden on mobile — falls back to full list): **Preview panel** of the hovered/selected WL showing crest, name, big W-L, GF/GA, rank badge, form timeline, top scorer, and a "Open WL" button.
- Selection is local state (defaults to most recent WL). Row click on desktop = select preview; row "Open" button or double-click = navigate.
- Keep Create/Compare/Briefing actions in the header.
- Keep edit/delete inline on each row (icon-only, no card clutter).
- Remove the large watermark from list rows (kept only in preview panel) to reduce visual noise.

## 2. WL Detail (`src/routes/weekend-leagues.$wlId.tsx`)
Make it fit within a single viewport with minimal scrolling; more organic flow.

- Compress the sticky header (crest + name + record on one line; actions collapse into a compact row).
- Convert the current 3 tabs (Overview / Matches / Squad Analytics) into a **denser single view**:
  - Row A: KPI strip (Wins, Losses, GF, GA, GD, Rank) — small tiles, one line.
  - Row B (2 columns on lg): left = Matches Timeline (scrollable inside a fixed-height panel `max-h-[420px] overflow-y-auto`); right = Squad Analytics table (also `max-h-[420px] overflow-y-auto`).
  - Row C: Advanced match aggregates (Possession, xG, Passes, Shots) as a compact strip.
- Remove the tabs component — keep everything visible; internal scroll instead of page scroll.
- Trim excessive padding/margins; use `text-sm` for tables; reduce card gaps.

## 3. Settings (`src/routes/settings.tsx`)
Group Active Club Profile and Opponent Configuration side-by-side.

- Wrap the two blocks in a single `grid md:grid-cols-2 gap-6` section titled "Club & Opponents", so users manage identity and rivals together.
- Keep Theme Palette above as its own section.

## 4. Main Dashboard (`src/routes/index.tsx`) — 4-tier rebuild
Replace the current landing with stacked analytical tiers. Remove the "Raridades" block (already requested previously; ensure it stays out).

### Tier 1 — General Performance Summary
Grid of tiles across all WLs:
- Total Wins, Total Losses, Goals Scored, Goals Conceded, Cumulative GD, Winning Effectiveness % (W/(W+L)), All-Time Best Result (highest wins in a single WL, with WL label), Best Rank, Current Rank (rank of latest WL).

### Tier 2 — Platform Analytics & AI Insights
- **Platform breakdown** cards: for each of PC / PS5 / Xbox aggregate matches where opponent platform matches — show W-L, Win %, GF-GA. Use existing `PlatformBadge`.
- **Dynamic AI banner**: reuse `runCoach` server fn in "analysis" mode fed with a compact "recent trend" payload (last 3 WLs). Render a slim banner with the `summary` + a rotating actionable tip. Auto-run on mount (guard w/ cache-in-state; add refresh button). Handle 429/402 gracefully.

### Tier 3 — Visual Analytics (Charts)
Responsive charts (recharts — already used in `WLTrendsChart`):
- **Goals Trend**: per-WL GF vs GA line/area.
- **Wins Evolution**: per-WL wins bar/line with cumulative wins line.
Two-column on lg, stacked on mobile.

### Tier 4 — Historic Leaders Roll
Minimalist podium widgets:
- #1 Top Scorer, #1 Top Assister, #1 Top G+A, #1 Most Appearances.
- Top 3 Highest Avg Rating — filter players whose `matches` >= 50% of total matches played across all WLs.
Small podium cards with crest/avatar-less minimal layout (name, position, stat number, sub-label).

Helpers needed in `src/lib/stats.ts`:
- `aggregateAllTime(wls, matches)` → totals, best result, best/current rank.
- `platformSplit(matches)` → per-platform W-L-GF-GA.
- `historicLeaders(players, matches)` → single leaders + top-3 rating with participation gate.
- `perWLTrend(wls, matches)` → chart data.

## Technical notes
- No schema changes.
- Files touched: `weekend-leagues.index.tsx`, `weekend-leagues.$wlId.tsx`, `settings.tsx`, `index.tsx`, `stats.ts`. New small component: `DashboardAIBanner.tsx`.
- Keep semantic tokens; no hardcoded colors.
- Preserve existing behaviors (edit modal, watermark picker, match dialogs, coach briefing).
