
DROP POLICY IF EXISTS crests_owner_select ON storage.objects;
DROP POLICY IF EXISTS crests_owner_update ON storage.objects;
DROP POLICY IF EXISTS crests_owner_delete ON storage.objects;

CREATE POLICY crests_owner_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'crests' AND owner = auth.uid());

CREATE POLICY crests_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'crests' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'crests' AND owner = auth.uid());

CREATE POLICY crests_owner_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'crests' AND owner = auth.uid());
