import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { ClubCrest } from "@/components/ClubCrest";

import { RankBadge } from "@/components/RankBadge";
import { useClubName, useMatches, usePlayers, useWLs, store } from "@/lib/store";
import { aggregatePlayer, deriveClubProfiles, matchIsWin, rankFromWins, wlRecord, isCleanSheetEligible, type ClubProfile } from "@/lib/stats";
import { Pencil, Check, X, Trophy, Shield, Users, Award, Medal, Globe, Activity, Target, Upload, Trash2 } from "lucide-react";
import { SoccerBall } from "@/components/icons/SoccerBall";
import { SoccerBoot } from "@/components/icons/SoccerBoot";
import { BestXI } from "@/components/BestXI";
import { compressImageToDataURL } from "@/lib/imageCompress";
import { toast } from "sonner";

export const Route = createFileRoute("/club")({
  head: () => ({
    meta: [
      { title: "Club — PitchSide" },
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
  const [editingProfile, setEditingProfile] = useState<ClubProfile | null>(null);


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
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mt-2">
          Active identity · used on next WL
        </div>
      </div>

      {/* Identity is managed via the gear icon in the header — kept out of Club tab to reduce clutter. */}


      {/* Profile selector */}
      {profiles.length > 0 && (
        <div className="mb-6">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-bold mb-2">
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
                onEdit={() => setEditingProfile(p)}
                icon={<ClubCrest size={18} overrideUrl={p.crestUrl} />}
                label={p.name}
                sub={`${p.wlIds.length} WL${p.wlIds.length === 1 ? "" : "s"}`}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Editar nome ou escudo no topo cria um novo perfil automaticamente para as próximas WLs.
            Use o lápis em cada perfil acima para reescrever a identidade visual de uma campanha já existente.
          </p>
        </div>
      )}

      {/* Performance history */}
      <h2 className="font-display text-2xl tracking-wider mb-2 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        {activeProfile ? activeProfile.name : "Hall of Fame"}
        {activeProfile && (
          <>
            <ClubCrest size={28} overrideUrl={activeProfile.crestUrl} className="ml-1" />
            <button
              onClick={() => setEditingProfile(activeProfile)}
              className="ml-1 p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
              aria-label="Edit profile identity"
              title="Editar identidade visual deste perfil"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </>
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
            <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold">Best Result</div>
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

      <ClubEras profiles={profiles} wls={wls} matches={matches} players={players} />

      <ClubLegends players={players} matches={scopedMatches} />

      <BestXI players={players} matches={scopedMatches} wls={scopedWLs} />

      {editingProfile && (
        <ProfileEditModal
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSave={(newName, newCrest) => {
            for (const wlId of editingProfile.wlIds) {
              store.updateWL(wlId, {
                clubName: newName || undefined,
                clubCrestUrl: newCrest,
              });
            }
            setEditingProfile(null);
            toast.success(`Identidade visual atualizada em ${editingProfile.wlIds.length} WL${editingProfile.wlIds.length === 1 ? "" : "s"}`);
          }}
        />
      )}
    </AppShell>
  );
}

function ProfilePill({
  active,
  onClick,
  onEdit,
  icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  onEdit?: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-md border transition ${
        active
          ? "bg-primary/10 border-primary text-foreground shadow-[var(--shadow-neon)]"
          : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/70"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 text-left min-w-0"
      >
        <span className="shrink-0 grid place-items-center">{icon}</span>
        <span className="min-w-0">
          <span className="block font-display text-sm leading-tight truncate max-w-[12rem]">{label}</span>
          <span className="block text-[11px] uppercase tracking-wider font-mono opacity-80">{sub}</span>
        </span>
      </button>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 mr-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition shrink-0"
          aria-label={`Editar perfil ${label}`}
          title="Editar identidade visual"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function ProfileEditModal({
  profile,
  onClose,
  onSave,
}: {
  profile: ClubProfile;
  onClose: () => void;
  onSave: (name: string, crestUrl: string | null) => void;
}) {
  const [name, setName] = useState(profile.name === "Unnamed Club" ? "" : profile.name);
  const [crest, setCrest] = useState<string | null>(profile.crestUrl);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = async (file: File) => {
    if (file.size > 10_000_000) {
      toast.error("Imagem muito grande (máx ~10 MB)");
      return;
    }
    setBusy(true);
    try {
      const url = await compressImageToDataURL(file);
      setCrest(url);
    } catch {
      toast.error("Não foi possível ler essa imagem. Use PNG ou JPG.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="surface-glow w-full max-w-md rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl tracking-wider">Editar identidade</h2>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
              {profile.wlIds.length} WL{profile.wlIds.length === 1 ? "" : "s"} será{profile.wlIds.length === 1 ? "" : "ão"} reescrita{profile.wlIds.length === 1 ? "" : "s"}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <ClubCrest size={64} overrideUrl={crest} />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
              >
                <Upload className="h-3 w-3" /> {busy ? "Carregando…" : crest ? "Trocar escudo" : "Enviar escudo"}
              </button>
              {crest && (
                <button
                  type="button"
                  onClick={() => setCrest(null)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-muted-foreground text-[11px] font-bold uppercase tracking-wider hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" /> Remover
                </button>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPick(f);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">Nome do clube</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do clube"
              maxLength={48}
              className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Isso reescreve o snapshot de nome e escudo em todas as WLs desse perfil. A identidade ativa do clube não é alterada.
          </p>
        </div>
        <div className="px-5 py-3 border-t border-border/60 flex gap-2">
          <button
            onClick={() => onSave(name.trim(), crest)}
            disabled={busy}
            className="flex-1 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm hover:opacity-90 disabled:opacity-50"
          >
            Salvar
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-md border border-border text-muted-foreground hover:text-foreground text-sm">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, icon, accent, danger }: { label: string; value: number; icon?: React.ReactNode; accent?: boolean; danger?: boolean }) {
  return (
    <div className="surface-card p-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-1.5">
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
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-1.5">
        <Trophy className="h-3.5 w-3.5" /> Win Rate
      </div>
      <div className={`font-display text-3xl stat-num mt-1 leading-none ${tone}`}>
        {played ? `${pct.toFixed(1)}%` : "—"}
      </div>
      <div className="text-[11px] text-muted-foreground mt-1 font-mono">{wins}W / {played} MP</div>
    </div>
  );
}

function PossessionTile({ avg, count }: { avg: number | null; count: number }) {
  const pct = avg ?? 50;
  const youPct = Math.round(pct);
  const oppPct = 100 - youPct;
  return (
    <div className="surface-card p-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5 text-primary" /> Avg Possession
      </div>
      {avg === null ? (
        <>
          <div className="font-display text-3xl stat-num mt-1 leading-none text-muted-foreground/60">—</div>
          <div className="text-[11px] text-muted-foreground mt-1 font-mono">log possession on matches</div>
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
          <div className="text-[11px] text-muted-foreground mt-1 font-mono">across {count} match{count === 1 ? "" : "es"}</div>
        </>
      )}
    </div>
  );
}

function XgTile({ label, value, count, icon, accent, danger }: { label: string; value: number | null; count: number; icon: React.ReactNode; accent?: boolean; danger?: boolean }) {
  return (
    <div className="surface-card p-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className={`font-display text-3xl stat-num mt-1 leading-none ${accent ? "text-primary" : danger ? "text-destructive" : ""}`}>
        {value === null ? "—" : value.toFixed(2)}
      </div>
      <div className="text-[11px] text-muted-foreground mt-1 font-mono">
        {value === null ? "no xG logged" : `per match · ${count} sample${count === 1 ? "" : "s"}`}
      </div>
    </div>
  );
}


// ---------- Club Eras timeline ----------
function ClubEras({
  profiles,
  wls,
  matches,
  players,
}: {
  profiles: ClubProfile[];
  wls: import("@/lib/types").WeekendLeague[];
  matches: import("@/lib/types").Match[];
  players: import("@/lib/types").Player[];
}) {
  const eras = useMemo(() => {
    return profiles.map((p) => {
      const eraWls = wls.filter((w) => p.wlIds.includes(w.id));
      const wlIds = new Set(p.wlIds);
      const eraMatches = matches.filter((m) => wlIds.has(m.wlId));
      let wins = 0, losses = 0, gf = 0, ga = 0, bestWins = 0;
      for (const m of eraMatches) {
        gf += m.scoreFor; ga += m.scoreAgainst;
        if (matchIsWin(m)) wins += 1; else losses += 1;
      }
      for (const wl of eraWls) {
        const r = wlRecord(wl, eraMatches);
        if (r.wins > bestWins) bestWins = r.wins;
      }
      const scorerTally = new Map<string, number>();
      for (const m of eraMatches) for (const perf of m.performances) {
        scorerTally.set(perf.playerId, (scorerTally.get(perf.playerId) ?? 0) + perf.goals);
      }
      let topScorerId: string | null = null; let topGoals = 0;
      for (const [pid, g] of scorerTally) if (g > topGoals) { topGoals = g; topScorerId = pid; }
      const topScorer = topScorerId ? players.find((pl) => pl.id === topScorerId) ?? null : null;
      const numbers = eraWls.map((w) => w.number).sort((a, b) => a - b);
      const span = numbers.length ? { first: numbers[0], last: numbers[numbers.length - 1] } : null;
      return { profile: p, wls: eraWls, wins, losses, gf, ga, bestWins, bestRank: rankFromWins(bestWins), topScorer, topGoals, span };
    }).sort((a, b) => (b.span?.last ?? 0) - (a.span?.last ?? 0));
  }, [profiles, wls, matches, players]);

  if (eras.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl tracking-wider mb-1 flex items-center gap-2">
        <Globe className="h-5 w-5 text-primary" /> Club Eras
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Cada identidade (nome + escudo) usada em campanhas anteriores vira uma era da história do clube.
      </p>
      <ol className="relative border-l border-border/60 ml-3 space-y-4">
        {eras.map((e) => (
          <li key={e.profile.id} className="pl-5 relative">
            <span className="absolute -left-[7px] top-3 h-3 w-3 rounded-full bg-primary shadow-[var(--shadow-neon)]" />
            <div className="surface-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <ClubCrest size={40} overrideUrl={e.profile.crestUrl} />
                <div className="flex-1 min-w-0">
                  <div className="font-display text-lg tracking-wider truncate">{e.profile.name}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                    {e.span ? `WL #${e.span.first}${e.span.last !== e.span.first ? ` – #${e.span.last}` : ""}` : "—"} · {e.wls.length} WL{e.wls.length === 1 ? "" : "s"}
                  </div>
                </div>
                <RankBadge rank={e.bestRank} size="sm" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 text-xs">
                <MiniStat label="Wins" value={e.wins} tone="primary" />
                <MiniStat label="Losses" value={e.losses} tone="danger" />
                <MiniStat label="GF" value={e.gf} />
                <MiniStat label="GA" value={e.ga} />
                <MiniStat label="Best" value={`${e.bestWins}W`} />
              </div>
              {e.topScorer && (
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Top scorer: <span className="text-foreground font-semibold">{e.topScorer.name}</span> · {e.topGoals} goals
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number | string; tone?: "primary" | "danger" }) {
  const color = tone === "primary" ? "text-primary" : tone === "danger" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded bg-secondary/40 border border-border/50 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">{label}</div>
      <div className={`font-display stat-num text-lg leading-none ${color}`}>{value}</div>
    </div>
  );
}

// ---------- Club Legends (fluid, aligned) ----------
function ClubLegends({
  players,
  matches,
}: {
  players: import("@/lib/types").Player[];
  matches: import("@/lib/types").Match[];
}) {
  const boards = useMemo(() => {
    const aggs = players.map((p) => aggregatePlayer(p, matches)).filter((a) => a.matches > 0);
    const top = (key: "matches" | "goals" | "assists") =>
      [...aggs]
        .sort((a, b) => (b[key] as number) - (a[key] as number) || b.matches - a.matches)
        .slice(0, 5);
    return { apps: top("matches"), goals: top("goals"), assists: top("assists") };
  }, [players, matches]);

  if (boards.apps.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl tracking-wider mb-1 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" /> Club Legends
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        All-time leaderboards for the loyalists, the scorers and the creators.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <LegendBoard
          title="Appearances"
          unit="apps"
          accent="primary"
          icon={<Users className="h-4 w-4" />}
          rows={boards.apps.map((a) => ({
            id: a.player.id,
            name: a.player.name,
            value: a.matches,
            sub: `${a.wins}W · ${a.matches - a.wins}L`,
          }))}
        />
        <LegendBoard
          title="Goals"
          unit="goals"
          accent="accent"
          icon={<SoccerBall size={16} />}
          rows={boards.goals.map((a) => ({
            id: a.player.id,
            name: a.player.name,
            value: a.goals,
            sub: `${a.matches} apps`,
          }))}
        />
        <LegendBoard
          title="Assists"
          unit="assists"
          accent="amber"
          icon={<SoccerBoot size={16} />}
          rows={boards.assists.map((a) => ({
            id: a.player.id,
            name: a.player.name,
            value: a.assists,
            sub: `${a.matches} apps`,
          }))}
        />
      </div>
    </section>
  );
}

interface LegendRow {
  id: string;
  name: string;
  value: number;
  sub: string;
}

function LegendBoard({
  title,
  unit,
  icon,
  rows,
  accent,
}: {
  title: string;
  unit: string;
  icon: React.ReactNode;
  rows: LegendRow[];
  accent: "primary" | "accent" | "amber";
}) {
  const heroColor =
    accent === "primary" ? "text-primary" : accent === "accent" ? "text-accent" : "text-amber-300";
  const bar =
    accent === "primary" ? "bg-primary" : accent === "accent" ? "bg-accent" : "bg-amber-400";
  const border =
    accent === "primary"
      ? "border-t-primary/70"
      : accent === "accent"
        ? "border-t-accent/70"
        : "border-t-amber-400/70";
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0) || 1;
  const hero = rows[0];
  const rest = rows.slice(1);
  return (
    <div className={`surface-card border-t-2 ${border} p-4 flex flex-col`}>
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold flex items-center gap-1.5">
        <span className={heroColor}>{icon}</span> {title}
      </div>

      {/* Hero */}
      {hero && (
        <div className="mt-3 pb-3 border-b border-border/50">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className={`font-display stat-num text-4xl leading-none ${heroColor} shrink-0`}>
              {hero.value}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
              {unit}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 min-w-0">
            <span className={`text-[10px] font-mono font-bold ${heroColor} shrink-0`}>#1</span>
            <span className="font-display text-sm truncate flex-1 min-w-0">{hero.name}</span>
            <span className="text-[10px] text-muted-foreground font-mono shrink-0">{hero.sub}</span>
          </div>
        </div>
      )}

      {/* Rest */}
      <ol className="mt-3 space-y-2 flex-1">
        {rest.map((r, i) => {
          const pct = (r.value / max) * 100;
          const rank = i + 2;
          return (
            <li key={r.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 text-center font-mono font-bold text-muted-foreground text-[11px] shrink-0">
                  #{rank}
                </span>
                <span className="font-semibold text-sm truncate flex-1 min-w-0">{r.name}</span>
                <span className="font-mono stat-num text-sm shrink-0 tabular-nums">{r.value}</span>
              </div>
              <div className="flex items-center gap-2 pl-7">
                <div className="h-1 flex-1 bg-secondary/60 rounded overflow-hidden">
                  <div className={`h-full ${bar} opacity-70`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono shrink-0">{r.sub}</span>
              </div>
            </li>
          );
        })}
        {rest.length === 0 && (
          <li className="text-[11px] text-muted-foreground text-center py-2">
            Only one qualifying player yet.
          </li>
        )}
      </ol>
    </div>
  );
}

