import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Eye, Pencil, Sparkles } from "lucide-react";
import { FORMATIONS } from "@/lib/formations";
import { store } from "@/lib/store";
import type { Player, WeekendLeague, WLTactics, BuildUpStyle, PlayerTactics } from "@/lib/types";
import {
  BUILD_UP_STYLES,
  DEFAULT_TACTICS,
  ROLE_SPECS,
  defaultPlayerTactics,
  defensiveApproachLabel,
  roleGroupFor,
} from "@/lib/tactics";
import { PositionBadge } from "./PositionBadge";

const ACCENT_BLUE = "var(--primary)";
const ACCENT_GREEN = "var(--primary)";



export function TacticsDialog({
  wl,
  players,
  open,
  onClose,
}: {
  wl: WeekendLeague;
  players: Player[];
  open: boolean;
  onClose: () => void;
}) {
  const tactics: WLTactics = useMemo(
    () => ({
      ...DEFAULT_TACTICS,
      ...(wl.tactics ?? {}),
      playerRoles: { ...(wl.tactics?.playerRoles ?? {}) },
    }),
    [wl.tactics],
  );

  const update = (patch: Partial<WLTactics>) => {
    store.updateWL(wl.id, { tactics: { ...tactics, ...patch } });
  };

  const updateRole = (playerId: string, pt: PlayerTactics) => {
    store.updateWL(wl.id, {
      tactics: {
        ...tactics,
        playerRoles: { ...tactics.playerRoles, [playerId]: pt },
      },
    });
  };

  const [editSummary, setEditSummary] = useState(false);
  const [editInfo, setEditInfo] = useState(false);
  const [editRoles, setEditRoles] = useState(false);
  const [pickingPlayerId, setPickingPlayerId] = useState<string | null>(null);

  const formation = wl.formation;
  const assignments = wl.startingAssignments ?? {};
  const slots = formation ? FORMATIONS[formation].slots : [];
  const playersById = new Map(players.map((p) => [p.id, p]));

  const resolveTactics = (player: Player): PlayerTactics => {
    return tactics.playerRoles[player.id] ?? defaultPlayerTactics(player.position);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 bg-[#FAFAF7] text-zinc-900 border-zinc-200">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 font-display tracking-wider text-zinc-900">
            <Sparkles className="h-5 w-5" style={{ color: ACCENT_BLUE }} />
            Tactics — {wl.customName || `WL #${wl.number}`}
          </DialogTitle>
        </DialogHeader>

        {!formation ? (
          <div className="p-10 text-center text-sm text-zinc-600">
            Pick a formation in <span className="font-semibold">Edit Squad</span> first to configure tactics.
          </div>
        ) : (
          <Tabs defaultValue="summary" className="px-6 pb-6">
            <TabsList className="grid w-full grid-cols-3 bg-zinc-200/60">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="info">Tactical Information</TabsTrigger>
              <TabsTrigger value="roles">Player Roles</TabsTrigger>
            </TabsList>

            {/* ============ SUMMARY ============ */}
            <TabsContent value="summary" className="mt-4">
              <ModeToggle edit={editSummary} setEdit={setEditSummary} />
              <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 mt-3">
                <Pitch
                  slots={slots}
                  labelFor={(slotId) => {
                    const pid = assignments[slotId];
                    const p = pid ? playersById.get(pid) : null;
                    if (!p) return { name: "—", sub: "Empty" };
                    const t = resolveTactics(p);
                    const last = p.name.split(" ").slice(-1)[0];
                    return { name: last, sub: `${t.role} · ${t.focus}`, position: p.position };
                  }}
                />
                <div className="space-y-3">
                  <InfoCard label="Build Up Style" value={tactics.buildUpStyle} accent={ACCENT_BLUE} />
                  <InfoCard
                    label="Defensive Approach"
                    value={`${defensiveApproachLabel(tactics.defensiveApproach).label} (${tactics.defensiveApproach})`}
                    accent={defensiveApproachLabel(tactics.defensiveApproach).color}
                  />
                  <div className="rounded-lg bg-white border border-zinc-200 p-4">
                    <div className="text-[11px] uppercase tracking-[0.25em] text-zinc-500 font-bold mb-2">Formation</div>
                    <div className="font-display text-2xl tracking-wider">{formation}</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ============ TACTICAL INFO ============ */}
            <TabsContent value="info" className="mt-4">
              <ModeToggle edit={editInfo} setEdit={setEditInfo} />
              <div className="space-y-6 mt-3">
                <section>
                  <h3 className="font-display tracking-wider text-sm mb-3 text-zinc-700 uppercase">Build Up Style</h3>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {BUILD_UP_STYLES.map((opt) => {
                      const Icon = opt.icon;
                      const active = tactics.buildUpStyle === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={!editInfo}
                          onClick={() => update({ buildUpStyle: opt.value as BuildUpStyle })}
                          className="rounded-lg border p-4 flex flex-col items-center gap-2 text-center transition-all duration-200 disabled:cursor-default"
                          style={{
                            backgroundColor: active ? ACCENT_BLUE : "#fff",
                            color: active ? "#fff" : "#27272a",
                            borderColor: active ? ACCENT_BLUE : "#e4e4e7",
                            opacity: !editInfo && !active ? 0.6 : 1,
                          }}
                        >
                          <Icon className="h-7 w-7" />
                          <div className="font-display tracking-wider">{opt.value}</div>
                          <div className="text-[11px] opacity-80">{opt.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h3 className="font-display tracking-wider text-sm mb-3 text-zinc-700 uppercase">Defensive Approach</h3>
                  {(() => {
                    const step = defensiveApproachLabel(tactics.defensiveApproach);
                    const Icon = step.icon;
                    return (
                      <div className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white font-semibold text-sm"
                            style={{ backgroundColor: step.color }}
                          >
                            <Icon className="h-4 w-4" />
                            {step.label}
                          </span>
                          <span className="font-display stat-num text-2xl">{tactics.defensiveApproach}</span>
                        </div>
                        <Slider
                          min={1}
                          max={100}
                          step={1}
                          disabled={!editInfo}
                          value={[tactics.defensiveApproach]}
                          onValueChange={(v) => update({ defensiveApproach: v[0] })}
                        />
                        <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                          <span>Deep-Lying</span>
                          <span>Balance</span>
                          <span>High Press</span>
                          <span>Aggressive</span>
                        </div>
                      </div>
                    );
                  })()}
                </section>
              </div>
            </TabsContent>

            {/* ============ PLAYER ROLES ============ */}
            <TabsContent value="roles" className="mt-4">
              <ModeToggle edit={editRoles} setEdit={setEditRoles} />
              <div className="mt-3">
                <Pitch
                  slots={slots}
                  onSelect={editRoles ? (slotId) => {
                    const pid = assignments[slotId];
                    if (pid) setPickingPlayerId(pid);
                  } : undefined}
                  labelFor={(slotId) => {
                    const pid = assignments[slotId];
                    const p = pid ? playersById.get(pid) : null;
                    if (!p) return { name: "—", sub: "Empty" };
                    const t = resolveTactics(p);
                    return { name: p.name.split(" ").slice(-1)[0], sub: `${t.role} · ${t.focus}`, position: p.position };
                  }}
                />
                {editRoles && (
                  <p className="text-center text-xs text-zinc-500 mt-3">Click a player on the pitch to edit their role and focus.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Edit role sheet */}
        <RoleEditSheet
          player={pickingPlayerId ? playersById.get(pickingPlayerId) ?? null : null}
          tactics={pickingPlayerId ? resolveTactics(playersById.get(pickingPlayerId)!) : null}
          onChange={(pt) => pickingPlayerId && updateRole(pickingPlayerId, pt)}
          onClose={() => setPickingPlayerId(null)}
        />
      </DialogContent>
    </Dialog>
  );
}

function ModeToggle({ edit, setEdit }: { edit: boolean; setEdit: (v: boolean) => void }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => setEdit(!edit)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider border transition-all duration-200"
        style={{
          backgroundColor: edit ? ACCENT_GREEN : "#fff",
          color: edit ? "#fff" : "#27272a",
          borderColor: edit ? ACCENT_GREEN : "#d4d4d8",
        }}
      >
        {edit ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        {edit ? "Edit Mode" : "View Mode"}
      </button>
    </div>
  );
}

function InfoCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg bg-white border border-zinc-200 p-4">
      <div className="text-[11px] uppercase tracking-[0.25em] text-zinc-500 font-bold mb-1">{label}</div>
      <div className="font-display text-xl tracking-wider" style={{ color: accent }}>{value}</div>
    </div>
  );
}

function Pitch({
  slots,
  labelFor,
  onSelect,
}: {
  slots: { id: string; x: number; y: number; position: string }[];
  labelFor: (slotId: string) => { name: string; sub: string; position?: string };
  onSelect?: (slotId: string) => void;
}) {
  return (
    <div
      className="relative w-full rounded-xl border border-zinc-300 overflow-hidden"
      style={{
        aspectRatio: "3 / 4",
        background:
          "linear-gradient(180deg, #3d6b46 0%, #30503A 50%, #3d6b46 100%)",
        backgroundImage:
          "repeating-linear-gradient(180deg, rgba(255,255,255,0.04) 0 24px, transparent 24px 48px)",
      }}
    >
      {/* pitch markings */}
      <div className="absolute inset-2 border border-white/30 rounded-md" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/30" />
      <div className="absolute left-2 right-2 top-1/2 border-t border-white/30" />

      {slots.map((s) => {
        const info = labelFor(s.id);
        return (
          <button
            key={s.id}
            type="button"
            onClick={onSelect ? () => onSelect(s.id) : undefined}
            disabled={!onSelect}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-[22%] sm:w-[18%] flex flex-col items-center text-center ${onSelect ? "cursor-pointer hover:scale-105" : "cursor-default"} transition-transform`}
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
          >
            {info.position && (
              <PositionBadge position={info.position as never} className="mb-1 text-[9px] px-1 py-0" />
            )}
            <div
              className="w-full rounded-md bg-white/95 text-zinc-900 px-1 py-1 shadow-md"
              style={{ borderTop: `3px solid ${ACCENT_BLUE}` }}
            >
              <div className="font-display tracking-wider text-[11px] leading-tight truncate">{info.name}</div>
              <div className="text-[9px] text-zinc-600 leading-tight truncate">{info.sub}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function RoleEditSheet({
  player,
  tactics,
  onChange,
  onClose,
}: {
  player: Player | null;
  tactics: PlayerTactics | null;
  onChange: (pt: PlayerTactics) => void;
  onClose: () => void;
}) {
  if (!player || !tactics) {
    return (
      <Sheet open={false} onOpenChange={() => onClose()}>
        <SheetContent />
      </Sheet>
    );
  }
  const spec = ROLE_SPECS[roleGroupFor(player.position)];
  return (
    <Sheet open={!!player} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="bg-[#FAFAF7] text-zinc-900 border-zinc-200">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <PositionBadge position={player.position} />
            <span>{player.name}</span>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-zinc-500 font-bold mb-2">Role</div>
            <div className="flex flex-wrap gap-2">
              {spec.roles.map((r) => {
                const active = tactics.role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onChange({ ...tactics, role: r })}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition"
                    style={{
                      backgroundColor: active ? ACCENT_BLUE : "#fff",
                      color: active ? "#fff" : "#27272a",
                      borderColor: active ? ACCENT_BLUE : "#d4d4d8",
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-zinc-500 font-bold mb-2">Focus</div>
            <div className="flex flex-wrap gap-2">
              {spec.focuses.map((f) => {
                const active = tactics.focus === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => onChange({ ...tactics, focus: f })}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition"
                    style={{
                      backgroundColor: active ? ACCENT_GREEN : "#fff",
                      color: active ? "#fff" : "#27272a",
                      borderColor: active ? ACCENT_GREEN : "#d4d4d8",
                    }}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
