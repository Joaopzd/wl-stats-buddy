import { useEffect, useState } from "react";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

const PENDING_KEY = "fc26_pending_anon_migration";

/** Tracks current session and renders sign-in / sign-out control. */
export function AuthButton() {
  const [email, setEmail] = useState<string | null>(null);
  const [isAnon, setIsAnon] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
      setIsAnon(!!data.user?.is_anonymous);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
      setIsAnon(!!session?.user?.is_anonymous);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const signIn = async () => {
    setLoading(true);
    try {
      // Remember the current anonymous id so we can migrate its data after redirect.
      const { data } = await supabase.auth.getUser();
      if (data.user?.is_anonymous) {
        localStorage.setItem(PENDING_KEY, data.user.id);
      }
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Falha ao entrar: " + (result.error as Error).message);
        localStorage.removeItem(PENDING_KEY);
      }
      // If redirected, the browser will navigate away.
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(PENDING_KEY);
    window.location.reload();
  };

  if (isAnon) {
    return (
      <button
        type="button"
        onClick={signIn}
        disabled={loading}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border/60 text-xs font-semibold uppercase tracking-wide text-foreground hover:bg-secondary/60 transition disabled:opacity-50"
        title="Entre com Google para salvar seus dados na nuvem"
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">Entrar com Google</span>
        <span className="sm:hidden">Entrar</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground max-w-[160px] truncate">
        <UserIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{email ?? "Conta"}</span>
      </div>
      <button
        type="button"
        onClick={signOut}
        className="h-9 w-9 grid place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
        title="Sair"
        aria-label="Sair"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export const PENDING_ANON_MIGRATION_KEY = PENDING_KEY;
