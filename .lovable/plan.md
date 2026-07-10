
## 1. Dashboard Charts — Interactive Tooltips + Filters
**File:** `src/components/WLTrendsChart.tsx` (+ small consumer wiring in `src/routes/index.tsx`)

- Keep the existing custom tooltip (already interactive), enhance with cursor line + focused dot + smooth transitions.
- Add a compact filter bar above the two charts:
  - **Platform filter** (segmented: All / PC / PS5 / Xbox) — filters the underlying matches used to compute each WL's aggregates.
  - **Date range** — "Last 5", "Last 10", "Last 20", "All" (operates on WL number descending, keeps chronological order in the chart).
- Recompute per-WL aggregates from the filtered match set (a WL with zero filtered matches is dropped from the series).
- Persist filter selection to `localStorage` under `wl:dashboardTrendFilters`.

## 2. Dashboard — Top Rated Podium
**File:** `src/routes/index.tsx` (+ `historicLeaders` in `src/lib/stats.ts`)

- Verify `historicLeaders.topRated` produces the 3 highest career avg-rating players filtered to ≥ 50% of total matches AND `ratedMatches > 0`.
- Current threshold uses `Math.max(1, Math.ceil(totalMatches * 0.5))` on `matches` (appearances). Confirm that's what renders; if the podium is empty/wrong on small samples, relax to `ratedMatches >= 0.5 * totalMatches` OR clarify with the user. Right now the rule already matches the spec — I'll double-check the render sort/order and tie-breaking (avgRating desc → ratedMatches desc → matches desc) and add tie-breakers if missing.

## 3. Players Database — Status Segmentation + Auto-Archive
**Files:** `src/routes/players.tsx`, `src/lib/types.ts` (already has `isArchived`, `isInDevelopment`), `src/lib/store.ts` (helper), `src/lib/stats.ts` (absence calc)

- Rework `/players` into 3 tabs (shadcn `Tabs`): **Active Squad**, **In Development**, **Archived**. Counts shown as badges on each tab.
- Segmentation rule:
  - `Archived` → `isArchived === true`
  - `In Development` → `isInDevelopment === true && !isArchived`
  - `Active Squad` → the rest
- **Auto-archive rule** (client-side, runs on `/players` mount and after any WL save):
  - Compute each player's last WL appearance (max `wl.number` where the player has ≥ 1 match performance in that WL).
  - If the two most recent WLs (by `number`) both exist and the player has no appearance in either, and player is not already `isArchived`, flip `isArchived = true` (persisted through existing store update). New players (`createdAt` after the older of the 2 WLs) are exempt.
  - Log a small toast summary "N players auto-archived after 2 WL absence".
- **Manual toggle**: on each player row/card add a compact status control (Segmented: Active / Dev / Archived) that updates `isArchived`/`isInDevelopment` via store. Clearing Archive resets absence tracking implicitly (next scan won't re-archive unless still absent — that's intended; noted in tooltip).

## 4. Club Hub — Eras Timeline + Best XI Modes
**Files:** `src/routes/club.tsx`, `src/components/BestXI.tsx`

- **Eras timeline**: derive "eras" from `deriveClubProfiles(wls)`. For each club profile show a horizontal timeline card with: crest, name, WL count, span (first → last WL number), aggregate W-L, GF/GA, best rank achieved, top scorer in that era. Rendered as vertical stacked cards with a left rail dot/line for premium timeline feel.
- **Best Squad View** (extends existing `BestXI`):
  - Toggle group with 3 modes:
    1. **Best WL** (default) — starters from the highest-wins WL, using that WL's snapshot squad/formation.
    2. **Top Rated / Position** — for each pitch slot pick the player with highest career avg rating eligible for that position (respects `secondaryPositions`; min ratedMatches guard e.g. 5).
    3. **Formation** — dropdown of available formations (`src/lib/formations.ts`) applying Top Rated logic to that shape.
  - Render on the existing pitch layout used by `BestXI` (reuse component; add `mode` + `formationId` props).

## 5. Club Legends Tab — Fluid Redesign
**File:** likely a section inside `src/routes/club.tsx` (existing "legends" area). If not present, add a `<ClubLegends>` component consumed by `club.tsx`.

- Rebuild as a fluid, high-contrast board:
  - Three hero cards side-by-side (grid, collapses to stack on mobile) for **All-Time Appearances**, **All-Time Goals**, **All-Time Assists** — big number, player crest/name, tier accent, subtle glow.
  - Secondary strip: Top 5 lists for each category with rank chips, mini bars for relative scale.
  - Uses semantic tokens (`primary`, `accent`, `destructive` for contrast); no hardcoded colors.

## Technical notes
- All persistence uses existing store patterns (`updatePlayer`) — no schema changes.
- Auto-archive is deterministic and idempotent; toast only when it flips someone.
- Charts filter state is local + localStorage; no server round-trip.
- All new UI uses semantic tokens per project rules.
