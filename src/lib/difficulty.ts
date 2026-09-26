import type { Match } from "@/lib/types";
import { matchIsWin } from "@/lib/stats";

export type DifficultyLabel = "Tranquila" | "Moderada" | "Difícil" | "Brutal";

export interface WLDifficulty {
  /** 0–10, uma casa decimal. */
  score: number;
  label: DifficultyLabel;
  perMatch: { matchId: string; score: number }[];
}

// Mesmo teto de vitórias usado pro rank Elite I em rankFromWins().
const MAX_RANK_WINS = 15;

// Pesos por prioridade combinada com você: adversário > placar > conexão.
const WEIGHTS = { opponent: 0.5, closeness: 0.3, connection: 0.2 };

function opponentQualityFactor(m: Match): number {
  const wins = m.opponentWins ?? 0;
  return Math.max(0, Math.min(1, wins / MAX_RANK_WINS));
}

function closenessFactor(m: Match): number {
  if (m.disconnect) return 1;
  if (!matchIsWin(m)) return 1; // qualquer derrota = máxima dificuldade nesse eixo
  if (m.extraTime || m.penalties) return 1; // empatou no tempo normal — foi apertado
  const margin = Math.max(1, m.scoreFor - m.scoreAgainst);
  return Math.max(0.1, 1 - (margin - 1) * 0.2);
}

function connectionFactor(m: Match): number {
  const c = m.connection ?? 5;
  return Math.max(0, Math.min(1, (5 - c) / 5));
}

export function matchDifficulty(m: Match): number {
  return (
    WEIGHTS.opponent * opponentQualityFactor(m) +
    WEIGHTS.closeness * closenessFactor(m) +
    WEIGHTS.connection * connectionFactor(m)
  );
}

export function wlDifficulty(matches: Match[]): WLDifficulty | null {
  if (matches.length === 0) return null;
  const perMatch = matches.map((m) => ({ matchId: m.id, score: matchDifficulty(m) }));
  const avg = perMatch.reduce((s, x) => s + x.score, 0) / perMatch.length;
  const label: DifficultyLabel =
    avg < 0.35 ? "Tranquila" : avg < 0.55 ? "Moderada" : avg < 0.75 ? "Difícil" : "Brutal";
  return { score: Math.round(avg * 100) / 10, label, perMatch };
}
