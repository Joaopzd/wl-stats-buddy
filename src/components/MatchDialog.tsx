import { useEffect, useRef, useState } from "react";
import { X, Zap, Flag as FlagIcon, AlertTriangle, ChevronDown, ChevronUp, Activity, Target, WifiOff, Signal } from "lucide-react";
import { PositionBadge } from "./PositionBadge";
import { store } from "@/lib/store";
import type { Match, MatchPlayerStat, MatchTactic, Platform, PenaltyWinner, Player, WeekendLeague } from "@/lib/types";
import { MATCH_TACTICS, wlLabel } from "@/lib/types";
import { v4 as uuid } from "uuid";
import { toast } from "sonner";
import { ClubCrest } from "./ClubCrest";
import { OpponentCrest } from "./OpponentCrest";
import { PLATFORM_BG, PLATFORM_FG } from "./PlatformBadge";
import { CREST_SIZE } from "@/lib/ui";

const PLATFORMS: Platform[] = ["PC", "PS5", "Xbox"];

export function MatchDialog({
  wl,
  squad,
  existingMatch,
  nextIndex,
  onClose,
}: {
  wl: WeekendLeague;
  squad: Player[];
  existingMatch: Match | null;
  nextIndex: number;
  onClose: () => void;
}) {
  const [scoreFor, setScoreFor] = useState<number>(existingMatch?.scoreFor ?? 0);
  const [scoreAgainst, setScoreAgainst] = useState<number>(existingMatch?.scoreAgainst ?? 0);
  const [platform, setPlatform] = useState<Platform>(existingMatch?.platform ?? "PS5");
  const [extraTime, setExtraTime] = useState<boolean>(existingMatch?.extraTime ?? false);
  const [penalties, setPenalties] = useState<boolean>(existingMatch?.penalties ?? false);
  const [penaltyWinner, setPenaltyWinner] = useState<PenaltyWinner>(existingMatch?.penaltyWinner ?? "us");
  const [rageQuit, setRageQuit] = useState<boolean>(existingMatch?.rageQuit ?? false);
  const [rageQuitBy, setRageQuitBy] = useState<"us" | "them">(existingMatch?.rageQuitBy ?? (existingMatch?.rageQuit ? "them" : "them"));
  const [tactics, setTactics] = useState<MatchTactic[]>(existingMatch?.tactics ?? []);
  const [possessionFor, setPossessionFor] = useState<number>(existingMatch?.possessionFor ?? 50);
  const [xgFor, setXgFor] = useState<number>(existingMatch?.xgFor ?? 0);
  const [xgAgainst, setXgAgainst] = useState<number>(existingMatch?.xgAgainst ?? 0);
  const [disconnect, setDisconnect] = useState<boolean>(existingMatch?.disconnect ?? false);
  // Minimized by default for a cleaner add-match flow; opens on demand.
  const [detailsOpen, setDetailsOpen] = useState<boolean>(
    !!(existingMatch && (existingMatch.extraTime || existingMatch.penalties || existingMatch.rageQuit || existingMatch.disconnect || (existingMatch.tactics?.length ?? 0) > 0 || existingMatch.possessionFor != null || (existingMatch.xgFor ?? 0) > 0 || (existingMatch.xgAgainst ?? 0) > 0)),
  );
  const toggleTactic = (t: MatchTactic) =>
    setTactics((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const startingIdSet = new Set(Object.values(wl.startingAssignments ?? {}));
  const [perfs, setPerfs] = useState<Record<string, MatchPlayerStat & { played: boolean }>>(() => {
    const init: Record<string, MatchPlayerStat & { played: boolean }> = {};
    for (const p of squad) {
      const existing = existingMatch?.performances.find((x) => x.playerId === p.id);
      const isStarter = startingIdSet.has(p.id);
      init[p.id] = existing
        ? {
            ...existing,
            rating: existing.rating ?? 0,
            // Legacy matches saved before role existed → infer from WL lineup.
            role: existing.role ?? (isStarter ? "starter" : "sub"),
            played: true,
          }
        : {
            playerId: p.id,
            goals: 0,
            assists: 0,
            rating: 0,
            role: isStarter ? "starter" : "sub",
            // When editing an existing match, only players with a saved
            // performance entry above are pre-checked. Without this, every
            // starter would silently re-select itself even if the user had
            // previously deselected them for that match.
            played: existingMatch ? false : isStarter,
          };
    }
    return init;
  });

  const update = (id: string, patch: Partial<typeof perfs[string]>) => {
    setPerfs((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  };


  const save = () => {
    if (disconnect) {
      // Auto-loss: no stats counted. We persist a 0–1 scoreline so it
      // counts as a loss in records, but performances/possession/xG are blank.
      const flags = {
        extraTime: false,
        penalties: false,
        penaltyWinner: undefined as PenaltyWinner | undefined,
        rageQuit: false,
        rageQuitBy: undefined as ("us" | "them") | undefined,
        mvpPlayerId: undefined,
        tactics: undefined,
        possessionFor: undefined as number | undefined,
        xgFor: undefined as number | undefined,
        xgAgainst: undefined as number | undefined,
        disconnect: true,
      };
      if (existingMatch) {
        store.updateMatch(existingMatch.id, { scoreFor: 0, scoreAgainst: 1, platform, performances: [], ...flags });
        toast.success(`Match ${existingMatch.index} marked as disconnect`);
      } else {
        const m: Match = {
          id: uuid(), wlId: wl.id, index: nextIndex,
          scoreFor: 0, scoreAgainst: 1, platform, performances: [],
          ...flags,
          createdAt: Date.now(),
        };
        store.addMatch(m);
        toast.success(`Match ${nextIndex} logged · DISCONNECT (auto-loss)`);
      }
      onClose();
      return;
    }
    if (scoreFor < 0 || scoreAgainst < 0) return toast.error("Scores can't be negative");
    if (penalties && scoreFor !== scoreAgainst) {
      return toast.error("If penalties were taken, the regulation score must be level");
    }
    if (!penalties && scoreFor === scoreAgainst) {
      return toast.error("WL has no draws — pick a winner or mark Penalties");
    }
    const performances = Object.values(perfs)
      .filter((p) => p.played)
      .map(({ played, ...rest }) => rest);

    const rated = performances.filter((p) => (p.rating ?? 0) > 0);
    const autoMvp = rated.length
      ? [...rated].sort(
          (a, b) =>
            (b.rating ?? 0) - (a.rating ?? 0) ||
            (b.goals + b.assists) - (a.goals + a.assists),
        )[0]
      : null;

    const flags = {
      extraTime,
      penalties,
      penaltyWinner: penalties ? penaltyWinner : undefined,
      rageQuit,
      rageQuitBy: rageQuit ? rageQuitBy : undefined,
      mvpPlayerId: autoMvp?.playerId,
      tactics: tactics.length ? tactics : undefined,
      possessionFor: Math.max(0, Math.min(100, Math.round(possessionFor))),
      xgFor: Math.max(0, Math.round(xgFor * 100) / 100),
      xgAgainst: Math.max(0, Math.round(xgAgainst * 100) / 100),
      disconnect: false,
    };

    if (existingMatch) {
      store.updateMatch(existingMatch.id, { scoreFor, scoreAgainst, platform, performances, ...flags });
      toast.success(`Match ${existingMatch.index} updated`);
    } else {
      const m: Match = {
        id: uuid(),
        wlId: wl.id,
        index: nextIndex,
        scoreFor, scoreAgainst, platform, performances,
        ...flags,
        createdAt: Date.now(),
      };
      store.addMatch(m);
      const isWin = penalties ? penaltyWinner === "us" : scoreFor > scoreAgainst;
      toast.success(`Match ${nextIndex} logged · ${isWin ? "WIN" : "LOSS"}`);
    }
    onClose();
  };

  // Alt+S to save the match while the dialog is open.
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);


  const totalGoals = Object.values(perfs).filter(p => p.played).reduce((s, p) => s + p.goals, 0);
  const goalsMismatch = totalGoals !== scoreFor;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full grid place-items-start sm:place-items-center p-2 sm:p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="surface-glow w-full max-w-3xl my-2 sm:my-4 flex flex-col rounded-lg overflow-hidden"
        >
          {/* Sticky header: title + score */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-5 sm:px-6 pt-5 pb-4 border-b border-border/60">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-2xl tracking-wider">
                  {existingMatch ? `Edit Match ${existingMatch.index}` : `Match ${nextIndex} of 15`}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">{wlLabel(wl)}</p>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Versus header: My crest · Score · Opponent crest */}
            <div className="surface-card p-3 flex items-center gap-3">
              <ClubCrest size={CREST_SIZE.dialog} overrideUrl={wl.clubCrestUrl} />
              <div className="flex-1 grid grid-cols-2 gap-3">
                <ScoreInput label="You" value={scoreFor} onChange={setScoreFor} accent />
                <ScoreInput label="Opponent" value={scoreAgainst} onChange={setScoreAgainst} />
              </div>
              <OpponentCrest size={CREST_SIZE.dialog} />
            </div>
          </div>

          {/* Body: page (modal) scrolls — no inner scroll on player list */}
          <div className="px-5 sm:px-6 pt-5">
            <div className="mb-4">
              <span className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">Platform</span>
              <div className="flex gap-1 bg-input border border-border rounded-md p-1">
                {PLATFORMS.map((p) => {
                  const isActive = platform === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition border ${isActive ? "border-black/20 shadow-inner" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                      style={isActive ? { backgroundColor: PLATFORM_BG[p], color: PLATFORM_FG[p] } : undefined}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Match flags — minimized by default */}
            <div className="mb-4 surface-card overflow-hidden">
              <button
                type="button"
                onClick={() => setDetailsOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-secondary/40 transition text-left"
                aria-expanded={detailsOpen}
              >
                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-2">
                  Match details
                  {(extraTime || penalties || rageQuit || disconnect || tactics.length > 0) && (
                    <span className="text-primary font-mono normal-case tracking-normal">
                      ·{extraTime ? " ET" : ""}{penalties ? " PEN" : ""}{rageQuit ? " RQ" : ""}{disconnect ? " DC" : ""}{tactics.length ? ` ${tactics.length}T` : ""}
                    </span>
                  )}
                </span>
                {detailsOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
              {detailsOpen && (
                <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/60">
                  <div className="flex flex-wrap gap-2">
                    <FlagToggle active={extraTime} onClick={() => setExtraTime((v) => !v)} icon={<Zap className="h-3.5 w-3.5" />} label="Extra Time" />
                    <FlagToggle active={penalties} onClick={() => setPenalties((v) => !v)} icon={<FlagIcon className="h-3.5 w-3.5" />} label="Penalties" />
                    <FlagToggle active={rageQuit} onClick={() => setRageQuit((v) => !v)} icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Rage Quit" />
                    <FlagToggle active={disconnect} onClick={() => setDisconnect((v) => !v)} icon={<WifiOff className="h-3.5 w-3.5" />} label="Disconnect" />
                  </div>
                  {disconnect && (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-[11px] text-destructive leading-snug">
                      Disconnect = auto-loss. Score, possession, xG and player stats will <strong>not</strong> be counted when saving.
                    </div>
                  )}

                  {penalties && (
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">Shootout winner</div>
                      <div className="flex gap-1 bg-input border border-border rounded-md p-1 max-w-xs">
                        {(["us", "them"] as PenaltyWinner[]).map((w) => (
                          <button key={w} type="button" onClick={() => setPenaltyWinner(w)} className={`flex-1 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${penaltyWinner === w ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                            {w === "us" ? "We won" : "They won"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {rageQuit && (
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">Who rage-quit</div>
                      <div className="flex gap-1 bg-input border border-border rounded-md p-1 max-w-xs">
                        {(["them", "us"] as const).map((w) => (
                          <button key={w} type="button" onClick={() => setRageQuitBy(w)} className={`flex-1 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${rageQuitBy === w ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                            {w === "us" ? "I quit" : "Opponent"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tactical notes — multi-select */}
                  <div className="pt-1">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5 flex items-center gap-1.5">
                      <ListChecks className="h-3 w-3" /> Tactical Notes
                      {tactics.length > 0 && (
                        <span className="text-primary font-mono normal-case tracking-normal">· {tactics.length} selected</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {MATCH_TACTICS.map((t) => {
                        const on = tactics.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTactic(t)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider transition border ${
                              on
                                ? "bg-primary/20 text-primary border-primary/60"
                                : "bg-background/40 text-muted-foreground border-border hover:text-foreground"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Possession & xG — collapsible */}
            <PossessionXgSection
              possessionFor={possessionFor}
              setPossessionFor={setPossessionFor}
              xgFor={xgFor}
              setXgFor={setXgFor}
              xgAgainst={xgAgainst}
              setXgAgainst={setXgAgainst}
              defaultOpen={!!(existingMatch && (existingMatch.possessionFor != null || (existingMatch.xgFor ?? 0) > 0 || (existingMatch.xgAgainst ?? 0) > 0))}
            />



            {/* Player performances — aligned columns, no inner scroll */}
            <div>
              <div className="grid grid-cols-[1.25rem_2.25rem_minmax(0,1fr)_2.25rem_2.25rem_2.75rem] items-center gap-2 px-2 pb-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                <span aria-hidden></span>
                <span aria-hidden></span>
                <span>Player</span>
                <span className="text-center">G</span>
                <span className="text-center">A</span>
                <span className="text-center">Rating</span>
              </div>
              {squad.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No squad. Add players to the squad first.</p>
              ) : (
                <div className="space-y-2.5">
                  {[...squad]
                    .sort((a, b) => Number(startingIdSet.has(b.id)) - Number(startingIdSet.has(a.id)))
                    .map((p) => {
                      const perf = perfs[p.id];
                      const isSub = perf.role === "sub";
                      return (
                        <div
                          key={p.id}
                          className={`grid grid-cols-[1.25rem_2.25rem_minmax(0,1fr)_2.25rem_2.25rem_2.75rem] items-center gap-2 px-2 py-3 rounded-md border transition ${
                            perf.played ? "border-primary/40 bg-primary/5" : "border-border bg-card"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={perf.played}
                            onChange={(e) => update(p.id, { played: e.target.checked })}
                            className="h-4 w-4 accent-[var(--primary)] justify-self-center"
                            aria-label={`Played: ${p.name}`}
                          />
                          <button
                            type="button"
                            onClick={() => update(p.id, { role: isSub ? "starter" : "sub" })}
                            disabled={!perf.played}
                            title={isSub ? "Came off the bench — click to mark as starter" : "Started the match — click to mark as substitute"}
                            className={`text-[11px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded text-center transition disabled:opacity-50 ${
                              isSub
                                ? "bg-accent/20 text-accent border border-accent/50 hover:bg-accent/30"
                                : "bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30"
                            }`}
                          >
                            {isSub ? "Sub" : "XI"}
                          </button>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate leading-tight">{p.name}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">{p.position} · {p.overall}</div>
                          </div>
                          <NumBox v={perf.goals} on={(v) => update(p.id, { goals: v })} disabled={!perf.played} accent />
                          <NumBox v={perf.assists} on={(v) => update(p.id, { assists: v })} disabled={!perf.played} />
                          <RatingBox v={perf.rating} on={(v) => update(p.id, { rating: v })} disabled={!perf.played} />
                        </div>
                      );
                    })}

                </div>
              )}
            </div>

            {goalsMismatch && (
              <div className="mt-3 text-xs text-amber-400">⚠ Player goals total ({totalGoals}) doesn't match team score ({scoreFor}). You can still save.</div>
            )}

            {/* Safe-area spacer so Save bar isn't flush against content */}
            <div className="h-6" />
          </div>

          {/* Sticky action bar */}
          <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm border-t border-border/60 px-5 sm:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex gap-3">
              <button onClick={save} title="Shortcut: Alt+S" className="flex-1 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm hover:opacity-90 inline-flex items-center justify-center gap-2">
                {existingMatch ? "Save Changes" : "Log Match"}
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono opacity-70 bg-black/20 rounded px-1.5 py-0.5">Alt+S</span>
              </button>
              <button onClick={onClose} className="px-5 py-2.5 rounded-md border border-border text-muted-foreground hover:text-foreground text-sm">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreInput({ label, value, onChange, accent }: { label: string; value: number; onChange: (v: number) => void; accent?: boolean }) {
  return (
    <div>
      <span className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5 text-center">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") return onChange(0);
          onChange(Math.max(0, parseInt(v) || 0));
        }}
        className={`w-full h-16 bg-input border border-border rounded-md text-center font-display text-4xl outline-none focus:border-primary focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${accent ? "text-primary" : ""}`}
      />
    </div>
  );
}

function NumBox({ v, on, disabled, accent }: { v: number; on: (v: number) => void; disabled?: boolean; accent?: boolean }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      value={v}
      disabled={disabled}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const val = e.target.value;
        if (val === "") return on(0);
        on(Math.max(0, parseInt(val) || 0));
      }}
      className={`w-full h-8 bg-background/80 border border-border rounded text-center stat-num text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${accent ? "text-primary" : ""}`}
    />
  );
}

function RatingBox({ v, on, disabled }: { v: number; on: (v: number) => void; disabled?: boolean }) {
  const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));
  const tone =
    disabled ? "text-muted-foreground border-border/60 bg-background/40" :
    v >= 8 ? "text-primary border-primary/60 bg-primary/10" :
    v >= 6 ? "text-foreground border-border bg-background/80" :
    v > 0 ? "text-destructive border-destructive/40 bg-destructive/5" :
    "text-muted-foreground border-border/60 bg-background/40";
  return (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      max={10}
      step={0.1}
      value={v}
      disabled={disabled}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const val = e.target.value;
        if (val === "") return on(0);
        on(clamp(parseFloat(val) || 0));
      }}
      className={`w-full h-8 rounded border text-center stat-num text-sm font-semibold outline-none focus:ring-1 focus:ring-primary disabled:opacity-30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${tone}`}
    />
  );
}

function FlagToggle({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition border ${
        active
          ? "bg-primary/20 text-primary border-primary/60"
          : "bg-background/40 text-muted-foreground border-border hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function XgInput({ label, icon, value, onChange, accent }: { label: string; icon: React.ReactNode; value: number; onChange: (v: number) => void; accent?: boolean }) {
  return (
    <div>
      <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5 flex items-center gap-1.5">
        {icon} {label}
      </span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={0.1}
        value={value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") return onChange(0);
          onChange(Math.max(0, parseFloat(v) || 0));
        }}
        className={`w-full h-10 bg-input border border-border rounded-md text-center stat-num text-lg font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${accent ? "text-primary" : ""}`}
      />
    </div>
  );
}

function PossessionXgSection({
  possessionFor, setPossessionFor, xgFor, setXgFor, xgAgainst, setXgAgainst, defaultOpen,
}: {
  possessionFor: number;
  setPossessionFor: (v: number) => void;
  xgFor: number;
  setXgFor: (v: number) => void;
  xgAgainst: number;
  setXgAgainst: (v: number) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const possYou = Math.max(0, Math.min(100, Math.round(possessionFor)));
  return (
    <div className="mb-4 surface-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-secondary/40 transition text-left"
        aria-expanded={open}
      >
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-2">
          <Activity className="h-3 w-3 text-primary" /> Possession & xG
          {(possYou !== 50 || xgFor > 0 || xgAgainst > 0) && (
            <span className="text-primary font-mono normal-case tracking-normal">
              · {possYou}% · xG {xgFor.toFixed(1)}–{xgAgainst.toFixed(1)}
            </span>
          )}
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-2 space-y-3 border-t border-border/60">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5 flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-primary" /> Possession (You) %
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                step={1}
                value={possYou}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") return setPossessionFor(0);
                  setPossessionFor(Math.max(0, Math.min(100, parseInt(v) || 0)));
                }}
                className="w-full h-10 bg-input border border-border rounded-md text-center stat-num text-lg font-semibold text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5 flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-muted-foreground" /> Opponent % (auto)
              </span>
              <div className="w-full h-10 bg-input/50 border border-border rounded-md text-center stat-num text-lg font-semibold text-muted-foreground grid place-items-center">
                {100 - possYou}%
              </div>
            </div>
          </div>
          <div className="h-1.5 rounded overflow-hidden bg-secondary/60 flex">
            <div className="bg-primary" style={{ width: `${possYou}%` }} />
            <div className="bg-destructive/60" style={{ width: `${100 - possYou}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <XgInput label="xG (You)" icon={<Target className="h-3 w-3 text-primary" />} value={xgFor} onChange={setXgFor} accent />
            <XgInput label="xG (Opponent)" icon={<Target className="h-3 w-3 text-muted-foreground" />} value={xgAgainst} onChange={setXgAgainst} />
          </div>
        </div>
      )}
    </div>
  );
}



