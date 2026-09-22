// scripts/seed-fc27-ratings.ts
//
// Importa o dataset do Kaggle (EA FC 27) para a tabela public.fc27_ratings.
//
// COMO USAR:
// 1. Baixe o CSV do dataset no Kaggle e salve em: data/fc27-players.csv
// 2. Instale a lib de parsing de CSV:      bun add -d csv-parse
// 3. Defina as env vars (nunca comite a service role key):
//      SUPABASE_URL=...
//      SUPABASE_SERVICE_ROLE_KEY=...   (pegue em Supabase > Project Settings > API)
// 4. Rode:  bun run scripts/seed-fc27-ratings.ts
//
// IMPORTANTE: os nomes das colunas do CSV variam de dataset pra dataset no Kaggle.
// Depois de baixar o seu, abra o CSV e confira o cabeçalho — ajuste o COLUMN_MAP abaixo
// se os nomes forem diferentes (ex: "overall" pode vir como "OVR" ou "overall_rating").

import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import type { Database } from "../src/integrations/supabase/types";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar o script."
  );
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY);

// Ajuste estes nomes para bater com o cabeçalho real do seu CSV do Kaggle.
const COLUMN_MAP = {
  id: "player_id",
  name: "short_name",
  club: "club_name",
  league: "league_name",
  nationality: "nationality_name",
  position: "player_positions",
  overall: "overall",
  pace: "pace",
  shooting: "shooting",
  passing: "passing",
  dribbling: "dribbling",
  defending: "defending",
  physical: "physic",
  skill_moves: "skill_moves",
  weak_foot: "weak_foot",
  preferred_foot: "preferred_foot",
  height_cm: "height_cm",
  age: "age",
  image_url: "player_face_url",
} as const;

function toInt(v: string | undefined): number | null {
  if (v === undefined || v === "") return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

async function main() {
  const csv = readFileSync("data/fc27-players.csv", "utf-8");
  const rows: Record<string, string>[] = parse(csv, {
    columns: true,
    skip_empty_lines: true,
  });

  const batchSize = 500;
  let sent = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows
      .slice(i, i + batchSize)
      .map((row) => ({
        id: toInt(row[COLUMN_MAP.id]),
        name: row[COLUMN_MAP.name],
        club: row[COLUMN_MAP.club] || null,
        league: row[COLUMN_MAP.league] || null,
        nationality: row[COLUMN_MAP.nationality] || null,
        // Pega só a posição principal (o dataset costuma listar "ST, CF" etc.)
        position: row[COLUMN_MAP.position]?.split(",")[0]?.trim() ?? "ST",
        overall: toInt(row[COLUMN_MAP.overall]),
        pace: toInt(row[COLUMN_MAP.pace]),
        shooting: toInt(row[COLUMN_MAP.shooting]),
        passing: toInt(row[COLUMN_MAP.passing]),
        dribbling: toInt(row[COLUMN_MAP.dribbling]),
        defending: toInt(row[COLUMN_MAP.defending]),
        physical: toInt(row[COLUMN_MAP.physical]),
        skill_moves: toInt(row[COLUMN_MAP.skill_moves]),
        weak_foot: toInt(row[COLUMN_MAP.weak_foot]),
        preferred_foot: row[COLUMN_MAP.preferred_foot] || null,
        height_cm: toInt(row[COLUMN_MAP.height_cm]),
        age: toInt(row[COLUMN_MAP.age]),
        image_url: row[COLUMN_MAP.image_url] || null,
      }))
      .filter((r) => r.id !== null && r.name && r.overall !== null);

    const { error } = await supabase
      .from("fc27_ratings")
      .upsert(batch, { onConflict: "id" });

    if (error) {
      console.error(`Lote ${i}-${i + batchSize} falhou:`, error.message);
      continue;
    }
    sent += batch.length;
    console.log(`Importados ${sent}/${rows.length}`);
  }

  console.log("Concluído.");
}

main();
