import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";

/** Settings icon button that links to the full settings page. */
export function SettingsMenu() {
  return (
    <Link
      to="/settings"
      className="h-9 w-9 grid place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
      aria-label="Settings"
    >
      <Settings className="h-4 w-4" />
    </Link>
  );
}
