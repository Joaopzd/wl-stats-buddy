import { Gauge } from "lucide-react";
import type { DifficultyLabel } from "@/lib/difficulty";

const TONE: Record<DifficultyLabel, string> = {
  Tranquila: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  Moderada: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  Difícil: "bg-orange-500/15 text-orange-300 border-orange-500/40",
  Brutal: "bg-destructive/15 text-destructive border-destructive/40",
};

export function DifficultyBadge({ label, score }: { label: DifficultyLabel; score: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${TONE[label]}`}
      title={`Dificuldade estimada: ${score.toFixed(1)}/10`}
    >
      <Gauge className="h-3 w-3" /> {label} · {score.toFixed(1)}/10
    </span>
  );
}
