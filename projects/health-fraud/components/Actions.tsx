"use client";

import { useState } from "react";

export function Actions({ id }: { id: string }) {
  const [note, setNote] = useState<string | null>(null);

  return (
    <div className="border border-line p-5">
      <p className="text-[11px] tracking-[0.16em] uppercase text-muted">
        Auditor action · {id}
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setNote("Marked confirmed. Packet queued for recoupment.")}
          className="border border-flag bg-flag px-3 py-2 text-[12px] tracking-[0.12em] text-paper uppercase"
        >
          Confirm fraud
        </button>
        <button
          type="button"
          onClick={() => setNote("Cleared. Line returns to auto-adjudication.")}
          className="border border-ink px-3 py-2 text-[12px] tracking-[0.12em] uppercase"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => setNote("Medical records requested from rendering NPI.")}
          className="border border-line px-3 py-2 text-[12px] tracking-[0.12em] uppercase text-muted hover:border-ink hover:text-ink"
        >
          Request records
        </button>
      </div>
      {note && <p className="mt-4 text-[13px] leading-relaxed text-muted">{note}</p>}
    </div>
  );
}
