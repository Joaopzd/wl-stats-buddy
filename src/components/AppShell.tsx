import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Trophy, Users, Sparkles, Shield } from "lucide-react";
import { ClubCrest } from "./ClubCrest";
import { SettingsMenu } from "./SettingsMenu";
import { AuthButton } from "./AuthButton";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/weekend-leagues", label: "Weekend Leagues", icon: Trophy },
  { to: "/players", label: "Players", icon: Users },
  { to: "/rankings", label: "Club Legends", icon: Sparkles },
  { to: "/club", label: "Club", icon: Shield },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl bg-background/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative h-9 w-9 rounded-md grid place-items-center shadow-[var(--shadow-neon)] overflow-hidden">
              <ClubCrest size={36} className="!rounded-md !border-0 !bg-transparent" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-xl tracking-wider">WL TRACKER</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">EA FC 26</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => {
              const active = l.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(l.to);
              const Icon = l.icon;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`px-3.5 py-2 rounded-md text-sm font-semibold uppercase tracking-wide flex items-center gap-2 transition ${
                    active
                      ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_40%,transparent)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
          </nav>
            <SettingsMenu />
          </div>
        </div>
        <nav className="md:hidden flex items-center gap-1 px-3 pb-2 overflow-x-auto">
          {links.map((l) => {
            const active = l.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(l.to);
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 ${
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground bg-secondary/40"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {l.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-10">{children}</main>
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        Built for grinders · EA FC 26 Weekend League
      </footer>
    </div>
  );
}
