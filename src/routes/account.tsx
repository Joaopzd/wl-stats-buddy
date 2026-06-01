import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { CheckCircle2, LogIn, LogOut, ShieldCheck, User as UserIcon, Cloud, CloudOff } from "lucide-react";
import { toast } from "sonner";
import { PENDING_ANON_MIGRATION_KEY } from "@/components/AuthButton";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — WL Tracker" },
      { name: "description", content: "Your Google account and cloud sync status." },
    ],
  }),
  component: AccountPage,
});

const WELCOME_FLAG = "fc26_just_migrated";

function AccountPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isAnon, setIsAnon] = useState(true);
  const [justMigrated, setJustMigrated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setEmail(u?.email ?? null);
      setIsAnon(!!u?.is_anonymous);
      const meta = (u?.user_metadata ?? {}) as Record<string, unknown>;
      setName((meta.full_name as string) ?? (meta.name as string) ?? null);
      setAvatar((meta.avatar_url as string) ?? (meta.picture as string) ?? null);
    });
    if (typeof window !== "undefined" && sessionStorage.getItem(WELCOME_FLAG) === "1") {
      setJustMigrated(true);
      sessionStorage.removeItem(WELCOME_FLAG);
    }
  }, []);

  const signIn = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user?.is_anonymous) {
        localStorage.setItem(PENDING_ANON_MIGRATION_KEY, data.user.id);
      }
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/account",
      });
      if (result.error) {
        toast.error("Falha ao entrar: " + (result.error as Error).message);
        localStorage.removeItem(PENDING_ANON_MIGRATION_KEY);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(PENDING_ANON_MIGRATION_KEY);
    navigate({ to: "/" });
    setTimeout(() => window.location.reload(), 50);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-4xl tracking-wider">Conta</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Entre com Google para sincronizar seus dados na nuvem e nunca perdê-los ao trocar de navegador.
        </p>

        {justMigrated && !isAnon && (
          <div className="mt-6 surface-card p-5 border-l-4 border-l-primary flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Migração concluída</div>
              <div className="text-sm text-muted-foreground mt-1">
                Seus dados anônimos foram vinculados com sucesso à conta{" "}
                <span className="font-mono text-foreground">{email ?? "—"}</span>.
                A partir de agora, tudo será salvo na nuvem automaticamente.
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 surface-card p-6">
          {isAnon ? (
            <div className="text-center py-6">
              <CloudOff className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <div className="font-display text-xl tracking-wide">Sessão anônima</div>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Você está usando o app sem login. Seus dados ficam apenas neste navegador.
                Entre com Google para migrá-los para uma conta permanente.
              </p>
              <button
                type="button"
                onClick={signIn}
                disabled={loading}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm hover:opacity-90 transition disabled:opacity-50 shadow-[var(--shadow-neon)]"
              >
                <LogIn className="h-4 w-4" />
                Entrar com Google
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name ?? email ?? "Avatar"}
                    className="h-16 w-16 rounded-full border-2 border-primary/40 object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-secondary grid place-items-center">
                    <UserIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-display text-xl tracking-wide truncate">{name ?? "Conta Google"}</div>
                  <div className="text-sm text-muted-foreground truncate">{email}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-primary font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Autenticado via Google
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-border/60 grid sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Cloud className="h-4 w-4 text-primary" />
                  Dados sincronizados na nuvem
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Disponível em qualquer dispositivo
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <Link to="/" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">
                  ← Voltar ao Dashboard
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export const WELCOME_MIGRATED_FLAG = WELCOME_FLAG;
