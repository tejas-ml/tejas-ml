"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  patternLabel,
  usdExact,
  type CmsLine,
  type CmsPattern,
} from "@/lib/cms";

const PATTERNS: Array<"all" | CmsPattern> = [
  "all",
  "upcoding",
  "fee-outlier",
  "injection",
  "lab",
  "watch",
];

export function CmsQueue({
  lines,
  source,
  year,
  error,
}: {
  lines: CmsLine[];
  source: string;
  year: number;
  error?: string;
}) {
  const [q, setQ] = useState("");
  const [pattern, setPattern] = useState<(typeof PATTERNS)[number]>("all");
  const [minRisk, setMinRisk] = useState(40);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return lines.filter((l) => {
      if (pattern !== "all" && l.pattern !== pattern) return false;
      if (l.risk < minRisk) return false;
      if (!needle) return true;
      return (
        l.name.toLowerCase().includes(needle) ||
        l.npi.includes(needle) ||
        l.hcpcs.includes(needle) ||
        l.specialty.toLowerCase().includes(needle) ||
        l.state.toLowerCase().includes(needle) ||
        l.city.toLowerCase().includes(needle)
      );
    });
  }, [lines, q, pattern, minRisk]);

  const flagged = lines.filter((l) => l.risk >= 72).length;
  const excess = lines
    .filter((l) => l.risk >= 50)
    .reduce((s, l) => s + Math.max(0, l.charge - l.allowed) * l.services, 0);

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10">
      <div className="flex flex-col gap-2 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-muted">
            Live queue · CMS PUF CY {year}
          </p>
          <h1 className="mt-2 font-serif text-4xl italic">SIU queue</h1>
        </div>
        <p className="max-w-sm text-[13px] leading-relaxed text-muted">
          Real Medicare Part B utilization, aggregated to NPI × HCPCS × place of
          service. No patient names. A high score is a sampling signal, not a
          fraud finding.
        </p>
      </div>

      {error && (
        <p className="mt-6 border border-flag/30 bg-flag-soft/40 px-4 py-3 text-[13px] text-flag">
          Could not reach CMS ({error}). Retry in a minute.
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
        <Stat k="Lines scored" v={String(lines.length)} />
        <Stat k="Flagged" v={String(flagged)} hint="risk ≥ 72" />
        <Stat k="HCPCS" v="4" hint="99215, 80053, 64493, 20610" />
        <Stat k="Charge − allowed" v={usdExact(excess)} hint="flagged × volume" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="flex flex-col gap-6">
          <label className="block">
            <span className="text-[11px] tracking-[0.16em] uppercase text-muted">
              Search
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="NPI, name, CPT, state"
              className="mt-2 w-full border border-line bg-transparent px-3 py-2 text-[13px] outline-none placeholder:text-muted/60 focus:border-ink"
            />
          </label>

          <div>
            <p className="text-[11px] tracking-[0.16em] uppercase text-muted">
              Signal
            </p>
            <div className="mt-2 flex flex-wrap gap-2 lg:flex-col lg:gap-0">
              {PATTERNS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPattern(p)}
                  className={`border border-line px-2 py-1.5 text-[12px] lg:border-x-0 lg:border-t-0 lg:px-0 lg:py-2 lg:text-left lg:text-[13px] ${
                    pattern === p
                      ? "border-ink bg-ink text-paper lg:border-line lg:bg-transparent lg:text-ink"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {p === "all" ? "all signals" : patternLabel(p).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="flex justify-between text-[11px] tracking-[0.16em] uppercase text-muted">
              Min risk <span className="tabular text-ink">{minRisk}</span>
            </span>
            <input
              type="range"
              min={0}
              max={90}
              step={1}
              value={minRisk}
              onChange={(e) => setMinRisk(Number(e.target.value))}
              className="mt-4 w-full"
            />
          </label>

          <p className="text-[11px] leading-relaxed text-muted">{source}</p>
          <Link
            href="/sample"
            className="text-[12px] tracking-[0.08em] uppercase text-muted hover:text-ink"
          >
            Synthetic sample →
          </Link>
        </aside>

        <div>
          <p className="mb-3 text-[12px] text-muted">
            {rows.length} line{rows.length === 1 ? "" : "s"}
          </p>
          <ul className="divide-y divide-line border border-line md:hidden">
            {rows.map((l) => (
              <li key={l.id}>
                <Link href={`/queue/${l.id}`} className="block px-3 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[13px]">{l.name}</span>
                    <span className={riskClass(l.risk)}>{l.risk}</span>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-muted">
                    {l.hcpcs} · {l.npi} · {l.state}
                  </p>
                  <p className="mt-1 text-[11px] tracking-[0.08em] uppercase text-flag">
                    {patternLabel(l.pattern)}
                  </p>
                </Link>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="px-3 py-10 text-center text-[13px] text-muted">
                No lines match these filters.
              </li>
            )}
          </ul>
          <div className="hidden overflow-x-auto border border-line md:block">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead className="border-b border-line bg-paper-2/60 text-[10px] tracking-[0.16em] uppercase text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Risk</th>
                  <th className="px-3 py-2 font-medium">Provider</th>
                  <th className="px-3 py-2 font-medium">HCPCS</th>
                  <th className="px-3 py-2 font-medium">Services</th>
                  <th className="px-3 py-2 font-medium">Charge</th>
                  <th className="px-3 py-2 font-medium">× allowed</th>
                  <th className="px-3 py-2 font-medium">Signal</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-line last:border-0 hover:bg-paper-2/40"
                  >
                    <td className="px-3 py-3">
                      <span className={riskClass(l.risk)}>{l.risk}</span>
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/queue/${l.id}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {l.name}
                      </Link>
                      <p className="font-mono text-[11px] text-muted">
                        {l.npi} · {l.specialty} · {l.city}, {l.state}
                      </p>
                    </td>
                    <td className="px-3 py-3 font-mono text-[12px]">{l.hcpcs}</td>
                    <td className="px-3 py-3 tabular">
                      {l.services.toLocaleString()}
                      <p className="text-[11px] text-muted">
                        {l.intensity.toFixed(1)} / bene
                      </p>
                    </td>
                    <td className="px-3 py-3 tabular">{usdExact(l.charge)}</td>
                    <td className="px-3 py-3 tabular">{l.ratio.toFixed(1)}×</td>
                    <td className="px-3 py-3">
                      <span className="text-[11px] tracking-[0.08em] uppercase text-flag">
                        {patternLabel(l.pattern)}
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-muted">
                      No lines match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function riskClass(risk: number) {
  return `tabular font-medium ${
    risk >= 72 ? "text-flag" : risk >= 42 ? "text-amber" : "text-forest"
  }`;
}

function Stat({ k, v, hint }: { k: string; v: string; hint?: string }) {
  return (
    <div className="bg-paper px-4 py-5">
      <p className="text-[11px] tracking-[0.16em] uppercase text-muted">{k}</p>
      <p className="mt-2 font-serif text-3xl tabular leading-none">{v}</p>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
