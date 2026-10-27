import { CLAIMS, fraudLabel } from "@/lib/claims";

export function LiveTicker() {
  const rows = CLAIMS.filter((c) => c.risk >= 70).slice(0, 14);
  const loop = [...rows, ...rows];

  return (
    <div className="relative hidden h-10 w-full overflow-hidden border-y border-line bg-paper-2/50 sm:block" style={{ clipPath: "inset(0)" }}>
      <div className="ticker-track absolute top-0 left-0 flex gap-10 py-3 pr-10">
        {loop.map((c, i) => (
          <span
            key={`${c.id}-${i}`}
            className="flex items-center gap-3 whitespace-nowrap font-mono text-[11px] text-muted"
          >
            <span className="text-flag">{c.risk}</span>
            <span className="text-ink">{c.id}</span>
            <span>{c.cpt}</span>
            <span>{c.provider}</span>
            <span className="uppercase tracking-[0.12em] text-flag">
              {fraudLabel(c.fraudType)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
