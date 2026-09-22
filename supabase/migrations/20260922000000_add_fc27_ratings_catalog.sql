-- Catálogo público de ratings/atributos oficiais do FC 27 (importado do dataset do Kaggle).
-- É referência: fica separado da tabela "players" (que continua sendo os SEUS jogadores/cartas).
-- Somente leitura para os usuários do app; a escrita acontece só pelo script de seed
-- (rodado localmente com a service role key, nunca pelo cliente).

create table if not exists public.fc27_ratings (
  id bigint primary key,
  name text not null,
  club text,
  league text,
  nationality text,
  position text not null,
  overall smallint not null,
  pace smallint,
  shooting smallint,
  passing smallint,
  dribbling smallint,
  defending smallint,
  physical smallint,
  skill_moves smallint,
  weak_foot smallint,
  preferred_foot text,
  height_cm smallint,
  age smallint,
  image_url text,
  updated_at timestamptz not null default now()
);

-- Busca por nome (autocomplete) e filtro por posição rápidos.
create index if not exists fc27_ratings_name_idx
  on public.fc27_ratings using gin (to_tsvector('simple', name));
create index if not exists fc27_ratings_position_idx
  on public.fc27_ratings (position);

alter table public.fc27_ratings enable row level security;

-- Qualquer usuário (logado ou não) pode LER o catálogo — é dado público do jogo, não dado do usuário.
create policy "Anyone can read the FC27 ratings catalog"
  on public.fc27_ratings
  for select
  using (true);

-- Sem policies de insert/update/delete: só a service role (usada no script de seed) escreve aqui.
