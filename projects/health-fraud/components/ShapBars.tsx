import type { ShapHit } from "@/lib/claims";

export function ShapBars({ items }: { items: ShapHit[] }) {
  const max = Math.max(...items.map((s) => Math.abs(s.impact)), 0.01);
  return (
    <ul className="flex flex-col gap-3">
      {items.map((s) => {
        const pos = s.impact >= 0;
        const w = (Math.abs(s.impact) / max) * 50;
        return (
          <li key={s.feature} className="grid grid-cols-[1fr_120px_1fr] items-center gap-2 text-[12px]">
            <span className="truncate text-right font-mono text-[11px] text-muted">
              {pos ? s.feature : ""}
            </span>
            <div className="relative h-2 bg-paper-2">
              <div
                className={`absolute top-0 h-2 ${pos ? "left-1/2 bg-flag" : "right-1/2 bg-forest"}`}
                style={{ width: `${w}%` }}
              />
              <div className="absolute left-1/2 top-0 h-2 w-px bg-ink/30" />
            </div>
            <span className="truncate font-mono text-[11px] text-muted">
              {pos ? "" : s.feature}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
