import { AlertTriangle } from "lucide-react";

const TIPS = [
  "🥤 Beba uma água. Hidratação é foco.",
  "🧘 Vá descansar um pouco. O cérebro precisa de um reset.",
  "📊 Repense a estratégia. Talvez seja hora de mudar a formação?",
  "🌐 Já verificou se é o delay? Teste sua conexão antes da próxima.",
];

/** Modal triggered after 2 consecutive losses in a WL session. */
export function LossStreakAlert({ onClose }: { onClose: () => void }) {
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
  return (
    <div
      className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="loss-streak-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg border-2 border-primary/60 bg-card p-6 text-center"
        style={{
          boxShadow:
            "0 0 0 1px color-mix(in oklab, var(--primary) 30%, transparent), 0 0 40px -8px var(--primary)",
        }}
      >
        <div
          className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border border-primary/50 bg-primary/10"
          style={{ boxShadow: "0 0 18px -4px var(--primary)" }}
        >
          <AlertTriangle className="h-6 w-6 text-primary" />
        </div>
        <h3
          id="loss-streak-title"
          className="font-display text-2xl tracking-wider text-foreground"
        >
          Time to Refuel?
        </h3>
        <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-primary font-bold">
          Two losses in a row
        </p>
        <p className="mt-4 text-sm text-foreground/90 leading-relaxed">{tip}</p>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-md bg-primary text-primary-foreground py-2.5 font-semibold uppercase tracking-wider text-sm hover:opacity-90 shadow-[var(--shadow-neon)]"
        >
          Got it, Coach
        </button>
      </div>
    </div>
  );
}
