-- Função pra "Começar do zero": apaga todos os dados do usuário autenticado
-- nas tabelas do domínio (jogadores/cartas, weekend leagues, partidas, notas,
-- configurações). Roda como uma transação só, então ou apaga tudo ou nada.
--
-- Chamar do client com: await supabase.rpc('reset_my_data')
--
-- Não mexe no bucket de storage "crests" (escudos) — isso precisa ser limpo
-- à parte pelo client, com supabase.storage.from('crests').list(userId) e
-- .remove([...paths]), porque storage não participa da transação do Postgres.

create or replace function public.reset_my_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  delete from public.matches where user_id = uid;
  delete from public.weekend_leagues where user_id = uid;
  delete from public.player_lab_notes where user_id = uid;
  delete from public.players where user_id = uid;
  delete from public.settings where user_id = uid;
end;
$$;

-- Só usuários autenticados podem chamar, e só sobre os próprios dados
-- (a função já filtra por auth.uid() internamente).
revoke all on function public.reset_my_data() from public;
grant execute on function public.reset_my_data() to authenticated;
