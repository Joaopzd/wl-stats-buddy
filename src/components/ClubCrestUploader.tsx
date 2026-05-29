import { useRef, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { store, useClubCrest } from "@/lib/store";
import { ClubCrest } from "./ClubCrest";
import { compressImageToDataURL } from "@/lib/imageCompress";
import { toast } from "sonner";

/** Compact card to upload, replace, or remove the user's club crest. */
export function ClubCrestUploader() {
  const dataUrl = useClubCrest();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const onPick = async (file: File) => {
    if (file.size > 10_000_000) {
      toast.error("Image too large (max ~10 MB)");
      return;
    }
    setBusy(true);
    try {
      const previewUrl = await compressImageToDataURL(file);
      setPreview(previewUrl);
      toast.success("Preview loaded — confirm to save");
    } catch (e) {
      console.error("Crest upload failed", e);
      toast.error(
        "Could not read this image. Try a PNG or JPG (HEIC from iPhone is not supported — convert it first).",
      );
    } finally {
      setBusy(false);
    }
  };

  const onSavePreview = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      await store.setClubCrest(preview);
      setPreview(null);
      toast.success("Club crest updated");
    } catch {
      // store already reports the detailed error and restores the previous crest.
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="surface-card p-4 flex items-center gap-4">
      {preview ? (
        <div className="relative">
          <div className="inline-grid place-items-center rounded-full overflow-hidden bg-background/60 border border-primary/70 shrink-0" style={{ width: 56, height: 56 }}>
            <img src={preview} alt="Selected crest preview" className="h-14 w-14 object-contain" draggable={false} />
          </div>
          <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-primary ring-2 ring-background" aria-hidden />
        </div>
      ) : (
        <ClubCrest size={56} />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold">My Club Crest</div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate">
          {preview ? "Preview ready — confirm to save" : dataUrl ? "Custom crest in use" : "No crest uploaded — using placeholder"}
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
          >
            <Upload className="h-3 w-3" /> {busy ? "Uploading…" : dataUrl ? "Replace" : "Upload"}
          </button>

          {preview && (
            <>
              <button
                type="button"
                onClick={onSavePreview}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-primary text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setPreview(null)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-muted-foreground text-[10px] font-bold uppercase tracking-wider hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}

          {dataUrl && !preview && (
            <button
              type="button"
              onClick={async () => { await store.setClubCrest(null); toast.success("Crest removed"); }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-muted-foreground text-[10px] font-bold uppercase tracking-wider hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
