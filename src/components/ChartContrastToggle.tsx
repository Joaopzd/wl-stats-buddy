import { Contrast } from "lucide-react";
import { useChartTheme } from "@/lib/chartTheme";

/** Small pill that toggles the global high-contrast chart palette. */
export function ChartContrastToggle({ className = "" }: { className?: string }) {
  const { high, toggle } = useChartTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={high}
      title="Toggle high-contrast chart colors"
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
        high
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-input text-muted-foreground hover:text-foreground"
      } ${className}`}
    >
      <Contrast className="h-3 w-3" />
      High contrast
    </button>
  );
}
