ALTER TABLE public.weekend_leagues ADD COLUMN session_type text NOT NULL DEFAULT 'WL';
ALTER TABLE public.matches ADD COLUMN session_type text NOT NULL DEFAULT 'WL';
CREATE INDEX idx_matches_session_type ON public.matches(user_id, session_type);
CREATE INDEX idx_wls_session_type ON public.weekend_leagues(user_id, session_type);

CREATE TABLE public.player_lab_notes (
  user_id uuid NOT NULL,
  player_id uuid NOT NULL,
  notes text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, player_id)
);

ALTER TABLE public.player_lab_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lab_notes_select_own" ON public.player_lab_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "lab_notes_insert_own" ON public.player_lab_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lab_notes_update_own" ON public.player_lab_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "lab_notes_delete_own" ON public.player_lab_notes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER touch_lab_notes_updated
  BEFORE UPDATE ON public.player_lab_notes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();