import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { ClubCrest } from "@/components/ClubCrest";
import { ClubCrestUploader } from "@/components/ClubCrestUploader";
import { RankBadge } from "@/components/RankBadge";
import { useClubName, useMatches, usePlayers, useWLs, store } from "@/lib/store";
import { aggregatePlayer, deriveClubProfiles, matchIsWin, rankFromWins, wlRecord, isCleanSheetEligible } from "@/lib/stats";
import { Pencil, Check, X, Trophy, Shield, Users, Award, Medal, Globe, Activity, Target } from "lucide-react";
import { SoccerBall } from "@/components/icons/SoccerBall";
import { SoccerBoot } from "@/components/icons/SoccerBoot";
import { BestXI } from "@/components/BestXI";
import { toast } from "sonner";

export const Route = createFileRoute("/club")({
  head: () => ({
    meta: [
      { title: "Club — WL Tracker" },
      { name: "description", content: "Manage your club identity and view lifetime statistics, split by club profile." },
    ],
  }),
  component: ClubPage,
});

const ALL_PROFILE_ID = "__all__";

function ClubPage() {
  const clubName = useClubName();
  const players = usePlayers();
  const matches = useMatches();
  const wls = useWLs();

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(clubName);
  const [profileId, setProfileId] = useState<string>(ALL_PROFILE_ID);

  useEffect(() => {
    if (!editingName) setDraftName(clubName);
  }, [clubName, editingName]);

  // Each unique (clubName, clubCrestUrl) snapshot used across WLs is a profile.
  // "O CLUBE" (ALL) aggregates every campaign regardless of identity.
  const profiles = useMemo(() => deriveClubProfiles(wls), [wls]);

  // Reset to ALL if the currently-selected profile disappears (WL deleted).
  useEffect(() => {
    if (profileId === ALL_PROFILE_ID) return;
    if (!profiles.some((p) => p.id === profileId)) setProfileId(ALL_PROFILE_ID);
  }, [profiles, profileId]);

  const scopedWLs = useMemo(() => {
    if (profileId === ALL_PROFILE_ID) return wls;
    const wlIds = new Set(profiles.find((p) => p.id === profileId)?.wlIds ?? []);
    return wls.filter((w) => wlIds.has(w.id));
  }, [wls, profiles, profileId]);

  const scopedMatches = useMemo(() => {
    const wlIds = new Set(scopedWLs.map((w) => w.id));
    return matches.filter((m) => wlIds.has(m.wlId));
  }, [matches, scopedWLs]);

  const activeProfile =
    profileId === ALL_PROFILE_ID
      ? null
      : profiles.find((p) => p.id === profileId) ?? null;

  const stats = useMemo(() => {
    let wins = 0, losses = 0, gf = 0, ga = 0;
    for (const m of scopedMatches) {
      gf += m.scoreFor;
      ga += m.scoreAgainst;
      if (matchIsWin(m)) wins += 1;
      else losses += 1;
    }
    let totalAssists = 0;
    for (const m of scopedMatches) for (const p of m.performances) totalAssists += p.assists;

    let cleanSheets = 0;
    for (const m of scopedMatches) {
      if (m.scoreAgainst !== 0) continue;
      const seen = new Set<string>();
      for (const perf of m.performances) {
        if (seen.has(perf.playerId)) continue;
        seen.add(perf.playerId);
        const player = players.find((pl) => pl.id === perf.playerId);
        if (player && isCleanSheetEligible(player.position)) {
          cleanSheets += 1;
          break;
        }
      }
    }

    // Possession / xG averages — only over matches that recorded the metric.
    let possSum = 0, possCount = 0;
    let xgForSum = 0, xgForCount = 0;
    let xgAgSum = 0, xgAgCount = 0;
    for (const m of scopedMatches) {
      if (typeof m.possessionFor === "number") { possSum += m.possessionFor; possCount += 1; }
      if (typeof m.xgFor === "number" && m.xgFor > 0) { xgForSum += m.xgFor; xgForCount += 1; }
      if (typeof m.xgAgainst === "number" && m.xgAgainst > 0) { xgAgSum += m.xgAgainst; xgAgCount += 1; }
    }

    const usedIds = new Set<string>();
    for (const wl of scopedWLs) for (const id of wl.squadPlayerIds) usedIds.add(id);

    let bestWins = 0;
    for (const wl of scopedWLs) {
      const r = wlRecord(wl, scopedMatches);
      if (r.wins > bestWins) bestWins = r.wins;
    }
    const bestRank = rankFromWins(bestWins);

    return {
      played: scopedMatches.length,
      wins,
      losses,
      gf,
      ga,
      totalAssists,
      cleanSheets,
      uniquePlayers: usedIds.size,
      bestWins,
      bestRank,
      wlCount: scopedWLs.length,
      avgPossession: possCount ? possSum / possCount : null,
      possCount,
      avgXgFor: xgForCount ? xgForSum / xgForCount : null,
      avgXgAgainst: xgAgCount ? xgAgSum / xgAgCount : null,
      xgSampleCount: Math.max(xgForCount, xgAgCount),
    };
  }, [scopedMatches, scopedWLs, players]);

  const topAgg = useMemo(() => {
    const aggs = players.map((p) => aggregatePlayer(p, scopedMatches));
    return [...aggs].sort((a, b) => b.matches - a.matches)[0];
  }, [players, scopedMatches]);

  const saveName = () => {
    store.setClubName(draftName);
    setEditingName(false);
    toast.success("Active club name updated");
  };

  return (
    <AppShell>
      {/* Hero / active identity */}
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
          Active identity · used on next WL
        </div>
      </div>

      {/* Identity management */}
      <div className="grid sm:grid-cols-1 gap-4 mb-8">
        <ClubCrestUploader />
      </div>

      {/* Profile selector */}
      {profiles.length > 0 && (
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold mb-2">
            Club Profiles
          </div>
          <div className="flex flex-wrap gap-2">
            <ProfilePill
              active={profileId === ALL_PROFILE_ID}
              onClick={() => setProfileId(ALL_PROFILE_ID)}
              icon={<Globe className="h-3.5 w-3.5" />}
              label="O CLUBE"
              sub={`${wls.length} WL${wls.length === 1 ? "" : "s"}`}
            />
            {profiles.map((p) => (
              <ProfilePill
                key={p.id}
                active={profileId === p.id}
                onClick={() => setProfileId(p.id)}
                icon={<ClubCrest size={18} overrideUrl={p.crestUrl} />}
                label={p.name}
                sub={`${p.wlIds.length} WL${p.wlIds.length === 1 ? "" : "s"}`}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Editar nome ou escudo aqui em cima cria um novo perfil automaticamente para as próximas WLs.
            Campanhas passadas continuam vinculadas ao perfil que estava ativo quando foram criadas.
          </p>
        </div>
      )}

      {/* Performance history */}
      <h2 className="font-display text-2xl tracking-wider mb-2 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        {activeProfile ? activeProfile.name : "Hall of Fame"}
        {activeProfile && (
          <ClubCrest size={28} overrideUrl={activeProfile.crestUrl} className="ml-1" />
        )}
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        {activeProfile
          ? `Lifetime totals while playing as "${activeProfile.name}" · ${stats.wlCount} WL${stats.wlCount === 1 ? "" : "s"}.`
          : `Lifetime totals across every Weekend League recorded · ${stats.wlCount} WL${stats.wlCount === 1 ? "" : "s"}.`}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <Tile label="Matches Played" value={stats.played} icon={<Trophy className="h-3.5 w-3.5" />} />
        <Tile label="Wins" value={stats.wins} icon={<Award className="h-3.5 w-3.5" />} accent />
        <Tile label="Losses" value={stats.losses} icon={<X className="h-3.5 w-3.5" />} danger />
        <WinRateTile wins={stats.wins} played={stats.played} />
        <Tile label="Unique Players" value={stats.uniquePlayers} icon={<Users className="h-3.5 w-3.5" />} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Tile label="Goals Scored" value={stats.gf} icon={<SoccerBall size={14} />} />
        <Tile label="Goals Conceded" value={stats.ga} icon={<Shield className="h-3.5 w-3.5" />} />
        <Tile label="Total Assists" value={stats.totalAssists} icon={<SoccerBoot size={14} />} />
        <Tile label="Clean Sheets" value={stats.cleanSheets} icon={<Shield className="h-3.5 w-3.5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-8">
        <PossessionTile avg={stats.avgPossession} count={stats.possCount} />
        <XgTile label="Avg xG · You" value={stats.avgXgFor} count={stats.xgSampleCount} icon={<Target className="h-3.5 w-3.5 text-primary" />} accent />
        <XgTile label="Avg xG · Against" value={stats.avgXgAgainst} count={stats.xgSampleCount} icon={<Target className="h-3.5 w-3.5 text-destructive" />} danger />
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

      <BestXI players={players} matches={scopedMatches} wls={scopedWLs} />
    </AppShell>
  );
}

function ProfilePill({
  active,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-left transition ${
        active
          ? "bg-primary/10 border-primary text-foreground shadow-[var(--shadow-neon)]"
          : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/70"
      }`}
    >
      <span className="shrink-0 grid place-items-center">{icon}</span>
      <span className="min-w-0">
        <span className="block font-display text-sm leading-tight truncate max-w-[12rem]">{label}</span>
        <span className="block text-[9px] uppercase tracking-wider font-mono opacity-80">{sub}</span>
      </span>
    </button>
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

function WinRateTile({ wins, played }: { wins: number; played: number }) {
  const pct = played ? (wins / played) * 100 : 0;
  const tone = played === 0 ? "" : pct >= 60 ? "text-primary" : pct >= 40 ? "text-amber-300" : "text-destructive";
  return (
    <div className="surface-card p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-1.5">
        <Trophy className="h-3.5 w-3.5" /> Win Rate
      </div>
      <div className={`font-display text-3xl stat-num mt-1 leading-none ${tone}`}>
        {played ? `${pct.toFixed(1)}%` : "—"}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 font-mono">{wins}W / {played} MP</div>
    </div>
  );
}

function PossessionTile({ avg, count }: { avg: number | null; count: number }) {
  const pct = avg ?? 50;
  const youPct = Math.round(pct);
  const oppPct = 100 - youPct;
  return (
    <div className="surface-card p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5 text-primary" /> Avg Possession
      </div>
      {avg === null ? (
        <>
          <div className="font-display text-3xl stat-num mt-1 leading-none text-muted-foreground/60">—</div>
          <div className="text-[10px] text-muted-foreground mt-1 font-mono">log possession on matches</div>
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mt-1 leading-none">
            <span className="font-display stat-num text-3xl text-primary">{youPct}%</span>
            <span className="text-muted-foreground/50 text-sm">vs</span>
            <span className="font-display stat-num text-2xl text-muted-foreground">{oppPct}%</span>
          </div>
          <div className="mt-2 h-1.5 bg-destructive/30 rounded overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${youPct}%` }} />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 font-mono">across {count} match{count === 1 ? "" : "es"}</div>
        </>
      )}
    </div>
  );
}

function XgTile({ label, value, count, icon, accent, danger }: { label: string; value: number | null; count: number; icon: React.ReactNode; accent?: boolean; danger?: boolean }) {
  return (
    <div className="surface-card p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className={`font-display text-3xl stat-num mt-1 leading-none ${accent ? "text-primary" : danger ? "text-destructive" : ""}`}>
        {value === null ? "—" : value.toFixed(2)}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 font-mono">
        {value === null ? "no xG logged" : `per match · ${count} sample${count === 1 ? "" : "s"}`}
      </div>
    </div>
  );
}

