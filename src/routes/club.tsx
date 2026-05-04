import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { ClubCrest } from "@/components/ClubCrest";
import { ClubCrestUploader } from "@/components/ClubCrestUploader";
import { RankBadge } from "@/components/RankBadge";
import { useClubName, useMatches, usePlayers, useWLs, store } from "@/lib/store";
import { aggregatePlayer, matchIsWin, rankFromWins, wlRecord, isCleanSheetEligible } from "@/lib/stats";
import { Pencil, Check, X, Trophy, Target, Shield, Sparkles, Users, Award, Medal } from "lucide-react";
import { BestXI } from "@/components/BestXI";
import { toast } from "sonner";

export const Route = createFileRoute("/club")({
  head: () => ({
    meta: [
      { title: "Club — WL Tracker" },
      { name: "description", content: "Manage your club identity and view lifetime statistics." },
    ],
  }),
  component: ClubPage,
});

function ClubPage() {
  const clubName = useClubName();
  const players = usePlayers();
  const matches = useMatches();
  const wls = useWLs();

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(clubName);

  useEffect(() => {
    if (!editingName) setDraftName(clubName);
  }, [clubName, editingName]);

  const stats = useMemo(() => {
    let wins = 0, losses = 0, gf = 0, ga = 0;
    for (const m of matches) {
      gf += m.scoreFor;
      ga += m.scoreAgainst;
      if (matchIsWin(m)) wins += 1;
      else losses += 1;
    }
    let totalAssists = 0;
    for (const m of matches) for (const p of m.performances) totalAssists += p.assists;

    let cleanSheets = 0;
    for (const m of matches) {
      if (m.scoreAgainst !== 0) continue;
      const seen = new Set<string>();
      for (const perf of m.performances) {
        if (seen.has(perf.playerId)) continue;
        seen.add(perf.playerId);
        const player = players.find((pl) => pl.id === perf.playerId);
        if (player && isCleanSheetEligible(player.position)) {
          cleanSheets += 1;
          break; // count one team clean sheet per match
        }
      }
    }

    const usedIds = new Set<string>();
    for (const wl of wls) for (const id of wl.squadPlayerIds) usedIds.add(id);

    let bestWins = 0;
    for (const wl of wls) {
      const r = wlRecord(wl, matches);
      if (r.wins > bestWins) bestWins = r.wins;
    }
    const bestRank = rankFromWins(bestWins);

    return {
      played: matches.length,
      wins,
      losses,
      gf,
      ga,
      totalAssists,
      cleanSheets,
      uniquePlayers: usedIds.size,
      bestWins,
      bestRank,
    };
  }, [matches, players, wls]);

  const topAgg = useMemo(() => {
    const aggs = players.map((p) => aggregatePlayer(p, matches));
    return [...aggs].sort((a, b) => b.matches - a.matches)[0];
  }, [players, matches]);

  const saveName = () => {
    store.setClubName(draftName);
    setEditingName(false);
    toast.success("Club name updated");
  };

  return (
    <AppShell>
      {/* Hero / identity */}
      <div className="surface-card p-6 sm:p-8 flex flex-col items-center text-center mb-8">
        <ClubCrest size={96} />
        {editingName ? (
          <div className="mt-4 flex items-center gap-2 w-full max-w-sm">
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") { setEditingName(false); setDraftName(clubName); }
              }}
              placeholder="Club name"
              maxLength={32}
              className="flex-1 bg-input border border-border rounded-md px-3 py-2 font-display text-xl text-center"
            />
            <button onClick={saveName} className="p-2 rounded-md bg-primary text-primary-foreground" aria-label="Save">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => { setEditingName(false); setDraftName(clubName); }} className="p-2 rounded-md border border-border text-muted-foreground" aria-label="Cancel">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="mt-4 group inline-flex items-center gap-2"
          >
            <h1 className="font-display text-3xl sm:text-4xl tracking-wider">
              {clubName || "Name your club"}
            </h1>
            <Pencil className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
          </button>
        )}
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-2">
          Champs Tracker · Club Identity
        </div>
      </div>

      {/* Identity management */}
      <div className="grid sm:grid-cols-1 gap-4 mb-8">
        <ClubCrestUploader />
      </div>

      {/* Performance history */}
      <h2 className="font-display text-2xl tracking-wider mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" /> Hall of Fame
      </h2>
      <p className="text-xs text-muted-foreground mb-4">Lifetime totals across every Weekend League recorded.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Tile label="Matches Played" value={stats.played} icon={<Trophy className="h-3.5 w-3.5" />} />
        <Tile label="Wins" value={stats.wins} icon={<Award className="h-3.5 w-3.5" />} accent />
        <Tile label="Losses" value={stats.losses} icon={<X className="h-3.5 w-3.5" />} danger />
        <Tile label="Unique Players" value={stats.uniquePlayers} icon={<Users className="h-3.5 w-3.5" />} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Tile label="Goals Scored" value={stats.gf} icon={<Target className="h-3.5 w-3.5" />} />
        <Tile label="Goals Conceded" value={stats.ga} icon={<Shield className="h-3.5 w-3.5" />} />
        <Tile label="Total Assists" value={stats.totalAssists} icon={<Sparkles className="h-3.5 w-3.5" />} />
        <Tile label="Clean Sheets" value={stats.cleanSheets} icon={<Shield className="h-3.5 w-3.5" />} />
      </div>

      <div className="surface-card p-6 flex flex-col sm:flex-row items-center gap-5 justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-md grid place-items-center bg-amber-400/15 text-amber-300">
            <Medal className="h-7 w-7" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold">Best Result</div>
            <div className="font-display text-3xl mt-0.5">
              {stats.bestWins} {stats.bestWins === 1 ? "Win" : "Wins"}
            </div>
            <div className="text-xs text-muted-foreground">in a single Weekend League</div>
          </div>
        </div>
        <RankBadge rank={stats.bestRank} size="lg" />
      </div>

      {topAgg && topAgg.matches > 0 && (
        <div className="mt-4 text-[11px] text-muted-foreground text-center">
          Most-used player: <span className="text-foreground font-semibold">{topAgg.player.name}</span> · {topAgg.matches} apps
        </div>
      )}
    </AppShell>
  );
}

function Tile({ label, value, icon, accent, danger }: { label: string; value: number; icon?: React.ReactNode; accent?: boolean; danger?: boolean }) {
  return (
    <div className="surface-card p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className={`font-display text-3xl stat-num mt-1 leading-none ${accent ? "text-primary" : danger ? "text-destructive" : ""}`}>
        {value}
      </div>
    </div>
  );
}
