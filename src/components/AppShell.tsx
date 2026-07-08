import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Trophy, Users, Sparkles, Shield } from "lucide-react";
import { useEffect, useRef } from "react";
import { SettingsMenu } from "./SettingsMenu";
import { AuthButton } from "./AuthButton";
import logoAsset from "@/assets/pitchside-logo.png.asset.json";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/weekend-leagues", label: "Weekend Leagues", icon: Trophy },
  { to: "/players", label: "Players", icon: Users },
  { to: "/rankings", label: "Club Legends", icon: Sparkles },
  { to: "/club", label: "Club", icon: Shield },
] as const;

function AppSidebar() {
  const loc = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <SidebarHeader className="border-b border-border/60">
        <Link
          to="/"
          className="flex items-center gap-2.5 px-1 py-1 group min-w-0"
        >
          <img
            src={logoAsset.url}
            alt="PitchSide logo"
            className="h-9 w-9 shrink-0 object-contain drop-shadow-[0_0_8px_rgba(247,197,52,0.35)]"
          />
          {!collapsed && (
            <div className="leading-tight min-w-0 transition-opacity duration-300">
              <div className="font-display text-sm tracking-wider font-bold truncate">
                PS: WL TRACKER
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground truncate">
                EA FC 26
              </div>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((l) => {
                const active =
                  l.to === "/"
                    ? loc.pathname === "/"
                    : loc.pathname.startsWith(l.to);
                const Icon = l.icon;
                return (
                  <SidebarMenuItem key={l.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={l.label}
                      className="transition-all duration-300 ease-in-out"
                    >
                      <Link to={l.to} className="flex items-center gap-3">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="font-semibold uppercase tracking-wide text-xs">
                          {l.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/60">
        <div
          className={`flex ${collapsed ? "flex-col" : "flex-row"} items-center gap-2`}
        >
          <AuthButton />
          <SettingsMenu />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => {
      document.documentElement.style.setProperty(
        "--app-header-h",
        `${el.offsetHeight}px`,
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-screen flex flex-col">
        <header
          ref={headerRef}
          className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl bg-background/70"
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 h-14 flex items-center gap-3">
            <SidebarTrigger className="transition-all duration-300 ease-in-out" />
            <div className="h-6 w-px bg-border/60" />
            <div className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
              PitchSide
            </div>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
          {children}
        </main>
        <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
          PitchSide · Built for grinders · EA FC 26 Weekend League
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
