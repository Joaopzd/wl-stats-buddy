# Migração LocalStorage → Supabase (Lovable Cloud)

## 1. Habilitar Lovable Cloud
Provisiona Postgres + Auth + Storage. Sem alterações visíveis para você.

## 2. Schema (migration SQL)

Tabelas, todas com `user_id uuid not null default auth.uid()` e RLS `user_id = auth.uid()`:

- **players**: `id, user_id, name, ovr, position, rarity, card_image_path (storage path), created_at`
- **weekend_leagues**: `id, user_id, number, custom_name, formation, squad_player_ids uuid[], created_at`
- **matches**: `id, user_id, wl_id (fk), goals_for, goals_against, et, penalties, rage_quit, rating, played_at, opponent_name, player_stats jsonb` (gols/assists por jogador)
- **settings**: `user_id pk, club_name, club_crest_path, opponent_name, opponent_crest_path`

Bucket Storage **`crests`** (público) para cartas, escudos de clube e adversário. Path: `{user_id}/players/{playerId}.{ext}`, `{user_id}/club.{ext}`, `{user_id}/opponent.{ext}`. RLS permite ao dono escrever/deletar; leitura pública.

## 3. Auth anônimo automático
- Habilitar provider "Anonymous" no Supabase Auth.
- No bootstrap (`__root.tsx`): se não houver sessão, chamar `supabase.auth.signInAnonymously()`. Sessão persiste no `localStorage` do Supabase (chave dele), não nos nossos blobs.

## 4. Migração automática
Helper `migrateLocalToCloud()` roda 1× após login:
1. Lê `fc26_players_v4`, `fc26_wls_v4`, `fc26_matches_v4`, crests e nomes.
2. Para cada imagem base64: converte para Blob → upload no bucket → guarda o path.
3. Insert em lote nas tabelas.
4. Marca flag `fc26_migrated_v1` e remove as chaves antigas (libera quota).
5. Mostra toast: "Dados migrados para a nuvem".

## 5. Refator do store
Substituir `src/lib/store.ts` por hooks baseados em **TanStack Query** (já no projeto):
- `usePlayers()`, `useWLs()`, `useMatches()`, `useSettings()` → `useQuery` no Supabase.
- Mutations: `useAddPlayer`, `useUpdatePlayer`, `useDeletePlayer`, idem WL/match/settings — invalidam queries.
- Upload de imagem usa Supabase Storage; componentes recebem URL pública via `supabase.storage.from('crests').getPublicUrl(path)`.
- Compressão (`imageCompress.ts`) fica mais leve (até ~1MB, sem agressividade) já que não há mais limite de 5MB do browser.

## 6. Loading states
- Skeletons (`<Skeleton />` já existe) nas listas de jogadores, WLs e matches enquanto `isLoading`.
- `PlayerCard`, `OpponentCrest`, `ClubCrest` mostram skeleton enquanto a URL não chega.

## 7. Componentes afetados
Todos que usam `useWLs/usePlayers/useMatches/useClubCrest/useOpponentCrest/useClubName/useOpponentName` e os `store.add/update/delete*`:
- `src/routes/index.tsx`, `players.tsx`, `weekend-leagues.index.tsx`, `weekend-leagues.$wlId.tsx`, `rankings.tsx`, `club.tsx`
- `src/components/`: `SettingsMenu`, `ClubCrest`, `OpponentCrest`, `ClubCrestUploader`, `CrestPicker`, `MatchDialog`, `SquadDialog`, `PlayerDetailModal`, `MatchDetailModal`, `CoachBriefingDialog`, `BestXI`, `WLTrendsChart`, `LossStreakAlert`, `AICoach`, `RankBadge` consumers, etc.

Mantém a mesma API conceitual (mesmos nomes de hooks) — só ficam `async` e retornam `{ data, isLoading }`.

## Escopo / fora do escopo
- Mantém o visual atual; só adiciona skeletons.
- Sem multi-usuário/compartilhamento — sessão anônima por dispositivo. Se você limpar o navegador, perde acesso (posso adicionar export/login depois se quiser).

## Ordem de execução
1. Enable Cloud + migration SQL + bucket + RLS
2. Helpers: `supabaseStorage.ts`, `migrate.ts`, novo `store.ts` com queries
3. Refator componentes (lote por lote) + skeletons
4. Bootstrap anon-login + auto-migração no `__root.tsx`
5. Testar fluxo completo

Posso começar?