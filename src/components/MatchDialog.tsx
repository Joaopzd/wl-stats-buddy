import { useState } from "react";
import { X, Minus, Plus, Zap, Flag as FlagIcon, AlertTriangle } from "lucide-react";
import { store } from "@/lib/store";
import type { Match, MatchPlayerStat, Platform, PenaltyWinner, Player, WeekendLeague } from "@/lib/types";
import { wlLabel } from "@/lib/types";
import { v4 as uuid } from "uuid";
import { toast } from "sonner";

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

  const startingIdSet = new Set(Object.values(wl.startingAssignments ?? {}));
  const [perfs, setPerfs] = useState<Record<string, MatchPlayerStat & { played: boolean }>>(() => {
    const init: Record<string, MatchPlayerStat & { played: boolean }> = {};
    for (const p of squad) {
      const existing = existingMatch?.performances.find((x) => x.playerId === p.id);
      const isStarter = startingIdSet.has(p.id);
      init[p.id] = existing
        ? { ...existing, rating: existing.rating ?? 0, played: true }
        : { playerId: p.id, goals: 0, assists: 0, rating: 0, played: isStarter };
    }
    return init;
  });

  const update = (id: string, patch: Partial<typeof perfs[string]>) => {
    setPerfs((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  };

  const save = () => {
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

    const flags = {
      extraTime,
      penalties,
      penaltyWinner: penalties ? penaltyWinner : undefined,
      rageQuit,
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

  const totalGoals = Object.values(perfs).filter(p => p.played).reduce((s, p) => s + p.goals, 0);
  const goalsMismatch = totalGoals !== scoreFor;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="surface-glow w-full max-w-3xl max-h-[90vh] flex flex-col p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl tracking-wider">{existingMatch ? `Edit Match ${existingMatch.index}` : `Match ${nextIndex} of 15`}</h2>
            <p className="text-xs text-muted-foreground mt-1">{wlLabel(wl)}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <ScoreInput label="You" value={scoreFor} onChange={setScoreFor} accent />
          <ScoreInput label="Opponent" value={scoreAgainst} onChange={setScoreAgainst} />
          <div>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">Platform</span>
            <div className="flex gap-1 bg-input border border-border rounded-md p-1">
              {PLATFORMS.map((p) => (
                <button key={p} type="button" onClick={() => setPlatform(p)} className={`flex-1 py-2 rounded text-xs font-semibold uppercase tracking-wider transition ${platform === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Match flags */}
        <div className="mb-5 surface-card p-3 space-y-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Match details</div>
          <div className="flex flex-wrap gap-2">
            <FlagToggle active={extraTime} onClick={() => setExtraTime((v) => !v)} icon={<Zap className="h-3.5 w-3.5" />} label="Extra Time" />
            <FlagToggle active={penalties} onClick={() => setPenalties((v) => !v)} icon={<FlagIcon className="h-3.5 w-3.5" />} label="Penalties" />
            <FlagToggle active={rageQuit} onClick={() => setRageQuit((v) => !v)} icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Rage Quit" />
          </div>
          {penalties && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">Shootout winner</div>
              <div className="flex gap-1 bg-input border border-border rounded-md p-1 max-w-xs">
                {(["us", "them"] as PenaltyWinner[]).map((w) => (
                  <button key={w} type="button" onClick={() => setPenaltyWinner(w)} className={`flex-1 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${penaltyWinner === w ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {w === "us" ? "We won" : "They won"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Player performances</div>
          {squad.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No squad. Add players to the squad first.</p>
          ) : (
            <div className="space-y-2">
              {[...squad]
                .sort((a, b) => Number(startingIdSet.has(b.id)) - Number(startingIdSet.has(a.id)))
                .map((p) => {
                const perf = perfs[p.id];
                const isStarter = startingIdSet.has(p.id);
                return (
                  <div key={p.id} className={`p-3 rounded-md border transition ${perf.played ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input type="checkbox" checked={perf.played} onChange={(e) => update(p.id, { played: e.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />
                        <span className="font-semibold truncate">{p.name}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">{p.position} · {p.overall}</span>
                        <span className={`text-[9px] uppercase tracking-wider font-bold shrink-0 px-1.5 py-0.5 rounded ${isStarter ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                          {isStarter ? "XI" : "Bench"}
                        </span>
                      </label>
                    </div>
                    {perf.played && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Stepper label="G" v={perf.goals} on={(v) => update(p.id, { goals: v })} accent />
                          <Stepper label="A" v={perf.assists} on={(v) => update(p.id, { assists: v })} />
                        </div>
                        <RatingInput value={perf.rating} onChange={(v) => update(p.id, { rating: v })} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {goalsMismatch && (
          <div className="mt-3 text-xs text-amber-400">⚠ Player goals total ({totalGoals}) doesn't match team score ({scoreFor}). You can still save.</div>
        )}

        <div className="flex gap-3 mt-5 pt-5 border-t border-border/60">
          <button onClick={save} className="flex-1 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm hover:opacity-90">
            {existingMatch ? "Save Changes" : "Log Match"}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-md border border-border text-muted-foreground hover:text-foreground text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ScoreInput({ label, value, onChange, accent }: { label: string; value: number; onChange: (v: number) => void; accent?: boolean }) {
  return (
    <div>
      <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5 text-center">{label}</span>
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

function Stepper({ label, v, on, accent }: { label: string; v: number; on: (v: number) => void; accent?: boolean }) {
  return (
    <div className="bg-background/60 border border-border/60 rounded-md p-1.5">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground text-center font-semibold">{label}</div>
      <div className="flex items-center justify-between gap-1 mt-1">
        <button type="button" onClick={() => on(Math.max(0, v - 1))} className="h-6 w-6 rounded text-muted-foreground hover:bg-secondary grid place-items-center"><Minus className="h-3 w-3" /></button>
        <span className={`stat-num font-semibold ${accent ? "text-primary" : ""}`}>{v}</span>
        <button type="button" onClick={() => on(v + 1)} className="h-6 w-6 rounded text-muted-foreground hover:bg-secondary grid place-items-center"><Plus className="h-3 w-3" /></button>
      </div>
    </div>
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

function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));
  const tone =
    value >= 8 ? "text-primary border-primary/60 bg-primary/10" :
    value >= 6 ? "text-foreground border-border bg-background/60" :
    value > 0 ? "text-destructive border-destructive/40 bg-destructive/5" :
    "text-muted-foreground border-border/60 bg-background/40";
  return (
    <div className={`flex items-center gap-3 rounded-md border p-2 ${tone}`}>
      <div className="text-[9px] uppercase tracking-[0.2em] font-semibold opacity-80">Match Rating</div>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        max={10}
        step={0.1}
        value={value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") return onChange(0);
          onChange(clamp(parseFloat(v) || 0));
        }}
        className="ml-auto w-20 h-9 bg-background/80 border border-border rounded text-center font-display text-lg outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-xs opacity-60">/ 10</span>
    </div>
  );
}
