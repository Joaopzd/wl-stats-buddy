import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Upload, Trash2, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { THEMES, setTheme, useTheme, type ThemeKey } from "@/lib/theme";
import { store, useClubCrest, useClubName, useOpponentCrest, useOpponentName } from "@/lib/store";
import { ClubCrest } from "@/components/ClubCrest";
import { OpponentCrest } from "@/components/OpponentCrest";
import { compressImageToDataURL } from "@/lib/imageCompress";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — PitchSide" },
      { name: "description", content: "Configure your PitchSide theme, club profile, and opponent defaults." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const theme = useTheme();
  const opponentName = useOpponentName();
  const opponentCrest = useOpponentCrest();
  const clubName = useClubName();
  const clubCrest = useClubCrest();

  const [nameDraft, setNameDraft] = useState(opponentName);
  const [clubNameDraft, setClubNameDraft] = useState(clubName);
  const [crestPreview, setCrestPreview] = useState<string | null>(null);
  const [clubCrestPreview, setClubCrestPreview] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const clubFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setNameDraft(opponentName); }, [opponentName]);
  useEffect(() => { setClubNameDraft(clubName); }, [clubName]);

  const onPickFile = async (file: File) => {
    if (file.size > 10_000_000) { toast.error("Image too large (max ~10 MB)"); return; }
    try {
      const dataUrl = await compressImageToDataURL(file);
      setCrestPreview(dataUrl);
      toast.success("Preview loaded — confirm to save");
    } catch (e) {
      console.error("Crest upload failed", e);
      toast.error("Could not read this image. Try a PNG or JPG.");
    }
  };

  const saveCrestPreview = async () => {
    if (!crestPreview) return;
    try {
      await store.setOpponentCrest(crestPreview);
      setCrestPreview(null);
      toast.success("Opponent crest updated");
    } catch {}
  };

  const onPickClubFile = async (file: File) => {
    if (file.size > 10_000_000) { toast.error("Image too large (max ~10 MB)"); return; }
    try {
      const dataUrl = await compressImageToDataURL(file);
      setClubCrestPreview(dataUrl);
      toast.success("Preview loaded — confirm to save");
    } catch (e) {
      console.error("Club crest upload failed", e);
      toast.error("Could not read this image. Try a PNG or JPG.");
    }
  };

  const saveClubCrestPreview = async () => {
    if (!clubCrestPreview) return;
    try {
      await store.setClubCrest(clubCrestPreview);
      setClubCrestPreview(null);
      toast.success("Club crest updated · próximas WLs vão usar este escudo");
    } catch {}
  };

  const commitClubName = () => {
    const trimmed = clubNameDraft.trim();
    if (trimmed === clubName) return;
    store.setClubName(trimmed);
    toast.success("Active club name saved · próximas WLs vão usar este nome");
  };

  const commitName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) { setNameDraft(opponentName); return; }
    if (trimmed === opponentName) return;
    store.setOpponentName(trimmed);
    toast.success("Opponent name saved");
  };

  return (
    <AppShell>
      <h1 className="font-display text-3xl tracking-wider mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Theme Palette */}
        <section className="surface-card p-5">
          <h2 className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-4">
            Theme Palette
          </h2>
          <ul className="space-y-2">
            {(Object.keys(THEMES) as ThemeKey[]).map((k) => {
              const t = THEMES[k];
              const active = k === theme;
              return (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => setTheme(k)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                      active ? "bg-secondary/80 text-foreground ring-2 ring-primary/50" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="h-6 w-10 rounded border border-border/70 shrink-0 overflow-hidden flex"
                    >
                      {t.swatches.map((c, i) => (
                        <span key={i} className="flex-1" style={{ background: c }} />
                      ))}
                    </span>
                    <span className="flex-1 text-left min-w-0">
                      <span className="block font-semibold truncate leading-tight">{t.label}</span>
                      <span className="block text-[11px] text-muted-foreground truncate leading-tight">
                        {t.description}
                      </span>
                    </span>
                    {active && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Club & Opponents — grouped identity management */}
        <section className="surface-card p-5">
          <h2 className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-4">
            Club &amp; Opponents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Club Profile */}
            <div className="md:pr-6 md:border-r md:border-border/60">
              <h3 className="text-[11px] uppercase tracking-[0.25em] text-primary font-bold mb-4">
                Active Club Profile
              </h3>

          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
            Club Name
          </label>
          <input
            type="text"
            value={clubNameDraft}
            placeholder="My Club"
            onChange={(e) => setClubNameDraft(e.target.value)}
            onBlur={commitClubName}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            className="w-full h-10 px-3 rounded-md bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <div className="mt-4 flex items-center gap-4">
            {clubCrestPreview ? (
              <div className="relative">
                <div className="inline-grid place-items-center rounded-full overflow-hidden bg-background/60 border border-primary/70 shrink-0" style={{ width: 56, height: 56 }}>
                  <img src={clubCrestPreview} alt="Club crest preview" className="h-14 w-14 object-contain" draggable={false} />
                </div>
                <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-primary ring-2 ring-background" aria-hidden />
              </div>
            ) : (
              <ClubCrest size={56} />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Club Crest
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {clubCrestPreview ? "Preview ready — confirm to save" : clubCrest ? "Custom crest in use" : "No crest yet"}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => clubFileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider hover:opacity-90"
                >
                  <Upload className="h-3 w-3" /> {clubCrest ? "Replace" : "Upload"}
                </button>
                {clubCrestPreview && (
                  <>
                    <button
                      type="button"
                      onClick={saveClubCrestPreview}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-primary text-primary text-[11px] font-bold uppercase tracking-wider hover:bg-primary/10"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setClubCrestPreview(null)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border text-muted-foreground text-[11px] font-bold uppercase tracking-wider hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {clubCrest && !clubCrestPreview && (
                  <button
                    type="button"
                    onClick={async () => { await store.setClubCrest(null); toast.success("Crest removed"); }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border text-muted-foreground text-[11px] font-bold uppercase tracking-wider hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
          <input
            ref={clubFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickClubFile(f);
              e.target.value = "";
            }}
          />
          <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
            ⓘ Editar aqui cria automaticamente um novo perfil para próximas WLs. WLs antigas mantêm o perfil original (visível na aba Club).
          </p>
            </div>

            {/* Opponent Configuration */}
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.25em] text-primary font-bold mb-4">
                Opponent Configuration
              </h3>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                Opponent Name
              </label>
              <input
                type="text"
                value={nameDraft}
                placeholder="Challenger FC"
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                className="w-full h-10 px-3 rounded-md bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-4">
              {crestPreview ? (
                <div className="relative">
                  <div className="inline-grid place-items-center rounded-full overflow-hidden bg-background/60 border border-primary/70 shrink-0" style={{ width: 56, height: 56 }}>
                    <img src={crestPreview} alt="Opponent crest preview" className="h-14 w-14 object-contain" draggable={false} />
                  </div>
                  <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-primary ring-2 ring-background" aria-hidden />
                </div>
              ) : (
                <OpponentCrest size={56} />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Opponent Crest
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {crestPreview ? "Preview ready — confirm to save" : opponentCrest ? "Custom crest in use" : "Using default crest"}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider hover:opacity-90"
                  >
                    <Upload className="h-3 w-3" /> {opponentCrest ? "Replace" : "Upload"}
                  </button>
                  {crestPreview && (
                    <>
                      <button
                        type="button"
                        onClick={saveCrestPreview}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-primary text-primary text-[11px] font-bold uppercase tracking-wider hover:bg-primary/10"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setCrestPreview(null)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border text-muted-foreground text-[11px] font-bold uppercase tracking-wider hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {opponentCrest && !crestPreview && (
                    <button
                      type="button"
                      onClick={async () => { await store.setOpponentCrest(null); toast.success("Crest reset"); }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border text-muted-foreground text-[11px] font-bold uppercase tracking-wider hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" /> Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickFile(f);
              e.target.value = "";
            }}
          />
        </section>
      </div>
    </AppShell>
  );
}
