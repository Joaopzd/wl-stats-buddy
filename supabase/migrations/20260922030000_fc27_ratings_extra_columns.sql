-- Completa o catálogo fc27_ratings com as colunas que faltavam pra cobrir
-- toda a lista de campos do dataset que o app agora vai usar.

alter table public.fc27_ratings
  add column if not exists common_name text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists alternate_positions text,
  add column if not exists weight_kg smallint,
  add column if not exists playstyles text;

-- Busca por apelido (ex: "CR7") também deve encontrar o jogador, não só pelo
-- nome completo já indexado em fc27_ratings_name_idx.
create index if not exists fc27_ratings_common_name_idx
  on public.fc27_ratings using gin (to_tsvector('simple', coalesce(common_name, '')));
