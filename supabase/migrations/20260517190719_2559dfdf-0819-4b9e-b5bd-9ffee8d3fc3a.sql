
-- Fix function search_path
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Restrict listing: drop broad public SELECT; public bucket still allows
-- direct reads via /object/public URL. Owners can list their own folder.
drop policy if exists "crests_public_read" on storage.objects;

create policy "crests_owner_select" on storage.objects
  for select using (
    bucket_id = 'crests'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
