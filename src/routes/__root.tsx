import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { Toaster, toast } from "sonner";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { store } from "@/lib/store";
import { migrateLocalToCloud } from "@/lib/migrate";
import { migrateAnonymousUser } from "@/lib/migrateUser.functions";
import { PENDING_ANON_MIGRATION_KEY } from "@/components/AuthButton";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl text-gradient-primary">404</h1>
        <h2 className="mt-4 font-display text-2xl tracking-wider">OFFSIDE</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn't exist. Get back on the pitch.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PitchSide — EA FC 26 Weekend League Stats" },
      { name: "description", content: "Track every Weekend League in EA FC 26: matches, squads, player stats, MVPs and end-of-WL reports." },
      { name: "theme-color", content: "#0a0e1a" },
      { property: "og:title", content: "PitchSide — EA FC 26 Weekend League Stats" },
      { property: "og:description", content: "Track every Weekend League in EA FC 26: matches, squads, player stats, MVPs and end-of-WL reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "PitchSide — EA FC 26 Weekend League Stats" },
      { name: "twitter:description", content: "Track every Weekend League in EA FC 26: matches, squads, player stats, MVPs and end-of-WL reports." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/906333c1-8073-45d9-b196-ebf9938f53b9/id-preview-29569b80--dadaea62-a6d0-4d3c-a6a4-47862d49bf26.lovable.app-1776711358923.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/906333c1-8073-45d9-b196-ebf9938f53b9/id-preview-29569b80--dadaea62-a6d0-4d3c-a6a4-47862d49bf26.lovable.app-1776711358923.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
          session = data.session;
        }
        if (cancelled || !session?.user) return;
        const uid = session.user.id;

        // If returning from Google sign-in with a pending anon migration, run it first.
        const pendingAnon = typeof window !== "undefined"
          ? localStorage.getItem(PENDING_ANON_MIGRATION_KEY)
          : null;
        if (pendingAnon && !session.user.is_anonymous && pendingAnon !== uid) {
          try {
            const res = await migrateAnonymousUser({
              data: { anonUserId: pendingAnon, accessToken: session.access_token },
            });
            if (res.migrated) {
              toast.success("Conta vinculada — seus dados foram migrados para sua conta Google.");
              if (typeof window !== "undefined") {
                sessionStorage.setItem("fc26_just_migrated", "1");
                if (!window.location.pathname.startsWith("/account")) {
                  window.history.replaceState(null, "", "/account");
                }
              }
            }
          } catch (e) {
            toast.error("Falha ao migrar dados anônimos: " + (e instanceof Error ? e.message : String(e)));
          } finally {
            localStorage.removeItem(PENDING_ANON_MIGRATION_KEY);
          }
        }

        await store.init(uid);
        try {
          const res = await migrateLocalToCloud(uid);
          if (res.migrated && res.counts) {
            const { players, wls, matches } = res.counts;
            toast.success(`Dados migrados para a nuvem (${players} jogadores, ${wls} WLs, ${matches} partidas)`);
            await store.init(uid); // reload fresh from cloud
          }
        } catch (e) {
          toast.error("Falha na migração: " + (e instanceof Error ? e.message : String(e)));
        }

        // React to future sign-in/out events.
        supabase.auth.onAuthStateChange(async (_evt, s) => {
          if (s?.user && s.user.id !== store.getUserId()) {
            await store.init(s.user.id);
          }
        });
      } catch (e) {
        toast.error("Falha ao conectar: " + (e instanceof Error ? e.message : String(e)));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <Outlet />
      <Toaster theme="dark" position="top-right" richColors />
    </>
  );
}
