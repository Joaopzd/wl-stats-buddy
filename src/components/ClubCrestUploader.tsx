import { useRef } from "react";
import { Upload, Trash2 } from "lucide-react";
import { store, useClubCrest } from "@/lib/store";
import { ClubCrest } from "./ClubCrest";
import { toast } from "sonner";

/** Compact card to upload, replace, or remove the user's club crest. */
export function ClubCrestUploader() {
  const dataUrl = useClubCrest();
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please pick an image file");
      return;
    }
    if (file.size > 1_500_000) {
      toast.error("Image too large (max ~1.5 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      store.setClubCrest(result);
      toast.success("Club crest updated");
    };
    reader.onerror = () => toast.error("Failed to read image");
    reader.readAsDataURL(file);
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
