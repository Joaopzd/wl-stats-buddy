import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { Toaster } from "sonner";

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
      { title: "WL Tracker — EA FC 26 Weekend League Stats" },
      { name: "description", content: "Track every Weekend League in EA FC 26: matches, squads, player stats, MVPs and end-of-WL reports." },
      { name: "theme-color", content: "#0a0e1a" },
      { property: "og:title", content: "WL Tracker — EA FC 26 Weekend League Stats" },
      { property: "og:description", content: "Track every Weekend League in EA FC 26: matches, squads, player stats, MVPs and end-of-WL reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "WL Tracker — EA FC 26 Weekend League Stats" },
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
  return (
    <>
      <Outlet />
      <Toaster theme="dark" position="top-right" richColors />
    </>
  );
}
