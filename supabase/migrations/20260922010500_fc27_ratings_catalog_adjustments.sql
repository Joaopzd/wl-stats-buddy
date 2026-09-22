-- Ajustes na tabela public.fc27_ratings criada em 20260922000000_add_fc27_ratings_catalog.sql.
-- Não mexe em dados existentes: só adiciona colunas e remove a coluna "age" (idade fixa),
-- que fica desatualizada com o tempo. A idade passa a ser calculada em cima de birthdate.

alter table public.fc27_ratings
  add column if not exists birthdate date,
  add column if not exists gender text,
  add column if not exists edition text not null default 'fc27',
  add column if not exists snapshot_date date;

alter table public.fc27_ratings
  drop column if exists age;

comment on column public.fc27_ratings.image_url is
  'O dataset EA FC 27 não traz imagens de jogador. Fica NULL até termos outra fonte; '
  'a UI deve ter um fallback (posição + iniciais/badge) para quando estiver vazio.';

comment on column public.fc27_ratings.birthdate is
  'Nascimento vindo do dataset. Calcule a idade em tempo de exibição '
  '(ex: extract(year from age(current_date, birthdate))) em vez de guardar um número fixo.';

-- Permite re-rodar o seed de uma edição futura (fc28, fc29...) sem apagar o catálogo
-- da edição atual, se um dia você quiser manter as duas lado a lado.
create index if not exists fc27_ratings_edition_idx
  on public.fc27_ratings (edition);
