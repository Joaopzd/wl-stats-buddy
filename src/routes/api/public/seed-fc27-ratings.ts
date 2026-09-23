import { createFileRoute } from "@tanstack/react-router";
import { parse } from "csv-parse/sync";

const BATCH_SIZE = 500;
const BUCKET = "imports";
const FILE_PATH = "players.csv";

type CsvRow = Record<string, string | undefined>;

function secretsMatch(received: string | null, expected: string): boolean {
  if (!received || received.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= received.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

function toIntOrNull(value: string | undefined): number | null {
  if (value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export const Route = createFileRoute("/api/public/seed-fc27-ratings")({
  server: {
    handlers: {
      GET: async () => new Response("Use POST", { status: 405 }),
      POST: async ({ request }) => {
        const importSecret = process.env["IMPORT_SECRET"];
        if (
          !importSecret ||
          !secretsMatch(request.headers.get("x-import-secret"), importSecret)
        ) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const { data: file, error: downloadError } = await supabaseAdmin.storage
          .from(BUCKET)
          .download(FILE_PATH);

        if (downloadError || !file) {
          return Response.json(
            {
              error: `Não consegui baixar ${BUCKET}/${FILE_PATH}: ${downloadError?.message ?? "arquivo não encontrado"}`,
            },
            { status: 400 },
          );
        }

        const csvText = await file.text();
        const rows = parse(csvText, {
          columns: true,
          skip_empty_lines: true,
        }) as CsvRow[];

        const catalogRows = rows.map((row) => {
          const name = row.common_name?.trim()
            ? row.common_name.trim()
            : `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();

          return {
            id: Number(row.player_id),
            name,
            club: row.club || null,
            league: row.league || null,
            nationality: row.nationality || null,
            position: row.position ?? "",
            overall: Number(row.overall_rating),
            pace: toIntOrNull(row.pace),
            shooting: toIntOrNull(row.shooting),
            passing: toIntOrNull(row.passing),
            dribbling: toIntOrNull(row.dribbling),
            defending: toIntOrNull(row.defending),
            physical: toIntOrNull(row.physicality),
            skill_moves: toIntOrNull(row.skill_moves),
            weak_foot: toIntOrNull(row.weak_foot),
            preferred_foot: row.preferred_foot || null,
            height_cm: toIntOrNull(row.height_cm),
            birthdate: row.birthdate || null,
            gender: row.gender || null,
            edition: row.edition || "fc27",
            snapshot_date: row.snapshot_date || null,
          };
        });

        let imported = 0;
        for (let index = 0; index < catalogRows.length; index += BATCH_SIZE) {
          const batch = catalogRows.slice(index, index + BATCH_SIZE);
          const { error } = await supabaseAdmin
            .from("fc27_ratings")
            .upsert(batch, { onConflict: "id" });

          if (error) {
            return Response.json(
              { error: error.message, importedBeforeFailing: imported },
              { status: 500 },
            );
          }
          imported += batch.length;
        }

        return Response.json({ imported, total: catalogRows.length });
      },
    },
  },
});