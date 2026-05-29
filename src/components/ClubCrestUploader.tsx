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

  const onPick = async (file: File) => {
    if (file.size > 10_000_000) {
      toast.error("Image too large (max ~10 MB)");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await compressImageToDataURL(file);
      store.setClubCrest(dataUrl);
      toast.success("Club crest updated");
    } catch (e) {
      console.error("Crest upload failed", e);
      toast.error(
        "Could not read this image. Try a PNG or JPG (HEIC from iPhone is not supported — convert it first).",
      );
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="surface-card p-4 flex items-center gap-4">
      <ClubCrest size={56} />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold">My Club Crest</div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate">
          {dataUrl ? "Custom crest in use" : "No crest uploaded — using placeholder"}
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:opacity-90"
          >
            <Upload className="h-3 w-3" /> {dataUrl ? "Replace" : "Upload"}
          </button>
          {dataUrl && (
            <button
              type="button"
              onClick={() => { store.setClubCrest(null); toast.success("Crest removed"); }}
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
